const { createExpressApp } = require("../../server/app");
const { initializeDatabase } = require("../../server/db");

const app = createExpressApp();

let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

module.exports = async function handler(req: any, res: any) {
  await ensureDbInitialized();
  return app(req, res);
};
