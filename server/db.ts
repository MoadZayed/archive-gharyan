import { eq, or, and, sql, desc, lt, isNull, isNotNull, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { InsertUser, users, students, academicFiles, InsertAcademicFile, comments, InsertComment, fileVotes, Student, InsertStudent, favorites, notifications, InsertNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

import mysql from "mysql2/promise";

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

/**
 * Lazily creates the drizzle instance with a connection pool for scalability.
 * Automatically initializes the schema if it's the first connection.
 * @returns {Promise<ReturnType<typeof drizzle> | null>} The drizzle database instance.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        connectionLimit: 50,
        queueLimit: 0,
        waitForConnections: true,
        ssl: {
          rejectUnauthorized: false
        },
        multipleStatements: true
      });
      _db = drizzle(_pool as any, { schema, mode: "default" });

      // Auto-initialize schema if not done in this process
      if (!_initialized && _pool) {
        console.log("[Database] Checking schema integrity...");
        for (const sql_stmt of SCHEMA_SQL) {
          try {
            await _pool.query(sql_stmt);
          } catch (err) {
            console.error("[Database] Schema init error for statement:", sql_stmt.substring(0, 50), err);
          }
        }

        console.log("[Database] Running OAuth schema hotfixes...");
        // Hotfix for new OAuth columns
        try {
          await _pool.query("ALTER TABLE students ADD COLUMN googleId VARCHAR(255) UNIQUE AFTER studentID");
          console.log("[Database] Added googleId column to students table");
        } catch (err: any) {
          if (!err.message?.includes("Duplicate column name")) {
             console.error("[Database] Failed to add googleId column:", err.message);
          }
        }

        try {
          await _pool.query("ALTER TABLE students MODIFY COLUMN passwordHash VARCHAR(255) NULL");
          console.log("[Database] Updated passwordHash to be nullable");
        } catch (err: any) {
            console.error("[Database] Failed to modify passwordHash column:", err.message);
        }

        try {
          await _pool.query("ALTER TABLE students ADD COLUMN verificationStatus ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING' NOT NULL");
          console.log("[Database] Added verificationStatus column to students table");
        } catch (err: any) {
          if (!err.message?.includes("Duplicate column name")) {
             console.error("[Database] Failed to add verificationStatus column:", err.message);
          }
        }

        try {
          await _pool.query("ALTER TABLE academicFiles ADD COLUMN doctorName VARCHAR(255) AFTER courseCode");
          console.log("[Database] Added doctorName column to academicFiles table");
        } catch (err: any) {
          if (!err.message?.includes("Duplicate column name")) {
             console.error("[Database] Failed to add doctorName column:", err.message);
          }
        }

        try {
          await _pool.query("ALTER TABLE students MODIFY COLUMN deletedAt TIMESTAMP NULL");
          console.log("[Database] Ensured deletedAt is nullable in students table");
        } catch (err: any) {
           console.error("[Database] Failed to modify deletedAt column:", err.message);
        }

        try {
          await _pool.query("ALTER TABLE students ADD COLUMN petals INT DEFAULT 0 NOT NULL");
          console.log("[Database] Added petals column to students table");
        } catch (err: any) {
          if (!err.message?.includes("Duplicate column name")) {
             console.error("[Database] Failed to add petals column:", err.message);
          }
        }

        // Diagnostic: Describe table to see what's wrong
        try {
          const [rows]: any = await _pool.query("DESCRIBE students");
          console.log("[Database] Students Table Structure:", rows.map((r: any) => r.Field).join(", "));
        } catch (e) {}
        try {
          const [rows]: any = await _pool.query("DESCRIBE academicFiles");
          console.log("[Database] AcademicFiles Table Structure:", rows.map((r: any) => r.Field).join(", "));
        } catch (e: any) {
          console.error("[Database] Failed to describe academicFiles:", e.message);
        }

        try {
          await _pool.query("ALTER TABLE students ADD COLUMN deletedAt TIMESTAMP NULL AFTER isAccountLocked");
          console.log("[Database] Added missing deletedAt column to students table");
        } catch (err: any) {
          if (!err.message?.includes("Duplicate column name")) {
             console.error("[Database] Failed to add deletedAt column:", err.message);
          }
        }

        try {
          await _pool.query("ALTER TABLE academicFiles ADD COLUMN deletedAt TIMESTAMP NULL AFTER reportsCount");
          console.log("[Database] Added missing deletedAt column to academicFiles table");
        } catch (err: any) {
          if (!err.message?.includes("Duplicate column name")) {
             console.error("[Database] Failed to add deletedAt column to academicFiles:", err.message);
          }
        }

        _initialized = true;
        console.log("[Database] Schema check completed.");
      } else if (!_pool) {
        console.error("[Database] Pool initialization failed - pool is null");
      }
    } catch (error) {
      console.warn("[Database] Failed to connect or initialize:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Student queries
 */

/**
 * Retrieves a student by their email address.
 * @param {string} email - The student's email.
 * @returns {Promise<Student | undefined>} The student record or undefined.
 */
export async function getStudentByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.email, email)).limit(1);
  return result[0];
}

export async function getStudentByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.googleId, googleId)).limit(1);
  return result[0];
}

export async function getStudentByID(studentID: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.studentID, studentID), isNull(students.deletedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudentByDbId(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudentByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(students)
    .where(eq(students.resetToken, token))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStudent(
  studentID: string,
  passwordHash: string,
  fullName: string,
  email: string,
  securityQuestion: string,
  securityAnswerHash: string,
  role: "student" | "professor" | "admin" = "student"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(students).values({
    studentID,
    passwordHash,
    fullName,
    email,
    securityQuestion,
    securityAnswerHash,
    role,
  } as any);
}

export async function updateStudent(id: number, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(students).set(data).where(eq(students.id, id));
}

/**
 * Academic file queries
 */
export async function createAcademicFile(data: InsertAcademicFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(academicFiles).values({
    ...data,
    isApproved: false, 
    reportsCount: 0,
  } as any);
}

export async function getAcademicFileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(academicFiles)
    .where(eq(academicFiles.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFileByHash(hash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(academicFiles)
    .where(eq(academicFiles.fileHash, hash))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Retrieves all academic files with filtering and pagination support.
 * @param {boolean} isAdmin - Whether the caller is an administrator.
 * @param {number|string|null} studentDbId - The database ID of the requesting student.
 * @param {number} limit - The number of files to return (pagination).
 * @param {number} offset - The starting index (pagination).
 * @param {Object} filters - Optional filters like search, type, year, subject, doctorName.
 * @returns {Promise<any[]>} List of file records with aggregate vote counts and uploader info.
 */
export async function getAllAcademicFiles(
  isAdmin: boolean = false, 
  studentDbId?: string | number, 
  limit: number = 20, 
  offset: number = 0,
  filters?: {
    search?: string;
    fileType?: string;
    year?: number;
    subject?: string;
    doctorName?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const whereConditions: any[] = [
    isNull(academicFiles.deletedAt),
  ];

  // Quarantine limit for non-admins
  if (!isAdmin) {
    whereConditions.push(lt(academicFiles.reportsCount, 11));
    whereConditions.push(
      or(
        eq(academicFiles.isApproved, true),
        studentDbId ? eq(academicFiles.uploadedByStudentID, Number(studentDbId)) : sql`0=1`
      )
    );
  }

  // Advanced Filters
  if (filters) {
    if (filters.search) {
      const s = `%${filters.search}%`;
      whereConditions.push(
        or(
          like(academicFiles.fileName, s),
          like(academicFiles.description, s),
          like(academicFiles.subject, s),
          like(academicFiles.doctorName, s)
        )
      );
    }
    if (filters.fileType) whereConditions.push(eq(academicFiles.fileType, filters.fileType));
    if (filters.year) whereConditions.push(eq(academicFiles.year, filters.year));
    if (filters.subject) whereConditions.push(like(academicFiles.subject, `%${filters.subject}%`));
    if (filters.doctorName) whereConditions.push(like(academicFiles.doctorName, `%${filters.doctorName}%`));
  }

  // Subquery for total votes per file to avoid huge GROUP BY
  const votesCount = db
    .select({
      fileID: fileVotes.fileID,
      totalVotes: sql<number>`SUM(${fileVotes.voteType})`.as('totalVotes')
    })
    .from(fileVotes)
    .groupBy(fileVotes.fileID)
    .as('v');

  return await db.select({
    id: academicFiles.id,
    fileName: academicFiles.fileName,
    fileType: academicFiles.fileType,
    subject: academicFiles.subject,
    courseCode: academicFiles.courseCode,
    year: academicFiles.year,
    description: academicFiles.description,
    doctorName: academicFiles.doctorName,
    uploadedByStudentID: academicFiles.uploadedByStudentID,
    uploadedBy: students.fullName,
    uploaderPetals: students.petals,
    fileUrl: academicFiles.fileUrl,
    mimeType: academicFiles.mimeType,
    views: academicFiles.views,
    isApproved: academicFiles.isApproved,
    reportsCount: academicFiles.reportsCount,
    createdAt: academicFiles.createdAt,
    votes: sql<number>`COALESCE(${votesCount.totalVotes}, 0)`.as('votes'),
  })
  .from(academicFiles)
  .leftJoin(votesCount, eq(academicFiles.id, votesCount.fileID))
  .innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
  .where(and(...whereConditions))
  .orderBy(desc(academicFiles.createdAt))
  .limit(limit)
  .offset(offset);
}

export async function incrementFileViews(id: number) {
  const db = await getDb();
  if (!db) return;
  return await db.update(academicFiles)
    .set({ views: sql`${academicFiles.views} + 1` } as any)
    .where(eq(academicFiles.id, id));
}

export async function getStudentFiles(studentID: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(academicFiles)
    .where(eq(academicFiles.uploadedByStudentID, studentID));
}

export async function deleteAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft Delete
  return await db.update(academicFiles).set({ deletedAt: new Date() } as any).where(eq(academicFiles.id, id));
}

export async function hardDeleteAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(academicFiles).where(eq(academicFiles.id, id));
}

export async function restoreAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(academicFiles).set({ deletedAt: null } as any).where(eq(academicFiles.id, id));
}

export async function updateAcademicFile(
  id: number,
  data: Partial<InsertAcademicFile>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(academicFiles)
    .set(data)
    .where(eq(academicFiles.id, id));
}

export async function approveAcademicFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [file] = await db.select().from(academicFiles).where(eq(academicFiles.id, id)).limit(1);
  if (!file) throw new Error("File not found");

  await db.update(academicFiles).set({ isApproved: true } as any).where(eq(academicFiles.id, id));

  // Notify student
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
  return await db
    .update(academicFiles)
    .set({ reportsCount: sql`${academicFiles.reportsCount} + 1` } as any)
    .where(eq(academicFiles.id, id));
}

export async function resetAcademicFileReports(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(academicFiles)
    .set({ reportsCount: 0 } as any)
    .where(eq(academicFiles.id, id));
}

/**
 * Voting
 */
export async function voteFile(fileID: number, studentID: number, voteType: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    // 1. Get file uploader info
    const [file] = await tx.select({ uploaderId: academicFiles.uploadedByStudentID }).from(academicFiles).where(eq(academicFiles.id, fileID)).limit(1);
    if (!file) throw new Error("File not found");

    // 2. Check if vote exists
    const [existing] = await tx.select().from(fileVotes).where(
      and(eq(fileVotes.fileID, fileID), eq(fileVotes.studentID, studentID))
    ).limit(1);

    let petalChange = 0;

    if (existing) {
      if (existing.voteType === voteType) {
        // Remove vote
        await tx.delete(fileVotes).where(eq(fileVotes.id, existing.id));
        petalChange = voteType === 1 ? -1 : 0; // Only upvotes affect petals
      } else {
        // Update vote type
        await tx.update(fileVotes).set({ voteType }).where(eq(fileVotes.id, existing.id));
        if (voteType === 1) {
          petalChange = 1;
          // Notify uploader on new upvote
          if (file.uploadedByStudentID !== studentID) {
            await tx.insert(notifications).values({
              userId: file.uploadedByStudentID,
              type: 'LIKE',
              message: `حصل ملفك "${file.fileName}" على إعجاب! ✨`,
              isRead: false
            });
          }
        }
        else if (existing.voteType === 1) petalChange = -1; // From up (1) to down (else)
      }
      // New vote
      await tx.insert(fileVotes).values({ fileID, studentID, voteType });
      if (voteType === 1) {
        petalChange = 1;
        // Notify uploader
        if (file.uploadedByStudentID !== studentID) {
          await tx.insert(notifications).values({
            userId: file.uploadedByStudentID,
            type: 'LIKE',
            message: `حصل ملفك "${file.fileName}" على إعجاب جديد! ✨`,
            isRead: false
          });
        }
      }
    }

    // 3. Update uploader petals
    if (petalChange !== 0) {
      await tx.update(students)
        .set({ petals: sql`${students.petals} + ${petalChange}` } as any)
        .where(eq(students.id, file.uploaderId));
    }

    return { success: true };
  });
}

/**
 * Comments
 */
export async function addCommentToDb(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(comments).values(data as any);
}

export async function getCommentsByFileId(fileID: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: comments.id,
      text: comments.text,
      createdAt: comments.createdAt,
      studentName: students.fullName,
    })
    .from(comments)
    .innerJoin(students, eq(comments.studentID, students.id))
    .where(eq(comments.fileID, fileID));
    
  return result;
}

export async function getStudentComments(studentID: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: comments.id,
      text: comments.text,
      createdAt: comments.createdAt,
      fileName: academicFiles.fileName,
      fileID: academicFiles.id,
    })
    .from(comments)
    .innerJoin(academicFiles, eq(comments.fileID, academicFiles.id))
    .where(eq(comments.studentID, studentID));
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { students: 0, files: 0, comments: 0 };

  const studentsCount = await db.select({ count: sql<number>`count(*)` }).from(students).where(isNull(students.deletedAt));
  const filesCount = await db.select({ count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt));
  const commentsCount = await db.select({ count: sql<number>`count(*)` }).from(comments);

  return {
    students: Number(studentsCount[0].count),
    files: Number(filesCount[0].count),
    comments: Number(commentsCount[0].count),
  };
}

export async function getPublicPlatformStats() {
  const db = await getDb();
  if (!db) return { students: 0, files: 0, aiFeatures: 0 };

  const studentsCount = await db.select({ count: sql<number>`count(*)` }).from(students).where(isNull(students.deletedAt));
  const filesCount = await db.select({ count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt));
  const aiFeatures = 3;

  return {
    students: Number(studentsCount[0].count),
    files: Number(filesCount[0].count),
    aiFeatures,
  };
}

export async function getAdvancedSystemStats() {
  const db = await getDb();
  if (!db) return null;

  // 1. Basic Counts (Active only)
  const studentsCount = await db.select({ count: sql<number>`count(*)` }).from(students).where(isNull(students.deletedAt));
  const filesCount = await db.select({ count: sql<number>`count(*)` }).from(academicFiles).where(isNull(academicFiles.deletedAt));
  
  // 2. Storage Size (Sum)
  const totalStorage = await db.select({ total: sql<number>`COALESCE(SUM(${academicFiles.fileSize}), 0)` }).from(academicFiles).where(isNull(academicFiles.deletedAt));

  // 3. Top 5 Active Subjects
  const topSubjects = await db.select({
    subject: academicFiles.subject,
    count: sql<number>`count(*)`
  })
  .from(academicFiles)
  .where(isNull(academicFiles.deletedAt))
  .groupBy(academicFiles.subject)
  .orderBy(sql`count(*) DESC`)
  .limit(5);

  // 4. Last 7 Days Uploads
  const last7Days = await db.select({
    date: sql<string>`DATE(${academicFiles.createdAt})`,
    count: sql<number>`count(*)`
  })
  .from(academicFiles)
  .where(and(
    isNull(academicFiles.deletedAt),
    sql`${academicFiles.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
  ))
  .groupBy(sql`DATE(${academicFiles.createdAt})`)
  .orderBy(sql`DATE(${academicFiles.createdAt}) ASC`);

  return {
    totalStudents: Number(studentsCount[0].count),
    totalFiles: Number(filesCount[0].count),
    totalStorageBytes: Number(totalStorage[0].total),
    topSubjects,
    dailyUploads: last7Days
  };
}

export async function getAllFilesWithUploader() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: academicFiles.id,
      fileName: academicFiles.fileName,
      fileType: academicFiles.fileType,
      subject: academicFiles.subject,
      year: academicFiles.year,
      uploadedBy: students.fullName,
      studentID: students.studentID,
      isApproved: academicFiles.isApproved,
      reportsCount: academicFiles.reportsCount,
      deletedAt: academicFiles.deletedAt,
      createdAt: academicFiles.createdAt,
    })
    .from(academicFiles)
    .innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
    .where(isNull(academicFiles.deletedAt));
}

export async function getDeletedAcademicFiles() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: academicFiles.id,
      fileName: academicFiles.fileName,
      fileType: academicFiles.fileType,
      subject: academicFiles.subject,
      year: academicFiles.year,
      uploadedBy: students.fullName,
      studentID: students.studentID,
      isApproved: academicFiles.isApproved,
      reportsCount: academicFiles.reportsCount,
      deletedAt: academicFiles.deletedAt,
      createdAt: academicFiles.createdAt,
    })
    .from(academicFiles)
    .innerJoin(students, eq(academicFiles.uploadedByStudentID, students.id))
    .where(isNotNull(academicFiles.deletedAt));
}

export async function incrementPetals(studentId: number, points: number) {
  const db = await getDb();
  if (!db) return;
  return await db.update(students)
    .set({ petals: sql`${students.petals} + ${points}` } as any)
    .where(eq(students.id, studentId));
}

export async function getTopStudents(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: students.id,
      studentID: students.studentID,
      fullName: students.fullName,
      petals: students.petals,
      avatarUrl: students.avatarUrl
    })
    .from(students)
    .where(isNull(students.deletedAt))
    .orderBy(desc(students.petals))
    .limit(limit);
}

export async function getAllStudents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(students);
}

export async function resetAllStudentsCourses() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(students).set({
    enrolledCourses: null,
    coursesUpdatedAt: new Date()
  } as any);
}

export async function resetStudentCourses(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(students).set({
    enrolledCourses: null,
    coursesUpdatedAt: new Date()
  } as any).where(eq(students.id, id));
}

export async function toggleFavoriteInDb(studentID: number, fileID: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.studentID, studentID), eq(favorites.fileID, fileID)))
    .limit(1);

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

  return await db
    .select({
      id: academicFiles.id,
      fileName: academicFiles.fileName,
      fileType: academicFiles.fileType,
      subject: academicFiles.subject,
      year: academicFiles.year,
      description: academicFiles.description,
      uploadedByStudentID: academicFiles.uploadedByStudentID,
      fileUrl: academicFiles.fileUrl,
      mimeType: academicFiles.mimeType,
      isApproved: academicFiles.isApproved,
      createdAt: academicFiles.createdAt,
    })
    .from(favorites)
    .innerJoin(academicFiles, eq(favorites.fileID, academicFiles.id))
    .where(eq(favorites.studentID, studentID));
}

export async function deleteStudentFromDb(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Cascade deletion of related entities to prevent foreign key constraint issues
  await db.delete(notifications).where(eq(notifications.userId, id));
  await db.delete(comments).where(eq(comments.studentID, id));
  await db.delete(fileVotes).where(eq(fileVotes.studentID, id));
  await db.delete(favorites).where(eq(favorites.studentID, id));
  await db.delete(academicFiles).where(eq(academicFiles.uploadedByStudentID, id));
  
  // Finally delete the student
  return await db.delete(students).where(eq(students.id, id));
}

/**
 * Notifications Management
 */
export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  return await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function addNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  return await db.insert(notifications).values(data);
}