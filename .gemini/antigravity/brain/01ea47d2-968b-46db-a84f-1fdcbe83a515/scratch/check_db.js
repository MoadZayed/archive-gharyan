import { getDb } from "./server/db.js";
import { academicFiles } from "./drizzle/schema.js";

async function check() {
  const db = await getDb();
  if (!db) {
    console.log("No DB");
    return;
  }
  const files = await db.select().from(academicFiles).limit(5);
  console.log(JSON.stringify(files, null, 2));
}

check().catch(console.error).finally(() => process.exit(0));
