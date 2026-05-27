import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  googleId: varchar("googleId", { length: 128 }).unique(), // For Google-specific ID
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Student table for academic platform
 */
export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  studentID: varchar('studentID', { length: 50 }).unique(),
  googleId: varchar('googleId', { length: 255 }).unique(), // Added for OAuth
  passwordHash: varchar('passwordHash', { length: 255 }), // Made nullable for OAuth users
  fullName: varchar('fullName', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['student', 'professor', 'moderator', 'admin']).default('student').notNull(),
  moderatorPermissions: text('moderatorPermissions'), // JSON representation of permissions
  email: varchar('email', { length: 320 }),
  avatarUrl: text("avatarUrl"),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  securityQuestion: text("securityQuestion"),
  securityAnswerHash: varchar("securityAnswerHash", { length: 255 }),
  failedAttempts: int("failedAttempts").default(0).notNull(),
  lockoutUntil: timestamp("lockoutUntil"),
  enrolledCourses: text("enrolledCourses"), // Storing as JSON string or comma-separated for compatibility
  coursesUpdatedAt: timestamp("coursesUpdatedAt"),
  lastInteractionAt: timestamp("lastInteractionAt").defaultNow(),
  isAccountLocked: boolean("isAccountLocked").default(false).notNull(),
  deletedAt: timestamp("deletedAt"),
  petals: int("petals").default(0).notNull(),
  verificationStatus: mysqlEnum('verificationStatus', ['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING').notNull(),
  registrationStatus: mysqlEnum('registrationStatus', ['pending', 'approved', 'rejected', 'suspended']).default('pending').notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // ID of admin/moderator
  rejectionReason: text("rejectionReason"),
  lastLoginAt: timestamp("lastLoginAt"),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Academic files table
 */
export const academicFiles = mysqlTable("academicFiles", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // "exam", "summary", "curriculum", "other"
  subject: varchar("subject", { length: 255 }).notNull(),
  courseCode: varchar("courseCode", { length: 20 }),
  doctorName: varchar("doctorName", { length: 255 }),
  year: int("year").notNull(),
  description: text("description"),
  uploadedByStudentID: int("uploadedByStudentID").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 storage key
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(), // S3 presigned URL or storage path
  fileHash: varchar("fileHash", { length: 64 }).unique(),
  fileSize: int("fileSize").notNull(),
  lectureNumber: int("lectureNumber"),
  academicYear: varchar("academicYear", { length: 20 }),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  views: int("views").default(0).notNull(),
  downloads: int("downloads").default(0).notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  reportsCount: int("reportsCount").default(0).notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  status: mysqlEnum("status", ["uploading", "processing", "ready", "failed", "pending", "approved", "rejected", "flagged"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  rejectedAt: timestamp("rejectedAt"),
  rejectedBy: int("rejectedBy"),
  rejectionReason: text("rejectionReason"),
  failReason: text("failReason"),
}, (table) => ({
  courseCodeIdx: index("courseCode_idx").on(table.courseCode),
  uploaderIdx: index("uploader_idx").on(table.uploadedByStudentID),
  fileHashIdx: index("fileHash_idx").on(table.fileHash),
  deletedAtIdx: index("deletedAt_idx").on(table.deletedAt),
  searchIdx: index("idx_academic_files_search").on(table.subject, table.year, table.fileType),
}));

export type AcademicFile = typeof academicFiles.$inferSelect;
export type InsertAcademicFile = typeof academicFiles.$inferInsert;

/**
 * File votes table for ranking quality content
 */
export const fileVotes = mysqlTable("fileVotes", {
  id: int("id").autoincrement().primaryKey(),
  fileID: int("fileID").notNull(),
  studentID: int("studentID").notNull(),
  voteType: int("voteType").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileVote = typeof fileVotes.$inferSelect;
export type InsertFileVote = typeof fileVotes.$inferInsert;

/**
 * Comments table for student feedback
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  text: text("text").notNull(),
  fileID: int("fileID").notNull(),
  studentID: int("studentID").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Favorites table
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  studentID: int("studentID").notNull(),
  fileID: int("fileID").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Semester votes table to track system resets
 */
export const semesterVotes = mysqlTable("semesterVotes", {
  id: int("id").autoincrement().primaryKey(),
  studentID: int("studentID").notNull(),
  voteDate: timestamp("voteDate").defaultNow().notNull(),
  isNewSemester: boolean("isNewSemester").notNull(),
});

export type SemesterVote = typeof semesterVotes.$inferSelect;
export type InsertSemesterVote = typeof semesterVotes.$inferInsert;

/**
 * Detailed user courses table for add/drop management
 */
export const userCourses = mysqlTable("userCourses", {
  id: int("id").autoincrement().primaryKey(),
  studentID: int("studentID").notNull(),
  courseName: varchar("courseName", { length: 255 }).notNull(),
  courseCode: varchar("courseCode", { length: 50 }),
  semester: varchar("semester", { length: 20 }),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type UserCourse = typeof userCourses.$inferSelect;
export type InsertUserCourse = typeof userCourses.$inferInsert;

/**
 * Student Courses mapping table
 */
export const studentCourses = mysqlTable("studentCourses", {
  id: int("id").autoincrement().primaryKey(),
  studentId: varchar("studentId", { length: 50 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  semester: varchar("semester", { length: 20 }),
  academicYear: varchar("academicYear", { length: 20 }),
}, (table) => ({
  uniqueMapping: index("student_course_idx").on(table.studentId, table.courseId),
}));

export type StudentCourse = typeof studentCourses.$inferSelect;
export type InsertStudentCourse = typeof studentCourses.$inferInsert;

/**
 * Login Attempts for security
 */
export const loginAttempts = mysqlTable("loginAttempts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
  wasSuccessful: boolean("wasSuccessful").notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;

/**
 * Semesters tracking table
 */
export const semesters = mysqlTable("semesters", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  consensusReached: boolean("consensusReached").default(false).notNull(),
});

export type Semester = typeof semesters.$inferSelect;
export type InsertSemester = typeof semesters.$inferInsert;

/**
 * Notifications table for internal interaction
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Recipient student DB ID
  type: mysqlEnum("type", ["LIKE", "SYSTEM"]).default("SYSTEM").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  isReadIdx: index("isRead_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Announcements table for system-wide notices
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  createdBy: int("createdBy").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  targetAudience: mysqlEnum("targetAudience", ["all", "students", "moderators"]).default("all").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Background jobs for AI analysis
 */
export const aiJobs = mysqlTable("aiJobs", {
  id: int("id").autoincrement().primaryKey(),
  fileId: int("fileId").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  errorReason: text("errorReason"),
  lockedAt: timestamp("lockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
}));

export type AiJob = typeof aiJobs.$inferSelect;
export type InsertAiJob = typeof aiJobs.$inferInsert;