// DATABASE/drizzle.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema"; // 👈 make sure this points to your schema file



// Use environment variable if available, otherwise fallback to a direct URL (for testing)
const databaseUrl = process.env.DATABASE_URL || "postgresql://library_owner:npg_RXh7TQqgyi8a@ep-wandering-sunset-a240vy30-pooler.eu-central-1.aws.neon.tech/library?sslmode=require&channel_binding=require"
// Create the Neon SQL client
const sql = neon(databaseUrl);

// ✅ Pass the schema correctly
export const db = drizzle(sql, { schema });

// Optional: export the SQL client too (sometimes useful)
export { sql };
