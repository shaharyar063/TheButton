import { createExpressApp } from "../../server/app";
import { initializeDatabase } from "../../server/db";

const app = createExpressApp();

let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    console.log("🔧 Initializing database connection...");
    await initializeDatabase();
    dbInitialized = true;
    console.log("✅ Database initialized");
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDbInitialized();
    return app(req, res);
  } catch (error) {
    console.error("❌ Serverless function error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
