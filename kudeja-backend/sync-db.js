const { sequelize, User } = require('./models');

async function syncDatabase() {
  try {
    console.log('🔄 Connecting to database using DATABASE_URL...');
    await sequelize.authenticate();
    console.log('✅ Connection authenticated successfully.');

    console.log('🔄 Syncing database tables (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('✅ All tables created and synced successfully.');

    const count = await User.count();
    console.log(`📊 Reachability check: 'users' table is reachable (Total Users: ${count})`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncDatabase();