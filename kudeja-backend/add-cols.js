const { sequelize } = require('./database/db');

async function fixDB() {
    try {
        await sequelize.authenticate();
        await sequelize.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN DEFAULT false;");
        await sequelize.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating INTEGER;");
        await sequelize.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback TEXT;");
        console.log("Database hotfix complete. Added new columns to orders.");
    } catch (err) {
        console.error("DB script error:", err.message);
    } finally {
        process.exit(0);
    }
}

fixDB();
