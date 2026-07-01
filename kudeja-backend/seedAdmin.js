const { sequelize } = require('./database/db');
const User = require('./models/user');
require('dotenv').config();

async function seedAdmin() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // Check if admin already exists
    const adminExists = await User.findOne({
      where: { email: process.env.ADMIN_EMAIL }
    });

    if (adminExists) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
    console.log('⚠️  Change the password immediately!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();