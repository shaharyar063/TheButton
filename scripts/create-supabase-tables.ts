import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🔧 Creating Supabase tables...\n');

  // SQL for creating all tables
  const createButtonOwnershipsTable = `
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
  `;

  const createLinksTable = `
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
  `;

  const createClicksTable = `
    CREATE TABLE IF NOT EXISTS clicks (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      link_id VARCHAR REFERENCES links(id),
      clicked_by TEXT,
      clicker_username TEXT,
      clicker_pfp_url TEXT,
      user_agent TEXT,
      clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_button_ownerships_expires_at ON button_ownerships(expires_at);
    CREATE INDEX IF NOT EXISTS idx_button_ownerships_owner_address ON button_ownerships(owner_address);
    CREATE INDEX IF NOT EXISTS idx_links_ownership_id ON links(ownership_id);
    CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
  `;

  console.log('📋 SQL Commands to Execute:\n');
  console.log('1. button_ownerships table with customization columns (color, emoji, image)');
  console.log('2. links table with ownership references');
  console.log('3. clicks table for tracking');
  console.log('4. Performance indexes\n');

  console.log('⚠️  Note: Supabase client library requires manual SQL execution.\n');
  console.log('Please copy and paste the following SQL into your Supabase SQL Editor:\n');
  console.log('='.repeat(80));
  console.log(createButtonOwnershipsTable);
  console.log(createLinksTable);
  console.log(createClicksTable);
  console.log(createIndexes);
  console.log('='.repeat(80));
  console.log('\n📍 Go to: ' + supabaseUrl.replace(/\/$/, '') + '/project/_/sql/new');
  console.log('\n✅ After running the SQL, your app will be fully functional!');
}

createTables().catch(console.error);
