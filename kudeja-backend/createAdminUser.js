const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createAdminUser() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'kudeja_db',
    password: process.env.DB_PASSWORD
  });

  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'admin123';
  const role = 'admin';

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a UUID for the user
    const userId = uuidv4();

    // Insert the user
    const query = `
      INSERT INTO users (id, username, email, password, role, created_at, updated_at, is_active)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
      RETURNING id, username, email, role
    `;

    const values = [userId, username, email, hashedPassword, role, true];

    const result = await pool.query(query, values);

    console.log('Admin user created successfully:');
    console.log(result.rows[0]);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();