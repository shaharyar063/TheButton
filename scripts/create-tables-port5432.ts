import pg from 'pg';
const { Client } = pg;

const supabaseUrl = process.env.SUPABASE_URL!;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is required');
  process.exit(1);
}

// Extract project ref from SUPABASE_URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Use port 5432 for direct connection
const connectionString = `postgresql://postgres.${projectRef}:[YOUR_DB_PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres`;

console.log('📋 Project Reference:', projectRef);
console.log('\n⚠️  To create tables in Supabase, please run this SQL in your Supabase SQL Editor:');
console.log(`   1. Go to https://${projectRef}.supabase.co/project/_/sql/new`);
console.log('   2. Paste and run this SQL:\n');

const sql = `
-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id VARCHAR REFERENCES links(id),
  clicked_by TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
`;

console.log(sql);
console.log('\n✅ After running this SQL, restart the application!');
