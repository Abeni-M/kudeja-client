const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_MKD7l8oqQeiY@ep-nameless-frost-avp9x8mn-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Server time:', res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  });