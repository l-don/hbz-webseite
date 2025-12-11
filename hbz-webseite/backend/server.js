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

// GET /events/open - Fetch open events
app.get('/events/open', async (req, res) => {
  console.log('[GET] /events/open called');
  try {
    // Use BIN_TO_UUID to convert binary UUID to string format
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(id) AS id,
        title,
        deadline,
        begin,
        end,
        description
      FROM v_open_events
    `);
    console.log('Open events:', rows);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching open events:', err);
    return res.status(500).json({ error: 'Failed to fetch open events', details: err.message });
  }
});

// GET /items - Fetch bookable items
app.get('/items', async (req, res) => {
  console.log('[GET] /items called');
  try {
    // Use BIN_TO_UUID to convert binary UUID to string format
    const [rows] = await pool.query(`
      SELECT 
        BIN_TO_UUID(id) AS id,
        price,
        description
      FROM v_item_articles
    `);
    console.log('Item articles:', rows);
    return res.json(rows);
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
    console.warn('Missing eventId or persons data');
    return res.status(400).json({ error: 'eventId and persons array are required' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    const results = [];
    
    for (let i = 0; i < persons.length; i++) {
      const person = persons[i];
      const { birthday, flag_organization } = person;
      
      console.log(`Processing person ${i + 1}:`, { birthday, flag_organization, eventId });
      
      // Call stored procedure for each person
      // The procedure expects: eventId (text UUID), birthday (DATE), flag_organization (INT)
      const [rows] = await connection.query(
        'CALL p_article_from_person_data(?, ?, ?)',
        [eventId, birthday || null, flag_organization ? 1 : 0]
      );
      
      console.log(`Procedure result for person ${i + 1}:`, rows);
      
      // The procedure returns result set in rows[0]
      const articleData = rows[0] && rows[0].length > 0 ? rows[0][0] : null;
      
      if (articleData) {
        console.log(`Article data for person ${i + 1}:`, articleData);
        
        // Convert binary UUID to string if needed
        let articleId = articleData.id;
        if (articleId && Buffer.isBuffer(articleId)) {
          // Query to convert binary to UUID string
          const [convertResult] = await connection.query(
            'SELECT BIN_TO_UUID(?) AS id',
            [articleId]
          );
          articleId = convertResult[0]?.id || articleId;
          console.log(`Converted article ID to: ${articleId}`);
        }
        
        results.push({
          articleId: articleId,
          description: articleData.description,
          price: articleData.price
        });
      } else {
        console.warn(`No article data returned for person ${i + 1}`);
      }
    }
    
    console.log('Price check results:', results);
    return res.json(results);
  } catch (err) {
    console.error('Error in pricecheck:');
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
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
 * Body:
 * {
 *   "eventId": "uuid-string",
 *   "registration": {...},
 *   "persons": [...],
 *   "items": [...]
 * }
 *
 * Uses stored procedures instead of direct inserts.
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
    // 1) Call p_registration_open
    console.log('Calling p_registration_open...');
    await connection.query(
      'CALL p_registration_open(?, ?, ?, ?, ?, ?, ?)',
      [
        eventId,
        registration.name || 'Unbekannt',
        registration.address || '',
        registration.email || '',
        registration.phone || '',
        registration.emergency || '',
        registration.comment || null
      ]
    );
    console.log('p_registration_open completed');

    // 2) For each person: Call p_registration_person
    for (const person of persons) {
      console.log('Calling p_registration_person for', person.name);
      
      const flagVeg = person.flag_vegetarian ? 1 : 0;
      const flagOrg = person.flag_organization ? 1 : 0;
      
      await connection.query(
        'CALL p_registration_person(?, ?, ?, ?, ?, ?)',
        [
          person.name || '',
          person.birthday || null,
          person.address || '',
          person.comment || null,
          flagVeg,
          flagOrg
        ]
      );
    }
    console.log('All persons inserted');

    // 3) For each item: Call p_registration_item
    for (const item of items) {
      console.log('Calling p_registration_item for article', item.articleId);
      
      await connection.query(
        'CALL p_registration_item(?, ?)',
        [
          item.articleId,
          item.comment || null
        ]
      );
    }
    console.log('All items inserted');

    // 4) Call p_registration_finish
    console.log('Calling p_registration_finish...');
    const [finishResult] = await connection.query('CALL p_registration_finish()');
    console.log('p_registration_finish completed:', finishResult);

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
