const { sequelize } = require('./database/db');
const User = require('./models/user');

async function resetAdmin() {
  try {
    await sequelize.authenticate();
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.log('No admin accounts found in the database!');
      process.exit(1);
    }

    // Comply with strong password requirements: 
    // 1 Upper, 1 Lower, 1 Number, 1 Special, 8+ chars
    admin.password = 'Admin@12345'; 
    await admin.save();
    
    console.log(`Admin password successfully reset for email: ${admin.email}`);
    console.log('New Password: Admin@12345');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdmin();
