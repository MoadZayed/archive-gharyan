import * as db from './server/db.ts';
import { academicFiles } from './server/db.ts';

async function check() {
  try {
    const dbInstance = await db.getDb();
    const files = await dbInstance.select().from(academicFiles);
    console.log(JSON.stringify(files.map(f => ({
      id: f.id, 
      fileName: f.fileName, 
      fileUrl: f.fileUrl, 
      fileKey: f.fileKey
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
