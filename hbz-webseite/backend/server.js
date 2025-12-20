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

// POST /registrations
app.post('/registrations', async (req, res) => {
  console.log('[POST] /registrations body:', JSON.stringify(req.body, null, 2));

  const { eventId, registration, persons = [], items = [] } = req.body;
  if (!eventId || !registration) {
    return res.status(400).json({ error: 'eventId and registration are required' });
  }

  // Wichtig: Keine beginTransaction() hier.
  // Die Procedures committen selbst, und sie verlassen sich auf die Session-Variable @RegistrationId.
  const connection = await pool.getConnection();

  try {
    const [who] = await connection.query(
      'SELECT DATABASE() AS db, @@hostname AS mysqlHost, @@port AS mysqlPort, CURRENT_USER() AS currentUser'
    );
    console.log('[registrations] connected to:', who?.[0]);

    const eventMode = await detectUuidBinModeForEvent(connection, eventId);
    console.log('[registrations] eventId mode:', eventMode);

    if (eventMode.mode === 'unknown') {
      return res.status(400).json({
        error: 'eventId not found in hbz_events (neither UUID_TO_BIN(?) nor UUID_TO_BIN(?,1)).',
        eventId
      });
    }

    // 1) Registrierung öffnen -> Trigger setzt @RegistrationId
    console.log('Calling p_registration_open...');
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
    console.log('p_registration_open completed');

    // Optional: @RegistrationId für Debug/Response abholen
    const [ridRows] = await connection.query(
      'SELECT @RegistrationId AS registrationId, HEX(@RegistrationId) AS registrationIdHex'
    );
    const registrationHex = ridRows?.[0]?.registrationIdHex || null;
    console.log('[registrations] @RegistrationId after open:', ridRows?.[0]);

    if (!ridRows?.[0]?.registrationId) {
      // Wenn das passiert, ist entweder der Trigger kaputt oder die Procedure läuft auf einer anderen Session
      throw new Error('DB session variable @RegistrationId was not set after p_registration_open (trigger missing/broken?).');
    }

    // 2) Personen hinzufügen (über Procedure wie vorgesehen)
    for (const p of persons) {
      const name = (p.name || '').trim();
      const birthday = p.birthday || null;
      const address = (p.address || '').trim();
      const comment = p.comment || null;

      if (!name) return res.status(400).json({ error: 'Person.name is required' });
      if (!birthday) return res.status(400).json({ error: 'Person.birthday is required' });
      if (!address) return res.status(400).json({ error: 'Person.address is required' });

      const flagVeg = p.flag_vegetarian ? 1 : 0;
      const flagOrg = p.flag_organization ? 1 : 0;

      // p_registration_person erwartet BIT(1)/BIT(1) in der Signatur, wir liefern 0/1.
      await connection.query(
        'CALL p_registration_person(?, ?, ?, ?, ?, ?)',
        [name, birthday, address, comment, flagVeg, flagOrg]
      );
    }
    console.log('[registrations] persons added:', persons.length);

    // 3) Items hinzufügen (über Procedure wie vorgesehen)
    for (const item of items) {
      if (!item?.articleId) return res.status(400).json({ error: 'Item.articleId is required' });

      // Hinweis: hbz_articles.id ist BINARY(4). Daher sollte articleId hier idealerweise als 8-hex-chars kommen
      // (oder als Buffer). Du verwendest aber detectUuidBinModeForArticle/UUID_TO_BIN Logik aus der alten Version,
      // die für BINARY(4) eigentlich nicht passt.
      //
      // Wir lassen daher hier *keine* UUID_TO_BIN Umwandlung zu und übergeben direkt.
      // Falls du im Frontend bisher UUIDs nutzt: das muss auf Artikel-IDs (8 hex chars) angepasst werden.
      await connection.query(
        'CALL p_registration_item(?, ?)',
        [item.articleId, item.comment || null]
      );
    }
    console.log('[registrations] items added:', items.length);

    // 4) Finish (Status setzen / E-Mail enqueue via Trigger-Kette)
    console.log('Calling p_registration_finish...');
    await connection.query('CALL p_registration_finish()');
    console.log('p_registration_finish completed');

    return res.status(201).json({
      success: true,
      personsInserted: persons.length,
      itemsInserted: items.length,
      registrationIdHex: registrationHex,
    });
  } catch (err) {
    console.error('Error creating registration:');
    console.error('Name:', err.name);
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);

    // Kein rollback: wir führen keine Backend-Transaktion mehr. Die DB-Prozeduren committen selbst.
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
