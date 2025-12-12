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
    const [rows] = await pool.query('SELECT 1 AS ok, DATABASE() AS db');
    return res.json({ status: 'ok', db: rows[0].db, ping: rows[0].ok });
  } catch (err) {
    console.error('DB health check error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// GET /events/open
app.get('/events/open', async (req, res) => {
  console.log('[GET] /events/open called');
  try {
    const [rows] = await pool.query('SELECT * FROM v_open_events');

    const processedRows = rows.map(row => {
      const processed = { ...row };
      if (processed.id && Buffer.isBuffer(processed.id)) processed.id = bufferUuidToString(processed.id);
      return processed;
    });

    return res.json(processedRows);
  } catch (err) {
    console.error('Error fetching open events:', err);
    return res.status(500).json({ error: 'Failed to fetch open events', details: err.message });
  }
});

// GET /items
app.get('/items', async (req, res) => {
  console.log('[GET] /items called');
  try {
    const [rows] = await pool.query('SELECT * FROM v_item_articles');

    const processedRows = rows.map(row => {
      const processed = { ...row };
      if (processed.id && Buffer.isBuffer(processed.id)) processed.id = bufferUuidToString(processed.id);
      if (processed.price) processed.price = parseFloat(processed.price) || 0;
      return processed;
    });

    return res.json(processedRows);
  } catch (err) {
    console.error('Error fetching items:', err);
    return res.status(500).json({ error: 'Failed to fetch items', details: err.message });
  }
});

// POST /pricecheck
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

    for (const person of persons) {
      const callSql =
        eventMode.mode === 'swap'
          ? 'CALL p_article_from_person_data(UUID_TO_BIN(?, 1), ?, ?)'
          : 'CALL p_article_from_person_data(UUID_TO_BIN(?), ?, ?)';

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
        if (articleId && Buffer.isBuffer(articleId)) articleId = bufferUuidToString(articleId);

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
    return res.status(500).json({ error: 'Failed to check prices', details: err.message, code: err.code });
  } finally {
    connection.release();
  }
});

app.post('/registrations', async (req, res) => {
  console.log('[POST] /registrations body:', JSON.stringify(req.body, null, 2));

  const { eventId, registration, persons = [], items = [] } = req.body;
  if (!eventId || !registration) {
    return res.status(400).json({ error: 'eventId and registration are required' });
  }

  const connection = await pool.getConnection();
  let registrationHex = null;

  await connection.beginTransaction();

  try {
    const [who] = await connection.query(
      'SELECT DATABASE() AS db, @@hostname AS mysqlHost, @@port AS mysqlPort, CURRENT_USER() AS currentUser'
    );
    console.log('[registrations] connected to:', who?.[0]);

    await connection.query('SET @RegistrationId = NULL');

    const eventMode = await detectUuidBinModeForEvent(connection, eventId);
    console.log('[registrations] eventId mode:', eventMode);

    if (eventMode.mode === 'unknown') {
      throw Object.assign(new Error('eventId not found in hbz_events (noswap or swap).'), { code: 'EVENT_NOT_FOUND' });
    }

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

    const [ridRows] = await connection.query(
      'SELECT @RegistrationId AS registrationId, HEX(@RegistrationId) AS registrationIdHex'
    );
    console.log('After p_registration_open, @RegistrationId:', ridRows?.[0]);
    registrationHex = ridRows?.[0]?.registrationIdHex || null;

    if (!ridRows?.[0]?.registrationId) {
      throw new Error('DB session variable @RegistrationId was not set after p_registration_open.');
    }

    const [existsRows] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM hbz_registrations WHERE id = @RegistrationId'
    );
    console.log('hbz_registrations row exists for @RegistrationId:', existsRows?.[0]);

    // Persons: direct insert
    for (const p of persons) {
      const name = (p.name || '').trim();
      const birthday = p.birthday || null;
      const address = (p.address || '').trim();
      const comment = p.comment || null;

      if (!name) throw new Error('Person.name is required');
      if (!birthday) throw new Error('Person.birthday is required');
      if (!address) throw new Error('Person.address is required');

      const flagVeg = p.flag_vegetarian ? 1 : 0;
      const flagOrg = p.flag_organization ? 1 : 0;

      console.log('Inserting person directly into hbz_persons:', { name, birthday, address, flagVeg, flagOrg });

      await connection.query(
        `
        INSERT INTO hbz_persons
          (registration, name, birthday, address, comment, flag_vegetarian, flag_organization)
        VALUES
          (@RegistrationId, ?, ?, ?, ?, ?, ?)
        `,
        [name, birthday, address, comment, flagVeg, flagOrg]
      );
    }

    const [countInTx] = await connection.query(
      'SELECT COUNT(*) AS cnt FROM hbz_persons WHERE registration = @RegistrationId'
    );
    console.log('[registrations] persons inserted for @RegistrationId (inside TX):', countInTx?.[0]);

    // Items via procedure
    for (const item of items) {
      const articleMode = await detectUuidBinModeForArticle(connection, item.articleId);
      const modeToUse = articleMode.mode === 'unknown' ? eventMode.mode : articleMode.mode;

      const itemSql =
        modeToUse === 'swap'
          ? 'CALL p_registration_item(UUID_TO_BIN(?, 1), ?)'
          : 'CALL p_registration_item(UUID_TO_BIN(?), ?)';

      await connection.query(itemSql, [item.articleId, item.comment || null]);
    }

    // COMMIT FIRST
    await connection.commit();
    console.log('Transaction committed successfully');

    // Sanity check: after commit we cannot rely on @RegistrationId (new session variables can be reset by procedures),
    // so we check by the hex we captured.
    if (registrationHex) {
      const [countAfterCommit] = await connection.query(
        'SELECT COUNT(*) AS cnt FROM hbz_persons WHERE registration = UNHEX(?)',
        [registrationHex]
      );
      console.log('[registrations] persons for registrationHex (after commit, same conn):', countAfterCommit?.[0]);
    }

    // THEN call finish in a fresh connection (outside TX)
    console.log('Calling p_registration_finish (outside TX, new connection)...');
    const finishConn = await pool.getConnection();
    try {
      const [who2] = await finishConn.query(
        'SELECT DATABASE() AS db, @@hostname AS mysqlHost, @@port AS mysqlPort, CURRENT_USER() AS currentUser'
      );
      console.log('[finish] connected to:', who2?.[0]);

      await finishConn.query('CALL p_registration_finish()');
      console.log('p_registration_finish completed (outside TX)');
    } finally {
      finishConn.release();
    }

    return res.status(201).json({
      success: true,
      personsInserted: persons.length,
      itemsInserted: items.length,
      registrationIdHex: registrationHex,
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
