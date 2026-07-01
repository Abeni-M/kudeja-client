const { sequelize } = require('./database/db');

async function fixDB() {
    try {
        await sequelize.authenticate();
        await sequelize.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;");
        console.log("Database hotfix complete. Added reviews column to products.");
    } catch (err) {
        console.error("DB script error:", err.message);
    } finally {
        process.exit(0);
    }
}

fixDB();
