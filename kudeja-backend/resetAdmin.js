require('dotenv').config();
const User = require('./models/user');

async function resetAdmin() {
  try {
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
        console.log('Admin user not found. Trying email fallback.');
        const emailUser = await User.findOne({ where: { email: 'admin@kudeja.com' }});
        if(emailUser) {
             emailUser.role = 'admin';
             emailUser.password = 'admin123';
             await emailUser.save();
             console.log(`Email: ${emailUser.email}, Password: admin123`);
             process.exit(0);
        }
        process.exit(1);
    }

    adminUser.password = 'admin123';
    await adminUser.save();

    console.log('Admin credentials reset.');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: admin123`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
}

resetAdmin();
