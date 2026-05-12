import { eq, or, and, sql, desc, lt, isNull, isNotNull, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import {
  InsertUser, users,
  students, academicFiles, InsertAcademicFile,
  comments, InsertComment, fileVotes,
  Student, InsertStudent,
  favorites, notifications, InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';
import mysql from "mysql2/promise";

// -------------------- Pool & Schema Initialization --------------------
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _pool: mysql.Pool | null = null;
let _initialized = false;

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentID VARCHAR(50) UNIQUE,
    googleId VARCHAR(255) UNIQUE,
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
    deletedAt TIMESTAMP NULL,
    petals INT DEFAULT 0 NOT NULL,
    verificationStatus ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING' NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS academicFiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    fileType VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    courseCode VARCHAR(20),
    doctorName VARCHAR(255),
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
    views INT DEFAULT 0 NOT NULL,
    isApproved BOOLEAN DEFAULT FALSE NOT NULL,
    reportsCount INT DEFAULT 0 NOT NULL,
    deletedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS fileVotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fileID INT NOT NULL,
    studentID INT NOT NULL,
    voteType INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    fileID INT NOT NULL,
    studentID INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentID INT NOT NULL,
    fileID INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    type ENUM('LIKE', 'SYSTEM') DEFAULT 'SYSTEM' NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`
];

export async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing from .env file");
    }
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 50,
        queueLimit: 0,
        waitForConnections: true,
        connectTimeout: 15000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
      });

      _pool.on('error', (err) => {
        console.error('🚨 [DB Pool Error]:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.log('🔄 [DB] Connection lost. Pool will handle reconnect.');
        } else {
          _db = null;
        }
      });

      _db = drizzle(_pool as any, { schema, mode: "default" });

      if (!_initialized && _pool) {
        console.log("🛠️ [DB] Checking Schema Integrity...");
        for (const sql_stmt of SCHEMA_SQL) {
          try {
            await _pool.query(sql_stmt);
          } catch (err: any) {
            if (!err.message?.includes("already exists")) {
              console.error(`⚠️ [DB Schema Warning] Statement failed: ${sql_stmt.substring(0, 50)}...`, err.message);
            }
          }
        }
        _initialized = true;
        console.log("✅ [DB] Schema Checked.");
      }
    } catch (error) {
      console.error("🚨 [DB Connection Error]:", error);
      throw error;
    }
  }
  return _db;
}

// -------------------- OAuth User Helpers --------------------
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      if (user[field] !== undefined) {
        const normalized = user[field] ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// -------------------- Student Queries (enhanced) --------------------
export async function getStudentByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students)
    .where(and(eq(students.email, email), isNull(students.deletedAt)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getStudentByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.googleId, googleId)).limit(1);
  return result[0] ?? undefined;
}

export async function getStudentByID(studentID: string) {
  const db = await getDb();
  if (!db) return undefined;
  // First check if student exists at all (including soft-deleted)
  const allResult = await db.select().from(students)
    .where(eq(students.studentID, studentID))
    .limit(1);
  if (allResult.length === 0) {
    console.warn(`⚠️ [Auth] Student not found in DB: ${studentID}`);
    return undefined;
  }
  if (allResult[0].deletedAt) {
    console.warn(`⚠️ [Auth] Student account is soft-deleted: ${studentID}`);
    return undefined;
  }
  return allResult[0];
}

export async function getStudentByDbId(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .limit(1);
  return result[0] ?? undefined;
}

/** يحضر الطالب برمز الاستعادة مع فحص صلاحية الوقت */
export async function getStudentByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students)
    .where(and(
      eq(students.resetToken, token),
      isNull(students.deletedAt),
      sql`${students.resetTokenExpiry} > NOW()`
    ))
    .limit(1);
  return result[0] ?? undefined;
}

export async function createStudent(
  studentID: string, passwordHash: string, fullName: string,
  email: string, securityQuestion: string, securityAnswerHash: string,
  role: "student" | "professor" | "admin" = "student"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(students).values({
    studentID, passwordHash, fullName, email,
    securityQuestion, securityAnswerHash, role,
  } as any);
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(students).set(data).where(eq(students.id, id));
}

// -------------------- Academic Files --------------------
export async function createAcademicFile(data: InsertAcademicFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(academicFiles).values({
    ...data,
    reportsCount: 0,
    isApproved: data.isApproved ?? false,
  } as any);
}

export async function getAcademicFileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(academicFiles).where(eq(academicFiles.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getFileByHash(hash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(academicFiles).where(eq(academicFiles.fileHash, hash)).limit(1);
  return result[0] ?? undefined;
}

/** استعلام القائمة الرئيسية مع فلترة وترقيم */
export async function getAllAcademicFiles(
  isAdmin = false,
  studentDbId?: number | string,
  limit = 20, offset = 0,
  filters?: { search?: string; fileType?: string; year?: number; subject?: string; doctorName?: string; }
) {
  const db = await getDb();
  if (!db) return [];

  const whereConditions: any[] = [isNull(academicFiles.deletedAt)];
  if (!isAdmin) {
    whereConditions.push(lt(academicFiles.reportsCount, 11));
    whereConditions.push(or(
      eq(academicFiles.isApproved, true),
      studentDbId != null ? eq(academicFiles.uploadedByStudentID, Number(studentDbId)) : sql`0=1`
    ));
  }

  if (filters) {
    if (filters.search) {
      const s = `%${filters.search}%`;
      whereConditions.push(or(
        like(academicFiles.fileName, s),
        like(academicFiles.description, s),
        like(academicFiles.subject, s),
        like(academicFiles.doctorName, s)
      ));
    }
    if (filters.fileType) whereConditions.push(eq(academicFiles.fileType, filters.fileType));
    if (filters.year) whereConditions.push(eq(academicFiles.year, filters.year));
    if (filters.subject) whereConditions.push(like(academicFiles.subject, `%${filters.subject}%`));
    if (filters.doctorName) whereConditions.push(like(academicFiles.doctorName, `%${filters.doctorName}%`));
  }

  const votesCount = db.select({
    fileID: fileVotes.fileID,
    totalVotes: sql<number>`SUM(${fileVotes.voteType})`.as('totalVotes')
  }).from(fileVotes).groupBy(fileVotes.fileID).as('v');

  return db.select({
    id: academicFiles.id, fileName: academicFiles.fileName,
    fileType: academicFiles.fileType, subject: academicFiles.subject,
    courseCode: academicFiles.courseCode, year: academicFiles.year,
    description: academicFiles.description, doctorName: academicFiles.doctorName,
    uploadedByStudentID: academicFiles.uploadedByStudentID,
    uploadedBy: students.fullName, uploaderPetals: students.petals,
    fileUrl: academicFiles.fileUrl, mimeType: academicFiles.mimeType,
    views: academicFiles.views, isApproved: academicFiles.isApproved,
    reportsCount: academicFiles.reportsCount, createdAt: academicFiles.createdAt,
    votes: sql<number>`IFNULL(${votesCount.totalVotes}, 0)`.as('votes'),
  })
    .from(academicFiles)
    .leftJoin(votesCount, eq(academicFiles.id, votesCount.fileID))
    .innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
    .where(and(...whereConditions))
    .orderBy(desc(academicFiles.createdAt))
    .limit(limit).offset(offset);
}

export async function incrementFileViews(id: number) {
  const db = await getDb();
  if (!db) return;
  return db.update(academicFiles).set({ views: sql`${academicFiles.views} + 1` } as any).where(eq(academicFiles.id, id));
}

export async function getStudentFiles(studentID: number) {
  const db = await getDb();
  return db?.select().from(academicFiles).where(eq(academicFiles.uploadedByStudentID, studentID)) ?? [];
}

export async function deleteAcademicFile(id: number) { // soft delete
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(academicFiles).set({ deletedAt: new Date() } as any).where(eq(academicFiles.id, id));
}

export async function hardDeleteAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(academicFiles).where(eq(academicFiles.id, id));
}

export async function restoreAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(academicFiles).set({ deletedAt: null } as any).where(eq(academicFiles.id, id));
}

export async function updateAcademicFile(id: number, data: Partial<InsertAcademicFile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(academicFiles).set(data).where(eq(academicFiles.id, id));
}

export async function approveAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [file] = await db.select().from(academicFiles).where(eq(academicFiles.id, id)).limit(1);
  if (!file) throw new Error("File not found");

  await db.update(academicFiles).set({ isApproved: true } as any).where(eq(academicFiles.id, id));
  await db.insert(notifications).values({
    userId: file.uploadedByStudentID,
    type: 'SYSTEM',
    message: `تمت الموافقة على ملفك "${file.fileName}" وهو متاح الآن للجميع! 🎉`,
    isRead: false
  });
  return { success: true };
}

export async function reportAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(academicFiles).set({ reportsCount: sql`${academicFiles.reportsCount} + 1` } as any).where(eq(academicFiles.id, id));
}

export async function resetAcademicFileReports(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(academicFiles).set({ reportsCount: 0 } as any).where(eq(academicFiles.id, id));
}

// -------------------- Voting (with petal safeguard) --------------------
export async function voteFile(fileID: number, studentID: number, voteType: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    const [file] = await tx.select({
      uploaderId: academicFiles.uploadedByStudentID,
      fileName: academicFiles.fileName,
    }).from(academicFiles).where(eq(academicFiles.id, fileID)).limit(1);
    if (!file) throw new Error("File not found");

    const [existing] = await tx.select().from(fileVotes).where(
      and(eq(fileVotes.fileID, fileID), eq(fileVotes.studentID, studentID))
    ).limit(1);

    let petalChange = 0;

    if (existing) {
      if (existing.voteType === voteType) {
        await tx.delete(fileVotes).where(eq(fileVotes.id, existing.id));
        if (voteType === 1) petalChange = -1;
      } else {
        await tx.update(fileVotes).set({ voteType }).where(eq(fileVotes.id, existing.id));
        if (voteType === 1) {
          petalChange = 1;
          if (file.uploaderId !== studentID) {
            await tx.insert(notifications).values({
              userId: file.uploaderId, type: "LIKE",
              message: `حصل ملفك "${file.fileName}" على إعجاب! ✨`, isRead: false,
            });
          }
        } else if (existing.voteType === 1) {
          petalChange = -1;
        }
      }
    } else {
      await tx.insert(fileVotes).values({ fileID, studentID, voteType });
      if (voteType === 1) {
        petalChange = 1;
        if (file.uploaderId !== studentID) {
          await tx.insert(notifications).values({
            userId: file.uploaderId, type: "LIKE",
            message: `حصل ملفك "${file.fileName}" على إعجاب جديد! ✨`, isRead: false,
          });
        }
      }
    }

    if (petalChange !== 0) {
      await tx.update(students)
        .set({ petals: sql`GREATEST(0, ${students.petals} + ${petalChange})` } as any)
        .where(eq(students.id, file.uploaderId));
    }
    return { success: true };
  });
}

// -------------------- Comments --------------------
export async function addCommentToDb(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(comments).values(data as any);
}

export async function getCommentsByFileId(fileID: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: comments.id, text: comments.text, createdAt: comments.createdAt,
    studentName: students.fullName,
  }).from(comments).innerJoin(students, eq(comments.studentID, students.id))
    .where(eq(comments.fileID, fileID));
}

export async function getStudentComments(studentID: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: comments.id, text: comments.text, createdAt: comments.createdAt,
    fileName: academicFiles.fileName, fileID: academicFiles.id,
  }).from(comments).innerJoin(academicFiles, eq(comments.fileID, academicFiles.id))
    .where(eq(comments.studentID, studentID));
}

// -------------------- Stats --------------------
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { students: 0, files: 0, comments: 0 };
  const [s, f, c] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(students).where(isNull(students.deletedAt)),
    db.select({ count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt)),
    db.select({ count: sql<number>`count(*)` }).from(comments),
  ]);
  return { students: Number(s[0].count), files: Number(f[0].count), comments: Number(c[0].count) };
}

export async function getPublicPlatformStats() {
  const db = await getDb();
  if (!db) return { students: 0, files: 0, aiFeatures: 3 };
  const [s, f] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(students).where(isNull(students.deletedAt)),
    db.select({ count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt)),
  ]);
  return { students: Number(s[0].count), files: Number(f[0].count), aiFeatures: 3 };
}

export async function getAdvancedSystemStats() {
  const db = await getDb();
  if (!db) return null;

  const [s, f] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(students).where(isNull(students.deletedAt)),
    db.select({ count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt)),
  ]);
  const totalStorage = await db.select({ total: sql<number>`COALESCE(SUM(${academicFiles.fileSize}),0)` }).from(academicFiles).where(isNull(academicFiles.deletedAt));
  const topSubjects = await db.select({ subject: academicFiles.subject, count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt)).groupBy(academicFiles.subject).orderBy(sql`count(*) DESC`).limit(5);
  const last7Days = await db.select({ date: sql<string>`DATE(${academicFiles.createdAt})`, count: sql<number>`count(*)` }).from(academicFiles).where(and(isNull(academicFiles.deletedAt), sql`${academicFiles.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`)).groupBy(sql`DATE(${academicFiles.createdAt})`).orderBy(sql`DATE(${academicFiles.createdAt}) ASC`);

  return {
    totalStudents: Number(s[0].count), totalFiles: Number(f[0].count),
    totalStorageBytes: Number(totalStorage[0].total), topSubjects, dailyUploads: last7Days
  };
}

// -------------------- Admin Listing --------------------
export async function getAllFilesWithUploader() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: academicFiles.id, fileName: academicFiles.fileName,
    fileType: academicFiles.fileType, subject: academicFiles.subject,
    year: academicFiles.year, fileUrl: academicFiles.fileUrl,
    uploadedBy: students.fullName, studentID: students.studentID,
    isApproved: academicFiles.isApproved, reportsCount: academicFiles.reportsCount,
    deletedAt: academicFiles.deletedAt, createdAt: academicFiles.createdAt,
  }).from(academicFiles).innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
    .where(isNull(academicFiles.deletedAt));
}

export async function getDeletedAcademicFiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: academicFiles.id, fileName: academicFiles.fileName,
    fileType: academicFiles.fileType, subject: academicFiles.subject,
    year: academicFiles.year, fileUrl: academicFiles.fileUrl,
    uploadedBy: students.fullName, studentID: students.studentID,
    isApproved: academicFiles.isApproved, reportsCount: academicFiles.reportsCount,
    deletedAt: academicFiles.deletedAt, createdAt: academicFiles.createdAt,
  }).from(academicFiles).innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
    .where(isNotNull(academicFiles.deletedAt));
}

// -------------------- Petals & Leaderboard --------------------
export async function incrementPetals(studentId: number, points: number) {
  const db = await getDb();
  if (!db) return;
  return db.update(students).set({ petals: sql`${students.petals} + ${points}` } as any).where(eq(students.id, studentId));
}

export async function getTopStudents(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: students.id, studentID: students.studentID, fullName: students.fullName, petals: students.petals, avatarUrl: students.avatarUrl }).from(students).where(isNull(students.deletedAt)).orderBy(desc(students.petals)).limit(limit);
}

export async function getAllStudents() {
  const db = await getDb();
  return db?.select().from(students) ?? [];
}

// -------------------- Course Reset --------------------
export async function resetAllStudentsCourses() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(students).set({ enrolledCourses: null, coursesUpdatedAt: new Date() } as any);
}

export async function resetStudentCourses(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(students).set({ enrolledCourses: null, coursesUpdatedAt: new Date() } as any).where(eq(students.id, id));
}

// -------------------- Favorites --------------------
export async function toggleFavoriteInDb(studentID: number, fileID: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(favorites).where(and(eq(favorites.studentID, studentID), eq(favorites.fileID, fileID))).limit(1);
  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { isFavorite: false };
  } else {
    await db.insert(favorites).values({ studentID, fileID });
    return { isFavorite: true };
  }
}

export async function getStudentFavoritesFromDb(studentID: number) {
  const db = await getDb();
  if (!db) return [];
  const votesCount = db.select({ fileID: fileVotes.fileID, totalVotes: sql<number>`SUM(${fileVotes.voteType})`.as("totalVotes") }).from(fileVotes).groupBy(fileVotes.fileID).as("v");
  return db.select({
    id: academicFiles.id, fileName: academicFiles.fileName,
    fileType: academicFiles.fileType, subject: academicFiles.subject,
    year: academicFiles.year, description: academicFiles.description,
    uploadedByStudentID: academicFiles.uploadedByStudentID,
    uploadedBy: students.fullName, uploaderPetals: students.petals,
    fileUrl: academicFiles.fileUrl, mimeType: academicFiles.mimeType,
    views: academicFiles.views, isApproved: academicFiles.isApproved,
    createdAt: academicFiles.createdAt,
    votes: sql<number>`IFNULL(${votesCount.totalVotes},0)`.as("votes"),
  }).from(favorites).innerJoin(academicFiles, eq(favorites.fileID, academicFiles.id))
    .innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
    .leftJoin(votesCount, eq(academicFiles.id, votesCount.fileID))
    .where(and(eq(favorites.studentID, studentID), isNull(academicFiles.deletedAt)));
}

// -------------------- Misc --------------------
export async function getExistingLectureNumbers(subject: string, doctorName: string, academicYear: string): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ lectureNumber: academicFiles.lectureNumber }).from(academicFiles).where(and(
    isNull(academicFiles.deletedAt), like(academicFiles.subject, `%${subject}%`),
    like(academicFiles.doctorName, `%${doctorName}%`), eq(academicFiles.academicYear, academicYear)
  ));
  return [...new Set(rows.map(r => r.lectureNumber).filter(Number.isInteger as any))].sort((a, b) => a - b);
}

export async function deleteStudentFromDb(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.userId, id));
  await db.delete(comments).where(eq(comments.studentID, id));
  await db.delete(fileVotes).where(eq(fileVotes.studentID, id));
  await db.delete(favorites).where(eq(favorites.studentID, id));
  await db.delete(academicFiles).where(eq(academicFiles.uploadedByStudentID, id));
  return db.delete(students).where(eq(students.id, id));
}

// -------------------- Notifications --------------------
export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  return db?.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))).orderBy(desc(notifications.createdAt)) ?? [];
}

export async function markNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  return db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function addNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  return db.insert(notifications).values(data);
}


export async function incrementFileDownloads(fileId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(academicFiles)
    .set({ downloads: sql`${academicFiles.downloads} + 1` })
    .where(eq(academicFiles.id, fileId));
}