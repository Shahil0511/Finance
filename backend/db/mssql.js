const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE,
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_CERT !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('[MSSQL] Connected successfully');
  }
  return pool;
}

async function query(sqlText, params = {}) {
  const p = await getPool();
  const request = p.request();
  // Bind named params: pass as { name: { type, value } } or plain { name: value }
  for (const [key, val] of Object.entries(params)) {
    if (val && typeof val === 'object' && 'type' in val) {
      request.input(key, val.type, val.value);
    } else {
      request.input(key, val);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset;
}

async function testConnection() {
  try {
    await query('SELECT 1 AS test');
    console.log('[MSSQL] Connected successfully');
    return true;
  } catch (err) {
    console.error('[MSSQL] Connection failed:', err.message);
    return false;
  }
}

module.exports = { query, testConnection, sql };
