import { createClient } from '@supabase/supabase-js';

async function diagnoseDatabase() {
  console.log("🔍 Database Diagnostic Tool\n");
  console.log("=" .repeat(60));

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials!");
    console.error("   SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    return;
  }

  console.log("✓ Supabase credentials found");
  console.log(`  URL: ${supabaseUrl.replace(/https:\/\/([^.]+).*/, 'https://$1.supabase.co')}`);
  console.log(`  Using: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("📊 Checking 'links' table...");
    
    const { data: linksData, error: linksError, count: linksCount } = await supabase
      .from('links')
      .select('*', { count: 'exact' })
      .limit(5);

    if (linksError) {
      console.error(`   ❌ Error: ${linksError.message}`);
      console.error(`   Code: ${linksError.code}`);
      console.error(`   Details: ${linksError.details}\n`);
    } else {
      console.log(`   ✓ Total links: ${linksCount}`);
      if (linksData && linksData.length > 0) {
        console.log(`   ✓ Sample data (first ${linksData.length} rows):`);
        console.log(`     Columns: ${Object.keys(linksData[0]).join(', ')}`);
        linksData.forEach((link, i) => {
          console.log(`     [${i + 1}] ID: ${link.id}, URL: ${link.url?.substring(0, 50)}...`);
        });
      } else {
        console.log(`   ⚠️  No data found in 'links' table`);
      }
      console.log();
    }

    console.log("📊 Checking 'clicks' table...");
    
    const { data: clicksData, error: clicksError, count: clicksCount } = await supabase
      .from('clicks')
      .select('*', { count: 'exact' })
      .limit(5);

    if (clicksError) {
      console.error(`   ❌ Error: ${clicksError.message}`);
      console.error(`   Code: ${clicksError.code}\n`);
    } else {
      console.log(`   ✓ Total clicks: ${clicksCount}`);
      if (clicksData && clicksData.length > 0) {
        console.log(`   ✓ Sample data (first ${clicksData.length} rows):`);
        console.log(`     Columns: ${Object.keys(clicksData[0]).join(', ')}`);
      } else {
        console.log(`   ⚠️  No data found in 'clicks' table`);
      }
      console.log();
    }

    console.log("=" .repeat(60));
    
    if (linksCount === 0 && clicksCount === 0) {
      console.log("\n⚠️  ISSUE FOUND: Tables are empty!");
      console.log("   This could mean:");
      console.log("   1. Wrong Supabase project URL");
      console.log("   2. Tables exist but have no data");
      console.log("   3. Using wrong database credentials\n");
    } else if (linksData && linksData.length > 0) {
      const sampleColumns = Object.keys(linksData[0]);
      const requiredColumns = ['submitter_username', 'submitter_pfp_url'];
      const missingColumns = requiredColumns.filter(col => !sampleColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log("\n⚠️  ISSUE FOUND: Missing columns!");
        console.log(`   Missing: ${missingColumns.join(', ')}`);
        console.log("\n   Run this SQL in Supabase to fix:");
        console.log("   ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_username TEXT;");
        console.log("   ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_pfp_url TEXT;");
        console.log("   ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_username TEXT;");
        console.log("   ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_pfp_url TEXT;\n");
        
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
        if (projectRef) {
          console.log(`   SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
        }
      } else {
        console.log("\n✅ Database schema looks good!");
        console.log("   All required columns are present.\n");
      }
    }

  } catch (error: any) {
    console.error("\n❌ Unexpected error:", error.message);
  }
}

diagnoseDatabase();
