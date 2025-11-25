const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'limbus.davidlokison.com',
  port: 3310,
  user: 'test-user',
  password: 'SuperHBZS3cr€t',
  database: 'hbz-registrations',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
