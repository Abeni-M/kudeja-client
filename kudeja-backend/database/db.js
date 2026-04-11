const { Sequelize } = require('sequelize');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'kudeja_db';

console.log('DB Configuration:', {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  database: DB_NAME,
  password_set: !!DB_PASSWORD,
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,

  // ── Connection pool ──────────────────────────────────────────────────────
  pool: {
    max: 10,          // max connections in pool
    min: 2,           // keep at least 2 alive so idle-timeout never kills all
    acquire: 30000,   // ms to wait before throwing "connection not available"
    idle: 600000,     // keep idle connections alive for 10 min (pg default timeout is 10 min)
    evict: 60000,     // check for idle connections every 60 s
  },

  // ── Postgres-specific options ────────────────────────────────────────────
  dialectOptions: {
    keepAlive: true,          // TCP keepAlive → prevents silent drops
    keepAliveInitialDelayMillis: 30000, // start sending keepAlives after 30 s idle
    connectTimeout: 10000,    // fail fast if the DB is unreachable (10 s)
    statement_timeout: 0,     // no query timeout (set per-query if needed)
    idle_in_transaction_session_timeout: 0,
  },

  define: {
    timestamps: true,
    underscored: true,
  },
});

// ── Health-check / auto-reconnect ────────────────────────────────────────────
// Sequelize re-acquires pooled connections automatically; we just need to make
// sure we surface errors clearly and retry if the initial connect fails.
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };