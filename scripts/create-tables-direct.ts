import pg from 'pg';
const { Client } = pg;

// Try direct connection using SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL;
const dbPassword = '9eL4D1UL2VMMKwzj'; // From the original .env file

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is required');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres`;

async function createTables() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    console.log('   Using project:', projectRef);
    await client.connect();
    console.log('✅ Connected!');

    console.log('📝 Creating links table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        url TEXT NOT NULL,
        submitted_by TEXT NOT NULL,
        tx_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Links table created');

    console.log('📝 Creating clicks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        link_id VARCHAR REFERENCES links(id),
        clicked_by TEXT,
        user_agent TEXT,
        clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Clicks table created');

    console.log('📝 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id)');
    console.log('✅ Indexes created');

    console.log('\n🎉 All tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTables();
