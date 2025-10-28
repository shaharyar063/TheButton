import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set. Database features will not work.");
}

const pool = process.env.DATABASE_URL ? new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
}) : null;

export async function initializeDatabase() {
  console.log("Database initialization check...");
  
  if (!pool) {
    console.log("⚠️  No database pool available. Set DATABASE_URL environment variable.");
    return;
  }
  
  try {
    const result = await pool.query("SELECT COUNT(*) FROM links");
    console.log(`✓ Database connected. Links count: ${result.rows[0].count}`);
  } catch (error) {
    console.error("⚠️  Database connection error:", error);
    console.log("   Tables may need to be created.");
  }
}
