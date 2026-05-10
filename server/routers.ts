import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import axios from "axios";
import {
  getStudentByID,
  getStudentByDbId,
  getStudentByEmail,
  getStudentByResetToken,
  createStudent,
  updateStudent,
  getAllAcademicFiles,
  getStudentFiles,
  createAcademicFile,
  deleteAcademicFile,
  updateAcademicFile,
  getAcademicFileById,
  approveAcademicFile,
  voteFile,
  addCommentToDb,
  getCommentsByFileId,
  getStudentComments,
  getAdminStats,
  getAllFilesWithUploader,
  getAllStudents,
  resetAllStudentsCourses,
  resetStudentCourses,
  toggleFavoriteInDb,
  getStudentFavoritesFromDb,
  deleteStudentFromDb,
  getPublicPlatformStats,
  reportAcademicFile,
  resetAcademicFileReports,
  getFileByHash,
  restoreAcademicFile,
  hardDeleteAcademicFile,
  getUnreadNotifications,
  markNotificationsAsRead,
  addNotification,
  getAdvancedSystemStats,
  incrementReputation,
  getDeletedAcademicFiles,
  incrementFileViews,
  getDb
} from "./db";
import { serverCache } from "./cache";
import { ENV } from './_core/env';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "./auth";
import { storagePut, storageGet } from "./storage";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import { count, desc, eq, isNull, sql, and } from "drizzle-orm";
import { academicFiles, students, semesters, semesterVotes } from "../drizzle/schema";
import DOMPurify from "isomorphic-dompurify";

const sanitize = (text: string) => DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

const studentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user) {
    const isAdmin = ctx.user.role === 'admin' || ctx.user.openId === ENV.ownerOpenId;
    return next({
      ctx: {
        ...ctx,
        student: {
          studentID: ctx.user.openId,
          studentDbId: ctx.user.id,
          role: ctx.user.role || 'student',
          isOAuth: true,
          isAdmin
        },
      },
    });
  }
  const token = ctx.req.headers.authorization?.replace("Bearer ", "");
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });
  const decoded = verifyToken(token);
  if (!decoded) throw new TRPCError({ code: "UNAUTHORIZED", message: "انتهت صلاحية الجلسة" });
  
  if (decoded.studentDbId === 'super-admin') {
    return next({ ctx: { ...ctx, student: { ...decoded, isOAuth: false, isAdmin: true } } });
  }
  
  const studentData = typeof decoded.studentDbId === 'number' ? await getStudentByDbId(decoded.studentDbId) : null;
  const isAdmin = studentData?.role === 'admin' || decoded.role === 'admin';
  return next({
    ctx: {
      ...ctx,
      student: {
        ...decoded,
        role: studentData?.role || decoded.role || 'student',
        isOAuth: false,
        isAdmin
      },
    },
  });
});

const optionalStudentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user) {
    const isAdmin = ctx.user.role === 'admin' || ctx.user.openId === ENV.ownerOpenId;
    return next({ ctx: { ...ctx, student: { studentID: ctx.user.openId, studentDbId: ctx.user.id, role: ctx.user.role || 'student', isOAuth: true, isAdmin } } });
  }
  const token = ctx.req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next({ ctx: { ...ctx, student: null } });
  const decoded = verifyToken(token);
  if (!decoded) return next({ ctx: { ...ctx, student: null } });
  
  const studentData = typeof decoded.studentDbId === 'number' ? await getStudentByDbId(decoded.studentDbId) : null;
  const isAdmin = studentData?.role === 'admin' || decoded.role === 'admin';
  return next({ ctx: { ...ctx, student: { ...decoded, role: studentData?.role || decoded.role || 'student', verificationStatus: studentData?.verificationStatus || (isAdmin ? 'VERIFIED' : 'PENDING'), isOAuth: false, isAdmin } } });
});

const verifiedProcedure = studentProcedure.use(async ({ ctx, next }) => {
  if (!ctx.student) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (ctx.student.isAdmin) return next();
  if (ctx.student.verificationStatus !== 'VERIFIED') throw new TRPCError({ code: "FORBIDDEN", message: "حسابك قيد المراجعة" });
  return next();
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    saveEnrolledCourses: studentProcedure
      .input(z.array(z.string()).max(6))
      .mutation(async ({ input, ctx }) => {
        await updateStudent(ctx.student.studentDbId as number, { enrolledCourses: JSON.stringify(input), coursesUpdatedAt: new Date() });
        return { success: true };
      }),
    register: publicProcedure
      .input(z.object({ studentID: z.string(), fullName: z.string(), email: z.string(), password: z.string(), securityQuestion: z.string(), securityAnswer: z.string(), role: z.enum(["student", "professor"]).default("student") }))
      .mutation(async ({ input }) => {
        const existing = await getStudentByID(input.studentID);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "رقم القيد مسجل مسبقاً" });
        const passwordHash = await hashPassword(input.password);
        const securityAnswerHash = await hashPassword(input.securityAnswer.trim().toLowerCase());
        await createStudent(input.studentID, passwordHash, sanitize(input.fullName), sanitize(input.email), input.securityQuestion, securityAnswerHash, input.role);
        const student = await getStudentByID(input.studentID);
        if (!student) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { success: true, token: generateToken(input.studentID, student.id), student: { id: student.id, studentID: student.studentID, fullName: student.fullName, role: student.role, isAdmin: student.role === 'admin' } };
      }),
    login: publicProcedure
      .input(z.object({ studentID: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        const student = await getStudentByID(input.studentID);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "رقم القيد غير مسجل" });
        if (student.lockoutUntil && student.lockoutUntil > new Date()) throw new TRPCError({ code: "FORBIDDEN", message: "الحساب مقفل مؤقتاً" });
        const valid = await verifyPassword(input.password, student.passwordHash || "");
        if (!valid) {
          const attempts = (student.failedAttempts || 0) + 1;
          await updateStudent(student.id, { failedAttempts: attempts, lockoutUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور خاطئة" });
        }
        await updateStudent(student.id, { failedAttempts: 0, lockoutUntil: null, lastInteractionAt: new Date() });
        return { success: true, token: generateToken(student.studentID!, student.id, student.role), student: { id: student.id, studentID: student.studentID, fullName: student.fullName, role: student.role, isAdmin: student.role === 'admin' } };
      }),
    adminLogin: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
        if (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) {
          return { success: true, token: generateToken(ADMIN_USERNAME, 'super-admin', 'admin', '7d'), student: { id: -1, studentID: ADMIN_USERNAME, fullName: "المدير العام", role: 'admin', isAdmin: true } };
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات غير صحيحة" });
      }),
    me: optionalStudentProcedure.query(async ({ ctx }) => {
      if (!ctx.student) return null;
      const student = typeof ctx.student.studentDbId === 'number' ? await getStudentByDbId(ctx.student.studentDbId) : null;
      return { ...ctx.student, fullName: student?.fullName || ctx.student.studentID, onboardingCompleted: student?.onboardingCompleted ?? false, enrolledCourses: student?.enrolledCourses ? JSON.parse(student.enrolledCourses) : [], verificationStatus: student?.verificationStatus || 'PENDING' };
    }),
    completeOnboarding: studentProcedure
      .input(z.object({ enrolledCourses: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await updateStudent(ctx.student.studentDbId as number, { enrolledCourses: input.enrolledCourses, onboardingCompleted: true });
        return { success: true };
      }),

    resetSemester: studentProcedure
      .mutation(async ({ ctx }) => {
        await updateStudent(ctx.student.studentDbId as number, {
          enrolledCourses: null,
          onboardingCompleted: false,
          coursesUpdatedAt: new Date(),
        });
        return { success: true };
      }),

    logout: publicProcedure.mutation(async () => ({ success: true })),
  }),

  admin: router({
    getDashboardStats: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return await getAdminStats();
    }),
    getAllStudents: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return await getAllStudents();
    }),
    verifyStudent: studentProcedure
      .input(z.object({ studentDbId: z.number(), status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        await db_inst.update(students).set({ verificationStatus: input.status }).where(eq(students.id, input.studentDbId));
        return { success: true };
      }),
  }),

  files: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const files = await getAllAcademicFiles(true, 0, input.limit, input.offset, { search: input.search });
        return files.map(f => ({ ...f, createdAt: f.createdAt.toISOString() }));
      }),
    upload: verifiedProcedure
      .input(z.object({ fileName: z.string(), fileType: z.string(), subject: z.string(), year: z.number(), semester: z.string(), doctorName: z.string(), academicYear: z.string(), mimeType: z.string(), fileKey: z.string(), fileUrl: z.string(), fileHash: z.string(), fileSize: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await createAcademicFile({ ...input, uploadedByStudentID: ctx.student.studentDbId as number, isApproved: false } as any);
        return { success: true };
      }),
  }),

  comments: router({
    add: studentProcedure
      .input(z.object({ fileID: z.number(), text: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await addCommentToDb({ fileID: input.fileID, text: sanitize(input.text), studentID: ctx.student.studentDbId as number });
        return { success: true };
      }),
    list: publicProcedure
      .input(z.object({ fileID: z.number() }))
      .query(async ({ input }) => {
        const comments = await getCommentsByFileId(input.fileID);
        return comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }));
      }),
  }),

  stats: router({
    getPlatformStats: publicProcedure.query(async () => await getPublicPlatformStats()),
  }),

  notifications: router({
    getUnreadNotifications: studentProcedure.query(async ({ ctx }) => {
      const notes = await getUnreadNotifications(ctx.student.studentDbId as number);
      return notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }));
    }),
    markAsRead: studentProcedure.mutation(async ({ ctx }) => {
      await markNotificationsAsRead(ctx.student.studentDbId as number);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;