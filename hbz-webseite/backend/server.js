require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// CORS: ggf. Origin an deinen Frontend-Port anpassen (4200, 5173, ...)
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
});

// Health-Check gegen DB
app.get('/health', async (req, res) => {
  console.log('[GET] /health called');
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('DB health check rows:', rows);
    return res.json({ status: 'ok', db: rows[0].ok });
  } catch (err) {
    console.error('DB health check error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

/**
 * POST /registrations
 *
 * Body:
 * {
 *   "registration": {...},
 *   "persons": [...],
 *   "items": [...]
 * }
 *
 * Die eventId wird hier testweise fest auf
 * 02cd532f-5d57-4895-a724-940a4c3f51ae gesetzt.
 */
app.post('/registrations', async (req, res) => {
  console.log('[POST] /registrations body:', JSON.stringify(req.body, null, 2));

  const { registration, persons = [], items = [] } = req.body;

  // Feste Event-UUID aus hbz_events (BIN_TO_UUID(id))
  const eventId = '02cd532f-5d57-4895-a724-940a4c3f51ae';

  if (!eventId || !registration) {
    console.warn('Missing eventId or registration data');
    return res.status(400).json({ error: 'eventId and registration are required' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Namen ggf. für Anzeige trennen – in der DB gibt es nur "name"
    let firstname = registration.name;
    let lastname = '';

    if (registration.name) {
      const parts = registration.name.trim().split(' ');
      if (parts.length > 1) {
        lastname = parts.pop();
        firstname = parts.join(' ');
      }
    }
    const fullName = (firstname + ' ' + lastname).trim() || registration.name || 'Unbekannt';

    // 1) Registrierung einfügen
    //    id wird von DB via DEFAULT (UUID_TO_BIN(uuid())) erzeugt
    //    Trigger setzt @RegistrationId (binary(16)) für diese Session
    const regSql = `
      INSERT INTO hbz_registrations
        (event, name, address, email, phone, emergency, comment)
      VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)
    `;
    const regParams = [
      eventId,                      // Text-UUID, wird durch UUID_TO_BIN konvertiert
      fullName,
      registration.address,
      registration.email,
      registration.phone,
      registration.emergency,
      registration.comment || null,
    ];

    console.log('Executing hbz_registrations INSERT:', regSql, regParams);
    await connection.execute(regSql, regParams);

    // 2) Registrierungs-ID aus Trigger lesen (als Text-UUID)
    const [regIdRows] = await connection.query(
      'SELECT BIN_TO_UUID(@RegistrationId) AS registrationId'
    );
    const registrationIdText = regIdRows?.[0]?.registrationId || null;
    console.log('RegistrationId from trigger (text UUID):', registrationIdText);

    // 3) Personen einfügen
    for (const person of persons) {
      console.log('Inserting person for', person.name);

      const flagVeg = person.flag_vegetarian ? 1 : 0; // BIT(1)
      const flagOrg = person.flag_organization ?? 0;  // BIT(2)

      const personSql = `
        INSERT INTO hbz_persons
          (registration, name, birthday, address, comment, flag_vegetarian, flag_organization)
        VALUES (@RegistrationId, ?, ?, ?, ?, ?, ?)
      `;
      const personParams = [
        person.name,
        person.birthday, // 'YYYY-MM-DD'
        person.address,
        person.comment || null,
        flagVeg,
        flagOrg,
      ];
      console.log('Executing hbz_persons INSERT:', personSql, personParams);
      await connection.execute(personSql, personParams);
    }

    // 4) Items einfügen
    for (const item of items) {
      console.log('Inserting item for article', item.articleId);

      const itemSql = `
        INSERT INTO hbz_items
          (registration, article, comment)
        VALUES (@RegistrationId, UUID_TO_BIN(?), ?)
      `;
      const itemParams = [
        item.articleId,             // Text-UUID aus hbz_articles
        item.comment || null,
      ];
      console.log('Executing hbz_items INSERT:', itemSql, itemParams);
      await connection.execute(itemSql, itemParams);
    }

    await connection.commit();
    console.log('Transaction committed, registrationId:', registrationIdText);

    return res.status(201).json({
      success: true,
      registrationId: registrationIdText,
      personsInserted: persons.length,
      itemsInserted: items.length,
    });
  } catch (err) {
    console.error('Error inserting registration, rolling back:');
    console.error('Name:', err.name);
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);

    await connection.rollback();
    return res.status(500).json({
      error: 'Failed to create registration',
      details: err.message,
      meta: {
        name: err.name,
        code: err.code,
      }
    });
  } finally {
    connection.release();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`HBZ backend listening on http://localhost:${port}`);
});
