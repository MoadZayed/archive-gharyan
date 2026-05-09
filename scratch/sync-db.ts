import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "../drizzle/schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  console.log("Pushing schema updates to database...");
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool, { schema, mode: "default" });

  try {
    // For MySQL we usually use drizzle-kit push, but we can execute raw SQL to ensure tables exist
    // I already created init-db.ts for raw SQL. 
    // Let's try to run that init-db.ts logic but inside the server process if needed.
    console.log("Please run the init-db.ts script manually if possible.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

main();
