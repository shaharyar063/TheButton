import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function addColumns() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📝 Adding button customization columns...');
    await client.query(`
      ALTER TABLE button_ownerships 
      ADD COLUMN IF NOT EXISTS button_color TEXT,
      ADD COLUMN IF NOT EXISTS button_emoji TEXT,
      ADD COLUMN IF NOT EXISTS button_image_url TEXT
    `);
    console.log('✅ Columns added successfully!');

    console.log('\n🎉 Schema update complete!');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addColumns();
