const { sequelize } = require('../database/db');

async function addIsReadByUserColumn() {
    try {
        await sequelize.authenticate();
        await sequelize.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read_by_user BOOLEAN DEFAULT true;");
        console.log("Database migration complete. Added is_read_by_user column to messages.");
    } catch (err) {
        console.error("Migration error:", err.message);
    } finally {
        process.exit(0);
    }
}

addIsReadByUserColumn();
