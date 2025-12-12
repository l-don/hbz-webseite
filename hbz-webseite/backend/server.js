require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

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

async function detectUuidBinModeForArticle(connection, articleId) {
  // Best effort: if hbz_articles exists. If not, we fall back.
  try {
    const [noSwap] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM hbz_articles WHERE id = UUID_TO_BIN(?)',
      [articleId]
    );
    if (noSwap?.[0]?.cnt === 1) return { mode: 'noswap' };

    const [swap] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM hbz_articles WHERE id = UUID_TO_BIN(?, 1)',
      [articleId]
    );
    if (swap?.[0]?.cnt === 1) return { mode: 'swap' };

    return { mode: 'unknown' };
  } catch {
    return { mode: 'unknown' };
  }
}

// Health-Check gegen DB
app.get('/health', async (req, res) => {
  console.log('[GET] /health called');
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return res.json({ status: 'ok', db: rows[0].ok });
  } catch (err) {
    console.error('DB health check error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// GET /events/open - Fetch open events
app.get('/events/open', async (req, res) => {
  console.log('[GET] /events/open called');
  try {
    const [rows] = await pool.query('SELECT * FROM v_open_events');

    const processedRows = rows.map(row => {
      const processed = { ...row };
      if (processed.id && Buffer.isBuffer(processed.id)) {
        processed.id = bufferUuidToString(processed.id);
      }
      return processed;
    });

    return res.json(processedRows);
  } catch (err) {
    console.error('Error fetching open events:', err);
    return res.status(500).json({ error: 'Failed to fetch open events', details: err.message });
  }
});

// GET /items - Fetch bookable items
app.get('/items', async (req, res) => {
  console.log('[GET] /items called');
  try {
    const [rows] = await pool.query('SELECT * FROM v_item_articles');

    const processedRows = rows.map(row => {
      const processed = { ...row };

      if (processed.id && Buffer.isBuffer(processed.id)) {
        processed.id = bufferUuidToString(processed.id);
      }
      if (processed.price) {
        processed.price = parseFloat(processed.price) || 0;
      }

      return processed;
    });

    return res.json(processedRows);
  } catch (err) {
    console.error('Error fetching items:', err);
    return res.status(500).json({ error: 'Failed to fetch items', details: err.message });
  }
});

// POST /pricecheck - Get article info for persons
app.post('/pricecheck', async (req, res) => {
  console.log('[POST] /pricecheck body:', JSON.stringify(req.body, null, 2));

  const { eventId, persons = [] } = req.body;

  if (!eventId || !persons || persons.length === 0) {
    return res.status(400).json({ error: 'eventId and persons array are required' });
  }

  const connection = await pool.getConnection();
  try {
    const eventMode = await detectUuidBinModeForEvent(connection, eventId);
    console.log('[pricecheck] eventId mode:', eventMode);

    if (eventMode.mode === 'unknown') {
      return res.status(400).json({
        error: 'eventId not found in hbz_events (neither UUID_TO_BIN(?) nor UUID_TO_BIN(?,1)).',
        eventId
      });
    }

    const results = [];

    for (let i = 0; i < persons.length; i++) {
      const person = persons[i];
      const { birthday, flag_organization } = person;

      const callSql =
        eventMode.mode === 'swap'
          ? 'CALL p_article_from_person_data(UUID_TO_BIN(?, 1), ?, ?)'
          : 'CALL p_article_from_person_data(UUID_TO_BIN(?), ?, ?)';

      const [rows] = await connection.query(callSql, [
        eventId,
        birthday || null,
        flag_organization ? 1 : 0
      ]);

      let articleData = null;
      if (Array.isArray(rows)) {
        if (rows.length > 0 && Array.isArray(rows[0])) {
          articleData = rows[0][0] || null;
        } else if (rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
          articleData = rows[0] || null;
        }
      }

      if (articleData) {
        let articleId = articleData.id;
        if (articleId && Buffer.isBuffer(articleId)) {
          articleId = bufferUuidToString(articleId);
        }

        results.push({
          articleId,
          description: articleData.description,
          price: parseFloat(articleData.price) || 0
        });
      }
    }

    return res.json(results);
  } catch (err) {
    console.error('Error in pricecheck:', err);
    return res.status(500).json({
      error: 'Failed to check prices',
      details: err.message,
      code: err.code
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /registrations
 *
 * Uses:
 * - p_registration_open
 * - DIRECT INSERT into hbz_persons (workaround for broken p_registration_person)
 * - p_registration_item
 * - p_registration_finish
 */
app.post('/registrations', async (req, res) => {
  console.log('[POST] /registrations body:', JSON.stringify(req.body, null, 2));

  const { eventId, registration, persons = [], items = [] } = req.body;

  if (!eventId || !registration) {
    return res.status(400).json({ error: 'eventId and registration are required' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    await connection.query('SET @RegistrationId = NULL');

    // Determine correct UUID_TO_BIN mode for eventId
    const eventMode = await detectUuidBinModeForEvent(connection, eventId);
    console.log('[registrations] eventId mode:', eventMode);

    if (eventMode.mode === 'unknown') {
      throw Object.assign(new Error('eventId not found in hbz_events (noswap or swap).'), {
        code: 'EVENT_NOT_FOUND'
      });
    }

    // 1) Open registration
    console.log('Calling p_registration_open...');
    const openSql =
      eventMode.mode === 'swap'
        ? 'CALL p_registration_open(UUID_TO_BIN(?, 1), ?, ?, ?, ?, ?, ?)'
        : 'CALL p_registration_open(UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)';

    await connection.query(openSql, [
      eventId,
      registration.name || 'Unbekannt',
      registration.address || '',
      registration.email || '',
      registration.phone || '',
      registration.emergency || '',
      registration.comment || null
    ]);
    console.log('p_registration_open completed');

    // 1b) Make sure @RegistrationId exists and parent row is present
    const [ridRows] = await connection.query(
      'SELECT @RegistrationId AS registrationId, HEX(@RegistrationId) AS registrationIdHex'
    );
    console.log('After p_registration_open, @RegistrationId:', ridRows?.[0]);

    const [dbg] = await connection.query(`
      SELECT
        HEX(@RegistrationId) AS regIdHex,
        BIN_TO_UUID(@RegistrationId) AS regIdUuid_noSwap,
        BIN_TO_UUID(@RegistrationId, 1) AS regIdUuid_swap
    `);
    console.log('DEBUG @RegistrationId interpretations:', dbg?.[0]);

    if (!ridRows?.[0]?.registrationId) {
      throw new Error('DB session variable @RegistrationId was not set after p_registration_open.');
    }

    const [existsRows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM hbz_registrations WHERE id = @RegistrationId'
    );
    console.log('hbz_registrations row exists for @RegistrationId:', existsRows?.[0]);

    if (!existsRows?.[0] || existsRows[0].cnt !== 1) {
      throw new Error('Inserted registration row not found for @RegistrationId.');
    }

    // 2) Insert persons directly (workaround)
    // hbz_persons columns:
    // id (default), registration (BINARY16), name, birthday, address, comment, flag_vegetarian BIT(1), flag_organization BIT(2)
    for (const p of persons) {
      const name = (p.name || '').trim();
      const birthday = p.birthday || null;
      const address = (p.address || '').trim();
      const comment = p.comment || null;

      if (!name) throw new Error('Person.name is required');
      if (!birthday) throw new Error('Person.birthday is required');
      if (!address) throw new Error('Person.address is required');

      // bit values: use binary literals
      const flagVeg = p.flag_vegetarian ? 1 : 0;
      const flagOrg = p.flag_organization ? 1 : 0; // we only support 0/1 right now

      console.log('Inserting person directly into hbz_persons:', { name, birthday, address, flagVeg, flagOrg });

      await connection.query(
        `
        INSERT INTO hbz_persons
          (registration, name, birthday, address, comment, flag_vegetarian, flag_organization)
        VALUES
          (@RegistrationId, ?, ?, ?, ?, b?, b?)
        `,
        [
          name,
          birthday,
          address,
          comment,
          flagVeg ? '1' : '0',      // for b?
          flagOrg ? '01' : '00',    // BIT(2): 00 or 01
        ]
      );
    }
    console.log('All persons inserted (direct insert)');

    // 3) Items via procedure
    for (const item of items) {
      console.log('Calling p_registration_item for article', item.articleId);

      const articleMode = await detectUuidBinModeForArticle(connection, item.articleId);
      const modeToUse = articleMode.mode === 'unknown' ? eventMode.mode : articleMode.mode;

      const itemSql =
        modeToUse === 'swap'
          ? 'CALL p_registration_item(UUID_TO_BIN(?, 1), ?)'
          : 'CALL p_registration_item(UUID_TO_BIN(?), ?)';

      await connection.query(itemSql, [item.articleId, item.comment || null]);
    }
    console.log('All items inserted');

    // 4) Finish
    console.log('Calling p_registration_finish...');
    await connection.query('CALL p_registration_finish()');
    console.log('p_registration_finish completed');

    await connection.commit();
    console.log('Transaction committed successfully');

    return res.status(201).json({
      success: true,
      personsInserted: persons.length,
      itemsInserted: items.length,
    });
  } catch (err) {
    console.error('Error creating registration, rolling back:');
    console.error('Name:', err.name);
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);

    await connection.rollback();
    return res.status(500).json({
      error: 'Failed to create registration',
      details: err.message,
      meta: { name: err.name, code: err.code }
    });
  } finally {
    connection.release();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`HBZ backend listening on http://localhost:${port}`);
});
