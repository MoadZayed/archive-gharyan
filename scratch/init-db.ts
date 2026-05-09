import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const schema = `
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentID VARCHAR(50) UNIQUE,
  passwordHash VARCHAR(255),
  fullName VARCHAR(255) NOT NULL,
  role ENUM('student', 'professor', 'admin') DEFAULT 'student' NOT NULL,
  email VARCHAR(320),
  avatarUrl TEXT,
  resetToken VARCHAR(255),
  resetTokenExpiry TIMESTAMP NULL,
  securityQuestion TEXT,
  securityAnswerHash VARCHAR(255),
  failedAttempts INT DEFAULT 0 NOT NULL,
  lockoutUntil TIMESTAMP NULL,
  enrolledCourses TEXT,
  coursesUpdatedAt TIMESTAMP NULL,
  lastInteractionAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isAccountLocked BOOLEAN DEFAULT FALSE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS academicFiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fileName VARCHAR(255) NOT NULL,
  fileType VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  courseCode VARCHAR(20),
  year INT NOT NULL,
  description TEXT,
  uploadedByStudentID INT NOT NULL,
  fileKey VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(512) NOT NULL,
  fileHash VARCHAR(64) UNIQUE,
  fileSize INT NOT NULL,
  lectureNumber INT,
  academicYear VARCHAR(20),
  mimeType VARCHAR(100) NOT NULL,
  isApproved BOOLEAN DEFAULT FALSE NOT NULL,
  reportsCount INT DEFAULT 0 NOT NULL,
  deletedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS fileVotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fileID INT NOT NULL,
  studentID INT NOT NULL,
  voteType INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT NOT NULL,
  fileID INT NOT NULL,
  studentID INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentID INT NOT NULL,
  fileID INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  console.log("Initializing database schema...");
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await pool.query(statement);
    }
    console.log("Schema initialization completed successfully.");
  } catch (error) {
    console.error("Failed to initialize schema:", error);
  } finally {
    await pool.end();
  }
}

main();
