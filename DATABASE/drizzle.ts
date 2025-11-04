// DATABASE/drizzle.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema"; // 👈 make sure this points to your schema file
import config from "@/lib/config";

// Create the Neon SQL client
const sql = neon(config.env.databaseUrl);

// ✅ Pass the schema correctly
export const db = drizzle(sql, { schema });

// Optional: export the SQL client too (sometimes useful)
export { sql };
