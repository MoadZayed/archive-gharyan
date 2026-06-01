import mysql from 'mysql2/promise';

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  console.log("Connecting to database...");
  const connection = await mysql.createConnection({
    uri: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log("--- 1. Stuck AI Jobs ---");
  const [stuckJobs] = await connection.query(`
    SELECT id, fileId, status, attempts, lockedAt, errorReason
    FROM aiJobs 
    WHERE status='processing' AND lockedAt < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
  `);
  console.log("Stuck Jobs:", stuckJobs);

  console.log("--- 2. Repeatedly Failed AI Jobs ---");
  const [failedJobs] = await connection.query(`
    SELECT id, fileId, attempts, errorReason 
    FROM aiJobs 
    WHERE status='failed' OR attempts >= 3
  `);
  console.log("Failed Jobs:", failedJobs);

  console.log("--- 3. Orphan DB Files (Just a sample) ---");
  const [orphanSample] = await connection.query(`
    SELECT id, fileKey, fileName, status 
    FROM academicFiles 
    WHERE status = 'pending' AND createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    LIMIT 5
  `);
  console.log("Pending files > 1h (Possible orphans):", orphanSample);

  await connection.end();
}

run().catch(console.error);
