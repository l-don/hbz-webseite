require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

// CORS: Angular-Frontend darf auf das Backend zugreifen
// Passe den Origin ggf. an den Port deines Frontends an (4200 für Angular CLI, 5173 für Vite, etc.)
app.use(cors({
  origin: 'http://localhost:4200', // falls dein Dev-Server z.B. auf 5173 läuft, hier anpassen
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// JSON-Body parsen
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'limbus.davidlokison.com',
  port: process.env.DB_PORT || 3310,
  user: process.env.DB_USER || 'test-user',
  password: process.env.DB_PASSWORD || 'SuperHBZS3cr€t',
  database: process.env.DB_NAME || 'hbz-registrations',
});

// Health-Check
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
 * Body:
 * {
 *   "eventId": "...",
 *   "registration": { name, address, email, phone, emergency, comment? },
 *   "persons": [ { name, birthday, address, comment?, flag_vegetarian, flag_organization }, ... ],
 *   "items": [ { articleId, comment? }, ... ]
 * }
 */
app.post('/registrations', async (req, res) => {
  console.log('[POST] /registrations body:', JSON.stringify(req.body, null, 2));

  const { eventId, registration, persons = [], items = [] } = req.body;

  if (!eventId || !registration) {
    console.warn('Missing eventId or registration data');
    return res.status(400).json({ error: 'eventId and registration are required' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const registrationId = uuidv4();
    console.log('Generated registrationId:', registrationId);

// Namen aus dem Frontend in Vor- und Nachname aufteilen (nur für Anzeige),
    // in der DB gibt es nur ein Feld "name".
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

        console.log('Generated registrationId (text UUID):', registrationId);

        const regSql = `
          INSERT INTO Registration
            (id, event, name, address, email, phone, emergency, comment)
          VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)
        `;
        const regParams = [
          registrationId,
          eventId,
          fullName,
          registration.address,
          registration.email,
          registration.phone,
          registration.emergency,
          registration.comment || null,
        ];

        console.log('Executing Registration INSERT:', regSql, regParams);
        await connection.execute(regSql, regParams);

    // Personen einfügen
    for (const person of persons) {
      const personId = uuidv4();
      console.log('Generated personId:', personId, 'for person', person.name);

      const flagVeg = person.flag_vegetarian ? 1 : 0; // BIT(1) oder TINYINT
      const flagOrg = person.flag_organization ?? 0;  // BIT(2) oder TINYINT

      const personSql = `
        INSERT INTO Person
          (id, registration, name, birthday, address, comment, flag_vegetarian, flag_organization)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const personParams = [
        personId,
        registrationId,
        person.name,
        person.birthday, // 'YYYY-MM-DD'
        person.address,
        person.comment || null,
        flagVeg,
        flagOrg,
      ];
      console.log('Executing Person INSERT:', personSql, personParams);
      await connection.execute(personSql, personParams);
    }

    // Items einfügen
    for (const item of items) {
      const itemId = uuidv4();
      console.log('Generated itemId:', itemId, 'for article', item.articleId);

      const itemSql = `
        INSERT INTO Item
          (id, registration, article, comment)
        VALUES (?, ?, ?, ?)
      `;
      const itemParams = [
        itemId,
        registrationId,
        item.articleId,
        item.comment || null,
      ];
      console.log('Executing Item INSERT:', itemSql, itemParams);
      await connection.execute(itemSql, itemParams);
    }

    await connection.commit();
    console.log('Transaction committed for registrationId:', registrationId);

    return res.status(201).json({
      success: true,
      registrationId,
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
