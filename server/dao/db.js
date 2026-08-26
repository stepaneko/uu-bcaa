const { Pool } = require('pg');

const pool = new Pool({
  user: 'easyvat_user',
  host: 'localhost',
  database: 'easyvat_db',
  password: 'Sulan694',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};