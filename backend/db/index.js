const { Pool } = require('pg');

const pool = new Pool({
  user: 'test_limto',
  host: 'localhost',
  database: 'jarvis_telkom',
  password: 'test_limto',
  port: 5432,
});

module.exports = pool;