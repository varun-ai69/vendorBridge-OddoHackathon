const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: 'postgres', // default since they just reset it
  host: 'localhost',
  port: 5432,
  database: 'oddohackathon'
});

async function run() {
  const hash = '$2b$12$BUl2uN/q6I7XOMJWMexp0eUf3qUWgc4rI.RvNd..Rz6TEGjv/dTiW';
  await pool.query('UPDATE users SET password_hash = $1', [hash]);
  console.log('Fixed passwords!');
  process.exit(0);
}
run();
