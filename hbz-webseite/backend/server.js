require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'limbus.davidlokison.com',
  port: process.env.DB_PORT || 3310,
  user: process.env.DB_USER || 'test-user',
  password: process.env.DB_PASSWORD || 'SuperHBZS3cr€t',
  database: process.env.DB_NAME || 'hbz-registrations',
  multipleStatements: false,
});

/**
 * Request-scoped logger helper
 */
function reqId() {
  return crypto.randomBytes(4).toString('hex');
}
function log(rid, ...args) {
  console.log(`[${rid}]`, ...args);
}
function warn(rid, ...args) {
  console.warn(`[${rid}]`, ...args);
}
function errlog(rid, ...args) {
  console.error(`[${rid}]`, ...args);
}

/**
 * UUID (BINARY(16)) -> string
 */
function bufferUuidToString(buf) {
  const hex = buf.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * BINARY(4) -> hex(8)
 */
function bufferBin4ToHex8(buf) {
  return buf.toString('hex');
}

function isHex8(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{8}$/.test(value);
}

function assertHex8(value, fieldName) {
  if (typeof value !== 'string' || !/^[0-9a-fA-F]{8}$/.test(value)) {
    throw new Error(`${fieldName} must be an 8-char hex string (e.g. "2f1a9c0b"), got: ${JSON.stringify(value)}`);
  }
}

async function detectUuidBinModeForEvent(connection, eventId) {
  const [rowsNoSwap] = await connection.query(
    'SELECT COUNT(*) AS cnt FROM hbz_events WHERE id = UUID_TO_BIN(?)',
    [eventId]
  );
  if (rowsNoSwap?.[0]?.cnt === 1) return { mode: 'noswap' };

  const [rowsSwap] = await connection.query(
    'SELECT COUNT(*) AS cnt FROM hbz_events WHERE id = UUID_TO_BIN(?, 1)',
    [eventId]
  );
  if (rowsSwap?.[0]?.cnt === 1) return { mode: 'swap' };

  return { mode: 'unknown' };
}

// Health-Check gegen DB
app.get('/health', async (req, res) => {
  const rid = reqId();
  log(rid, '[GET] /health called');

  try {
    const [rows] = await pool.query('SELECT 1 AS ok, DATABASE() AS db');
    return res.json({ status: 'ok', db: rows[0].db, ping: rows[0].ok });
  } catch (e) {
    errlog(rid, 'DB health check error:', e);
    return res.status(500).json({ status: 'error', error: e.message });
  }
});

// GET /events/open
app.get('/events/open', async (req, res) => {
  const rid = reqId();
  log(rid, '[GET] /events/open called');

  try {
    const [rows] = await pool.query('SELECT * FROM v_open_events');

    const processedRows = rows.map(row => {
      const processed = { ...row };
      // hbz_events.id is BINARY(16)
      if (processed.id && Buffer.isBuffer(processed.id)) processed.id = bufferUuidToString(processed.id);
      return processed;
    });

    const sample = processedRows.slice(0, 3).map(r => ({ id: r.id, title: r.title }));
    log(rid, '[events/open] sample:', sample);

    return res.json(processedRows);
  } catch (e) {
    errlog(rid, 'Error fetching open events:', e);
    return res.status(500).json({ error: 'Failed to fetch open events', details: e.message });
  }
});

// GET /items
app.get('/items', async (req, res) => {
  const rid = reqId();
  log(rid, '[GET] /items called');

  try {
    const [rows] = await pool.query('SELECT * FROM v_item_articles');

    const processedRows = rows.map(row => {
      const processed = { ...row };

      // hbz_articles.id is BINARY(4) -> MUST become hex(8) for frontend
      if (processed.id && Buffer.isBuffer(processed.id)) {
        processed.id = bufferBin4ToHex8(processed.id);
      } else if (processed.id != null) {
        processed.id = String(processed.id);
      }

      processed.price = processed.price != null ? (parseFloat(processed.price) || 0) : 0;
      return processed;
    });

    const sample = processedRows.slice(0, 10).map(r => ({ id: r.id, isHex8: isHex8(r.id), description: r.description }));
    log(rid, '[items] sample ids (expect hex8=true):', sample);

    const bad = processedRows.filter(r => !isHex8(r.id)).slice(0, 10);
    if (bad.length) {
      warn(rid, '[items] WARNING: some item IDs are not hex(8)! sample:', bad.map(b => b.id));
    }

    return res.json(processedRows);
  } catch (e) {
    errlog(rid, 'Error fetching items:', e);
    return res.status(500).json({ error: 'Failed to fetch items', details: e.message });
  }
});

// POST /pricecheck
app.post('/pricecheck', async (req, res) => {
  const rid = reqId();
  log(rid, '[POST] /pricecheck body:', JSON.stringify(req.body, null, 2));

  const { eventId, persons = [] } = req.body;
  if (!eventId || !persons || persons.length === 0) {
    return res.status(400).json({ error: 'eventId and persons array are required' });
  }

  const connection = await pool.getConnection();
  try {
    const eventMode = await detectUuidBinModeForEvent(connection, eventId);
    log(rid, '[pricecheck] eventId mode:', eventMode);

    if (eventMode.mode === 'unknown') {
      return res.status(400).json({
        error: 'eventId not found in hbz_events (neither UUID_TO_BIN(?) nor UUID_TO_BIN(?,1)).',
        eventId
      });
    }

    const results = [];

    for (const [idx, person] of persons.entries()) {
      const callSql =
        eventMode.mode === 'swap'
          ? 'CALL p_article_from_person_data(UUID_TO_BIN(?, 1), ?, ?)'
          : 'CALL p_article_from_person_data(UUID_TO_BIN(?), ?, ?)';

      log(rid, `[pricecheck] person#${idx + 1} call:`, { birthday: person.birthday, flag_organization: person.flag_organization });

      const [rows] = await connection.query(callSql, [
        eventId,
        person.birthday || null,
        person.flag_organization ? 1 : 0
      ]);

      let articleData = null;
      if (Array.isArray(rows)) {
        if (rows.length > 0 && Array.isArray(rows[0])) articleData = rows[0][0] || null;
        else if (rows.length > 0 && rows[0] && typeof rows[0] === 'object') articleData = rows[0] || null;
      }

      if (articleData) {
        let articleId = articleData.id;

        // hbz_articles.id is BINARY(4) -> return hex(8)
        if (articleId && Buffer.isBuffer(articleId)) articleId = bufferBin4ToHex8(articleId);

        results.push({
          articleId,
          description: articleData.description,
          price: parseFloat(articleData.price) || 0
        });
      }
    }

    log(rid, '[pricecheck] results sample:', results.slice(0, 10));

    return res.json(results);
  } catch (e) {
    errlog(rid, 'Error in pricecheck:', e);
    return res.status(500).json({ error: 'Failed to check prices', details: e.message, code: e.code });
  } finally {
    connection.release();
  }
});

// POST /registrations
app.post('/registrations', async (req, res) => {
  const rid = reqId();
  log(rid, '[POST] /registrations body:', JSON.stringify(req.body, null, 2));

  const { eventId, registration, persons = [], items = [] } = req.body;
  if (!eventId || !registration) {
    return res.status(400).json({ error: 'eventId and registration are required' });
  }

  const connection = await pool.getConnection();

  try {
    const [who] = await connection.query(
      'SELECT DATABASE() AS db, @@hostname AS mysqlHost, @@port AS mysqlPort, CURRENT_USER() AS currentUser'
    );
    log(rid, '[registrations] connected to:', who?.[0]);

    const eventMode = await detectUuidBinModeForEvent(connection, eventId);
    log(rid, '[registrations] eventId mode:', eventMode);

    if (eventMode.mode === 'unknown') {
      return res.status(400).json({
        error: 'eventId not found in hbz_events (neither UUID_TO_BIN(?) nor UUID_TO_BIN(?,1)).',
        eventId
      });
    }

    await connection.query('SET @RegistrationId = NULL');

    // 1) open
    log(rid, 'Calling p_registration_open...');
    const openSql =
      eventMode.mode === 'swap'
        ? 'CALL p_registration_open(UUID_TO_BIN(?, 1), ?, ?, ?, ?, ?, ?)'
        : 'CALL p_registration_open(UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)';

    await connection.query(openSql, [
      eventId,
      (registration.name || 'Unbekannt').trim(),
      (registration.address || '').trim(),
      (registration.email || '').trim(),
      (registration.phone || '').trim(),
      (registration.emergency || '').trim(),
      registration.comment || null
    ]);
    log(rid, 'p_registration_open completed');

    const [ridRows] = await connection.query(
      'SELECT @RegistrationId AS registrationId, HEX(@RegistrationId) AS registrationIdHex'
    );
    const registrationHex = ridRows?.[0]?.registrationIdHex || null;
    log(rid, '[registrations] @RegistrationId after open:', ridRows?.[0]);

    if (!ridRows?.[0]?.registrationId) {
      throw new Error('DB session variable @RegistrationId was not set after p_registration_open (trigger missing/broken?).');
    }

    // 2) persons
    for (const [idx, p] of persons.entries()) {
      const name = (p.name || '').trim();
      const birthday = p.birthday || null;
      const address = (p.address || '').trim();
      const comment = p.comment || null;

      if (!name) return res.status(400).json({ error: `Person.name is required (index ${idx})` });
      if (!birthday) return res.status(400).json({ error: `Person.birthday is required (index ${idx})` });
      if (!address) return res.status(400).json({ error: `Person.address is required (index ${idx})` });

      const flagVeg = p.flag_vegetarian ? 1 : 0;
      const flagOrg = p.flag_organization ? 1 : 0;

      log(rid, `[registrations] CALL p_registration_person #${idx + 1}:`, {
        name,
        birthday,
        addressLen: address.length,
        flagVeg,
        flagOrg
      });

      await connection.query(
        'CALL p_registration_person(?, ?, ?, ?, ?, ?)',
        [name, birthday, address, comment, flagVeg, flagOrg]
      );
    }
    log(rid, '[registrations] persons added:', persons.length);

    // 3) items (strict hex(8) + UNHEX)
    for (const [idx, item] of items.entries()) {
      if (!item?.articleId) {
        return res.status(400).json({ error: `Item.articleId is required (index ${idx})` });
      }

      log(rid, `[registrations] raw item #${idx + 1}:`, item);

      assertHex8(item.articleId, `items[${idx}].articleId`);

      // Optional but very helpful: existence check for clearer errors
      const [exists] = await connection.query(
        'SELECT COUNT(*) AS cnt FROM hbz_articles WHERE id = UNHEX(?)',
        [item.articleId]
      );
      if ((exists?.[0]?.cnt || 0) !== 1) {
        throw new Error(`items[${idx}].articleId "${item.articleId}" does not exist in hbz_articles (cnt=${exists?.[0]?.cnt}).`);
      }

      log(rid, `[registrations] CALL p_registration_item #${idx + 1}:`, { articleIdHex8: item.articleId, comment: item.comment || null });

      await connection.query(
        'CALL p_registration_item(UNHEX(?), ?)',
        [item.articleId, item.comment || null]
      );
    }
    log(rid, '[registrations] items added:', items.length);

    // 4) finish
    log(rid, 'Calling p_registration_finish...');
    await connection.query('CALL p_registration_finish()');
    log(rid, 'p_registration_finish completed');

    return res.status(201).json({
      success: true,
      personsInserted: persons.length,
      itemsInserted: items.length,
      registrationIdHex: registrationHex,
      requestId: rid
    });
  } catch (e) {
    errlog(rid, 'Error creating registration:');
    errlog(rid, 'Name:', e.name);
    errlog(rid, 'Code:', e.code);
    errlog(rid, 'Message:', e.message);
    errlog(rid, 'Stack:', e.stack);

    return res.status(500).json({
      error: 'Failed to create registration',
      details: e.message,
      meta: { name: e.name, code: e.code },
      requestId: rid
    });
  } finally {
    connection.release();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`HBZ backend listening on http://localhost:${port}`);
});
