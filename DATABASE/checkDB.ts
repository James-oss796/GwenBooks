import { db } from './drizzle';

(async () => {
  try {
    console.log("Testing DB connection...");
    const res = await db.execute('SELECT 1');
    console.log("DB responded:", res);
  } catch (err) {
    console.error("DB ERROR:", err);
  }
})();