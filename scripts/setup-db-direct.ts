import { Client } from 'pg';

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Missing DATABASE_URL environment variable!');
    console.error('   Please set DATABASE_URL to your Supabase connection string');
    process.exit(1);
  }

  console.log('🔧 Connecting to Supabase database...\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Create button_ownerships table
    console.log('📝 Creating button_ownerships table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS button_ownerships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        owner_address TEXT NOT NULL,
        tx_hash TEXT NOT NULL UNIQUE,
        starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 3600,
        button_color TEXT,
        button_emoji TEXT,
        button_image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('   ✓ button_ownerships table created with customization columns!\n');

    // Create links table
    console.log('📝 Creating links table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ownership_id VARCHAR REFERENCES button_ownerships(id),
        url TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        submitter_username TEXT,
        submitter_pfp_url TEXT,
        tx_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('   ✓ links table created!\n');

    // Create clicks table
    console.log('📝 Creating clicks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        link_id VARCHAR REFERENCES links(id),
        clicked_by TEXT,
        clicker_username TEXT,
        clicker_pfp_url TEXT,
        user_agent TEXT,
        clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('   ✓ clicks table created!\n');

    // Create indexes
    console.log('📝 Creating performance indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_button_ownerships_expires_at ON button_ownerships(expires_at);
      CREATE INDEX IF NOT EXISTS idx_button_ownerships_owner_address ON button_ownerships(owner_address);
      CREATE INDEX IF NOT EXISTS idx_links_ownership_id ON links(ownership_id);
      CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
      CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
    `);
    console.log('   ✓ All indexes created!\n');

    console.log('🎉 Database setup complete!\n');
    console.log('Your app now has:');
    console.log('  • button_ownerships table (with color, emoji, image customization)');
    console.log('  • links table (with ownership tracking)');
    console.log('  • clicks table (for analytics)');
    console.log('  • Performance indexes\n');
    console.log('✅ You can now buy and customize buttons!');

  } catch (error) {
    console.error('\n❌ Error creating tables:', error);
    console.error('\nIf you see authentication errors, you may need to use the Supabase SQL Editor instead.');
    console.error('Go to your Supabase dashboard and run the setup_supabase_tables.sql file.');
  } finally {
    await client.end();
  }
}

setupDatabase();
