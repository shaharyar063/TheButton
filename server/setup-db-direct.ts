import pg from "pg";
const { Client } = pg;
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to database");

    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        tx_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ Created links table");

    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        link_id UUID REFERENCES links(id) ON DELETE CASCADE,
        clicked_by TEXT,
        user_agent TEXT,
        clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ Created clicks table");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
    `);
    console.log("✓ Created index on links.created_at");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
    `);
    console.log("✓ Created index on clicks.clicked_at");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
    `);
    console.log("✓ Created index on clicks.link_id");

    const { rows } = await client.query("SELECT COUNT(*) FROM links");
    console.log(`\nDatabase setup complete! Links count: ${rows[0].count}`);

  } catch (error) {
    console.error("Error setting up database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

setupDatabase();
