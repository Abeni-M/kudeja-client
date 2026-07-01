const { Sequelize } = require('sequelize');
require('dotenv').config();

// Debug: Check if environment variables are loaded
console.log('DB Configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password_set: !!process.env.DB_PASSWORD // true if password exists
});

// Create connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'kudeja_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres', // Default password
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    console.log('⚠️  Using SQLite as fallback...');

    // Fallback to SQLite if PostgreSQL fails
    const sqliteSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });

    try {
      await sqliteSequelize.authenticate();
      console.log('✅ SQLite connected as fallback');
      return sqliteSequelize;
    } catch (sqliteError) {
      console.error('❌ SQLite also failed:', sqliteError.message);
      return false;
    }
  }
};

module.exports = { sequelize, testConnection };