import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL && !process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  Supabase credentials not set. Database features will not work.");
  console.warn("   Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables.");
}

export async function initializeDatabase() {
  console.log("Database initialization check...");
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("⚠️  Supabase credentials not available.");
    console.log("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) environment variables.");
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { count, error } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("⚠️  Database connection error:", error.message);
      console.log("   Tables may need to be created.");
    } else {
      console.log(`✓ Database connected. Links count: ${count}`);
    }
  } catch (error) {
    console.error("⚠️  Database connection error:", error);
    console.log("   Tables may need to be created.");
  }
}
