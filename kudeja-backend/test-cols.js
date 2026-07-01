const { sequelize } = require('./database/db');

async function test() {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='orders'");
    console.log('Columns in orders table:');
    console.log(results.map(r => r.column_name).join(', '));
    process.exit(0);
}
test().catch(err => { console.error(err); process.exit(1); });
