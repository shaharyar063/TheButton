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

  console.log('📝 SQL to execute:');
  console.log(sql);
  console.log('\n⚠️  Please run this SQL in your Supabase SQL Editor:');
  console.log(`   1. Go to ${supabaseUrl}/project/_/sql`);
  console.log('   2. Paste the SQL above');
  console.log('   3. Click "Run"');
  console.log('\n✅ After running the SQL, the app will be ready to use!');
}

setupTables();
