import { createClient } from '@supabase/supabase-js';

async function fixSupabaseSchema() {
  console.log("🔧 Fixing Supabase database schema...\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials!");
    console.error("   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("📊 Checking current database schema...");
    
    const { count: linkCount } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true });
    
    const { count: clickCount } = await supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true });

    console.log(`   Found ${linkCount} links and ${clickCount} clicks\n`);

    console.log("🔨 Adding missing columns to tables...");
    
    const migrations = [
      "ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_username TEXT",
      "ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_pfp_url TEXT",
      "ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_username TEXT",
      "ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_pfp_url TEXT"
    ];

    for (const migration of migrations) {
      const { error } = await supabase.rpc('exec_sql', { sql: migration });
      if (error) {
        console.error(`   ⚠️  Could not run migration directly: ${error.message}`);
        console.log("\n⚠️  The Service Role Key is required to alter tables.");
        console.log("   Please run this SQL manually in your Supabase SQL Editor:\n");
        console.log(migrations.join(';\n') + ';\n');
        console.log(`   SQL Editor: ${supabaseUrl.replace('//', '//app.')}/project/_/sql/new\n`);
        process.exit(1);
      }
      console.log(`   ✓ ${migration}`);
    }

    console.log("\n✅ Schema updated successfully!");
    console.log("   Restart the application to see your data.\n");

  } catch (error: any) {
    if (error.message?.includes('exec_sql')) {
      console.log("\n📋 Direct migration not available. Run this SQL in Supabase SQL Editor:\n");
      console.log("-- Add missing columns");
      console.log("ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_username TEXT;");
      console.log("ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_pfp_url TEXT;");
      console.log("ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_username TEXT;");
      console.log("ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_pfp_url TEXT;\n");
      
      const sqlEditorUrl = supabaseUrl.replace('https://', 'https://app.').replace('.supabase.co', '.supabase.co/project/_/sql/new');
      console.log(`   SQL Editor: ${sqlEditorUrl}\n`);
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

fixSupabaseSchema();
