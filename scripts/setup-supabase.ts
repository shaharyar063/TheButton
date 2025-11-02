import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('🔧 Setting up Supabase tables...');
  
  try {
    // Create button_ownerships table
    console.log('Creating button_ownerships table...');
    const { error: ownershipError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (ownershipError) console.error('Error creating button_ownerships:', ownershipError);
    else console.log('✅ button_ownerships table created');

    // Create links table
    console.log('Creating links table...');
    const { error: linksError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (linksError) console.error('Error creating links:', linksError);
    else console.log('✅ links table created');

    // Create clicks table
    console.log('Creating clicks table...');
    const { error: clicksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS clicks (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
          link_id VARCHAR REFERENCES links(id),
          clicked_by TEXT,
          clicker_username TEXT,
          clicker_pfp_url TEXT,
          user_agent TEXT,
          clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `
    });
    
    if (clicksError) console.error('Error creating clicks:', clicksError);
    else console.log('✅ clicks table created');

    // Create indexes
    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_button_ownerships_expires_at ON button_ownerships(expires_at);
        CREATE INDEX IF NOT EXISTS idx_button_ownerships_owner_address ON button_ownerships(owner_address);
        CREATE INDEX IF NOT EXISTS idx_links_ownership_id ON links(ownership_id);
        CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
        CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
      `
    });
    
    if (indexError) console.error('Error creating indexes:', indexError);
    else console.log('✅ Indexes created');

    console.log('\n🎉 All tables created successfully!');
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
    console.log(`
-- Create button_ownerships table with customization columns
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

-- Create links table
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

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id VARCHAR REFERENCES links(id),
  clicked_by TEXT,
  clicker_username TEXT,
  clicker_pfp_url TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_button_ownerships_expires_at ON button_ownerships(expires_at);
CREATE INDEX IF NOT EXISTS idx_button_ownerships_owner_address ON button_ownerships(owner_address);
CREATE INDEX IF NOT EXISTS idx_links_ownership_id ON links(ownership_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
    `);
  }
}

setupTables();
