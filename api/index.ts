import { createExpressApp } from "../server/app";
import { initializeDatabase } from "../server/db";

const app = createExpressApp();

let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export default async function handler(req: any, res: any) {
  await ensureDbInitialized();
  return app(req, res);
}
