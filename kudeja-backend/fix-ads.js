const { sequelize } = require('./database/db');

async function fixAdsTable() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='slideImages') THEN
                    ALTER TABLE ads ADD COLUMN "slideImages" TEXT DEFAULT '[]';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='slideInterval') THEN
                    ALTER TABLE ads ADD COLUMN "slideInterval" INTEGER DEFAULT 5;
                END IF;
            END $$;
        `);

        console.log("Ads table structure check complete (Postgres).");
    } catch (err) {
        console.error("DB script error:", err.message);
    } finally {
        process.exit(0);
    }
}

fixAdsTable();
