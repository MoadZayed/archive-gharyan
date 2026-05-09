import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  console.log("Checking database tables...");
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const db = drizzle(pool);

  try {
    const result = await db.execute(sql`SHOW TABLES`);
    console.log("Existing tables:", JSON.stringify(result[0]));
  } catch (error) {
    console.error("Failed to list tables:", error);
  } finally {
    await pool.end();
  }
}

main();
