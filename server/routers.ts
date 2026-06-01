console.log("🛣️ [Startup] Routers Module Loading...");
import { statsRouter } from "./statsRouter";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getStudentByID,
  getStudentByDbId,
  createStudent,
  updateStudent,
  getAllAcademicFiles,
  getStudentFiles,
  createAcademicFile,
  deleteAcademicFile,
  getAcademicFileById,
  approveAcademicFile,
  updateAcademicFile,
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
  reportAcademicFile,
  resetAcademicFileReports,
  getFileByHash,
  restoreAcademicFile,
  hardDeleteAcademicFile,
  getUnreadNotifications,
  markNotificationsAsRead,
  getDeletedAcademicFiles,
  incrementFileViews,
  incrementFileDownloads,
  getDb,
  getAdvancedSystemStats,
  getExistingLectureNumbers,
  getStudentByResetToken,
} from "./db";
import { ENV } from "./_core/env";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "./auth";
import { storagePut, storageGetSignedUrl, storageDelete, storageGetSignedPutUrl, storageHeadObject } from "./storage";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import type { InvokeResult } from "./_core/llm";
import { eq, sql, and } from "drizzle-orm";
import { academicFiles, students } from "../drizzle/schema";
import DOMPurify from "isomorphic-dompurify";

const sanitize = (text: string) =>
  DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

function extractAssistantText(result: InvokeResult): string {
  const raw = result.choices[0]?.message?.content;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (p): p is { type: "text"; text: string } =>
          typeof p === "object" && p !== null && "type" in p && p.type === "text"
      )
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

const studentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user) {
    const isAdmin = ctx.user.role === "admin" || ctx.user.openId === ENV.ownerOpenId;
    return next({
      ctx: {
        ...ctx,
        student: {
          studentID: ctx.user.openId,
          studentDbId: ctx.user.id,
          role: ctx.user.role || "student",
          verificationStatus:
            ctx.user.role === "admin" || ctx.user.openId === ENV.ownerOpenId
              ? "VERIFIED"
              : "PENDING",
          isOAuth: true,
          isAdmin,
        },
      },
    });
  }
  const token = 
    ctx.req.headers.authorization?.replace("Bearer ", "") || 
    (ctx.req.headers.cookie?.match(/(?:^|;\s*)auth_token=([^;]*)/)?.[1]);
  
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });
  const decoded = verifyToken(token);
  if (!decoded) throw new TRPCError({ code: "UNAUTHORIZED", message: "انتهت صلاحية الجلسة" });

  if (decoded.studentDbId === -1 || (decoded.studentDbId as string | number) === "super-admin") {
    return next({
      ctx: {
        ...ctx,
        student: { ...decoded, verificationStatus: "VERIFIED", isOAuth: false, isAdmin: true },
      },
    });
  }

  const studentData =
    typeof decoded.studentDbId === "number" ? await getStudentByDbId(decoded.studentDbId) : null;
  const isAdmin = studentData?.role === "admin" || decoded.role === "admin";
  return next({
    ctx: {
      ...ctx,
      student: {
        ...decoded,
        role: studentData?.role || decoded.role || "student",
        verificationStatus:
          studentData?.verificationStatus || (isAdmin ? "VERIFIED" : "PENDING"),
        isOAuth: false,
        isAdmin,
      },
    },
  });
});

const optionalStudentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user) {
    const isAdmin = ctx.user.role === "admin" || ctx.user.openId === ENV.ownerOpenId;
    return next({
      ctx: {
        ...ctx,
        student: {
          studentID: ctx.user.openId,
          studentDbId: ctx.user.id,
          role: ctx.user.role || "student",
          verificationStatus: isAdmin ? "VERIFIED" : "PENDING",
          isOAuth: true,
          isAdmin,
        },
      },
    });
  }
  const token = 
    ctx.req.headers.authorization?.replace("Bearer ", "") || 
    (ctx.req.headers.cookie?.match(/(?:^|;\s*)auth_token=([^;]*)/)?.[1]);
    
  if (!token) return next({ ctx: { ...ctx, student: null } });
  const decoded = verifyToken(token);
  if (!decoded) return next({ ctx: { ...ctx, student: null } });

  if (decoded.studentDbId === -1 || (decoded.studentDbId as string | number) === "super-admin") {
    return next({
      ctx: {
        ...ctx,
        student: {
          ...decoded,
          verificationStatus: "VERIFIED",
          isOAuth: false,
          isAdmin: true,
        },
      },
    });
  }

  const studentData =
    typeof decoded.studentDbId === "number" ? await getStudentByDbId(decoded.studentDbId) : null;
  const isAdmin = studentData?.role === "admin" || decoded.role === "admin";
  return next({
    ctx: {
      ...ctx,
      student: {
        ...decoded,
        role: studentData?.role || decoded.role || "student",
        verificationStatus:
          studentData?.verificationStatus || (isAdmin ? "VERIFIED" : "PENDING"),
        isOAuth: false,
        isAdmin,
      },
    },
  });
});

const verifiedProcedure = studentProcedure.use(async ({ ctx, next }) => {
  if (!ctx.student) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (ctx.student.isAdmin) return next();
  if (ctx.student.verificationStatus !== "VERIFIED")
    throw new TRPCError({ code: "FORBIDDEN", message: "حسابك قيد المراجعة حالياً" });
  return next();
});

export const authRouter = router({
  version: publicProcedure.query(() => "1.0.1"),

  completeOnboarding: studentProcedure
    .input(z.object({ enrolledCourses: z.any() }))
    .mutation(async ({ input, ctx }) => {
      const id = (ctx.student.studentDbId as string | number) === "super-admin" ? -1 : ctx.student.studentDbId;
      if (typeof id !== "number") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "معرف غير صالح" });
      }
      // Ensure enrolledCourses is stringified
      const coursesStr = typeof input.enrolledCourses === 'string' 
        ? input.enrolledCourses 
        : JSON.stringify(input.enrolledCourses);
        
      await updateStudent(id, {
        enrolledCourses: coursesStr,
        onboardingCompleted: true,
        coursesUpdatedAt: new Date(),
      });
      return { success: true };
    }),

  register: publicProcedure
    .input(
      z.object({
        studentID: z.string(),
        fullName: z.string(),
        email: z.string(),
        password: z.string(),
        securityQuestion: z.string(),
        securityAnswer: z.string(),
        role: z.enum(["student", "professor"]).default("student"),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getStudentByID(input.studentID);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "رقم القيد مسجل مسبقاً" });
      const passwordHash = await hashPassword(input.password);
      const securityAnswerHash = await hashPassword(input.securityAnswer.trim().toLowerCase());
      await createStudent(
        input.studentID,
        passwordHash,
        sanitize(input.fullName),
        sanitize(input.email),
        input.securityQuestion,
        securityAnswerHash,
        input.role
      );
      const student = await getStudentByID(input.studentID);
      if (!student) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return {
        success: true,
        message: "تم إرسال طلب التسجيل بنجاح، يرجى انتظار موافقة الإدارة قبل تسجيل الدخول. سيتم إخطارك عند قبول طلبك.",
      };
    }),

  login: publicProcedure
    .input(z.object({ studentID: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const student = await getStudentByID(input.studentID);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "رقم القيد غير مسجل" });

      // Check lockout FIRST
      if (student.lockoutUntil && student.lockoutUntil > new Date()) {
        const remaining = Math.ceil((student.lockoutUntil.getTime() - Date.now()) / 60000);
        throw new TRPCError({ code: "FORBIDDEN", message: `الحساب مقفل مؤقتاً. حاول مرة أخرى بعد ${remaining} دقيقة` });
      }

      // Verify password
      const valid = await verifyPassword(input.password, student.passwordHash || "");
      if (!valid) {
        const attempts = (student.failedAttempts || 0) + 1;
        const isNowLocked = attempts >= 5;
        await updateStudent(student.id, {
          failedAttempts: attempts,
          lockoutUntil: isNowLocked ? new Date(Date.now() + 15 * 60 * 1000) : null,
        });
        if (isNowLocked) {
          throw new TRPCError({ code: "FORBIDDEN", message: "تم قفل حسابك لمدة 15 دقيقة بسبب محاولات دخول متكررة فاشلة" });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: `كلمة المرور خاطئة (${attempts}/5 محاولات)` });
      }

      // Check registration status BEFORE marking successful login
      const regStatus = (student as any).registrationStatus;
      if (regStatus === "rejected") {
        throw new TRPCError({ code: "FORBIDDEN", message: `تم رفض طلب تسجيلك: ${(student as any).rejectionReason || "بدون سبب مسجل"}` });
      }
      if (regStatus === "suspended") {
        throw new TRPCError({ code: "FORBIDDEN", message: "تم تعليق حسابك، يرجى التواصل مع الإدارة" });
      }

      // Check account lock (manual lock by admin)
      if (student.isAccountLocked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "تم تعطيل حسابك من قبل الإدارة" });
      }

      // Success: reset attempts and record login
      await updateStudent(student.id, {
        failedAttempts: 0,
        lockoutUntil: null,
        lastInteractionAt: new Date(),
        lastLoginAt: new Date()
      });

      return {
        success: true,
        token: generateToken(student.studentID!, student.id, student.role, "180d", student.moderatorPermissions),
        student: {
          id: student.id,
          studentID: student.studentID,
          fullName: student.fullName,
          role: student.role,
          isAdmin: student.role === "admin",
          moderatorPermissions: student.moderatorPermissions || null,
        },
      };
    }),


  adminLogin: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
      if (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) {
        return {
          success: true,
          token: generateToken(ADMIN_USERNAME, -1, "admin", "7d"),
          student: {
            id: -1,
            studentID: ADMIN_USERNAME,
            fullName: "المدير العام",
            role: "admin",
            isAdmin: true,
          },
        };
      }
      throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات غير صحيحة" });
    }),

  me: optionalStudentProcedure.query(async ({ ctx }) => {
    if (!ctx.student) return null;
    const student =
      typeof ctx.student.studentDbId === "number"
        ? await getStudentByDbId(ctx.student.studentDbId)
        : null;
    return {
      ...ctx.student,
      fullName: student?.fullName || ctx.student.studentID,
      onboardingCompleted: student?.onboardingCompleted ?? false,
      enrolledCourses: student?.enrolledCourses ? JSON.parse(student.enrolledCourses) : [],
      verificationStatus: student?.verificationStatus || "PENDING",
      coursesUpdatedAt: student?.coursesUpdatedAt ?? null,
      petals: student?.petals ?? 0,
      registrationStatus: student?.registrationStatus ?? "pending",
      rejectionReason: student?.rejectionReason ?? null,
      moderatorPermissions: (student as any)?.moderatorPermissions ?? (ctx.student as any).moderatorPermissions ?? null,
    };
  }),


  logout: publicProcedure.mutation(async () => ({ success: true })),

  checkSemesterStatus: studentProcedure.mutation(async ({ ctx }) => {
    if (typeof ctx.student.studentDbId !== "number")
      throw new TRPCError({ code: "BAD_REQUEST" });
    await updateStudent(ctx.student.studentDbId, { coursesUpdatedAt: new Date() });
    return { success: true };
  }),

  resetMyCourses: studentProcedure.mutation(async ({ ctx }) => {
    if (typeof ctx.student.studentDbId !== "number")
      throw new TRPCError({ code: "BAD_REQUEST" });
    await updateStudent(ctx.student.studentDbId, {
      enrolledCourses: null,
      onboardingCompleted: false,
      coursesUpdatedAt: new Date(),
    });
    return { success: true };
  }),

  resetSemester: studentProcedure.mutation(async ({ ctx }) => {
    await updateStudent(ctx.student.studentDbId as number, {
      enrolledCourses: null,
      onboardingCompleted: false,
      coursesUpdatedAt: new Date(),
    });
    return { success: true };
  }),

  getSecurityQuestion: publicProcedure
    .input(z.object({ studentID: z.string(), email: z.string() }))
    .query(async ({ input }) => {
      const student = await getStudentByID(input.studentID);
      if (
        !student ||
        student.email?.trim().toLowerCase() !== input.email.trim().toLowerCase()
      ) {
        throw new TRPCError({ code: "NOT_FOUND", message: "البيانات غير متطابقة" });
      }
      if (!student.securityQuestion) {
        throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد سؤال أمان" });
      }
      return { securityQuestion: student.securityQuestion };
    }),

  resetPassword: publicProcedure
    .input(
      z.union([
        z.object({ token: z.string(), newPassword: z.string().min(6) }),
        z.object({
          studentID: z.string(),
          securityAnswer: z.string(),
          newPassword: z.string().min(6),
        }),
      ])
    )
    .mutation(async ({ input }) => {
      if ("token" in input) {
        const row = await getStudentByResetToken(input.token);
        if (!row?.resetTokenExpiry || row.resetTokenExpiry < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "الرابط غير صالح" });
        }
        await updateStudent(row.id, {
          passwordHash: await hashPassword(input.newPassword),
          resetToken: null,
          resetTokenExpiry: null,
        });
        return { success: true };
      }
      const student = await getStudentByID(input.studentID);
      if (!student?.securityAnswerHash) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الحساب غير موجود" });
      }
      const ok = await verifyPassword(
        input.securityAnswer.trim().toLowerCase(),
        student.securityAnswerHash
      );
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "إجابة السؤال غير صحيحة" });
      }
      await updateStudent(student.id, { passwordHash: await hashPassword(input.newPassword) });
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,

  admin: router({
    getDashboardStats: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return await getAdminStats();
    }),
    getSystemStats: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return await getAdvancedSystemStats();
    }),
    getAllFiles: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const active = await getAllFilesWithUploader();
      const trashed = await getDeletedAcademicFiles();
      return [
        ...active.map((f) => ({ ...f, deletedAt: null as Date | null })),
        ...trashed,
      ];
    }),
    getAllStudents: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return await getAllStudents();
    }),
    verifyStudent: studentProcedure
      .input(
        z.object({
          studentDbId: z.number(),
          status: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        if (!db_inst)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        await db_inst
          .update(students)
          .set({ verificationStatus: input.status })
          .where(eq(students.id, input.studentDbId));
        return { success: true, message: "تم تحديث حالة الطالب بنجاح" };
      }),
    deleteFileAdmin: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteAcademicFile(input.fileId);
        return { success: true };
      }),
    restoreFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await resetAcademicFileReports(input.fileId);
        return { success: true };
      }),
    restoreDeletedFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await restoreAcademicFile(input.fileId);
        return { success: true };
      }),
    hardDeleteFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        
        // 1. Get file metadata to get the key
        const file = await getAcademicFileById(input.fileId);
        if (file && file.fileKey) {
          // 2. Delete physically from disk
          await storageDelete(file.fileKey);
        }

        // 3. Delete from database
        await hardDeleteAcademicFile(input.fileId);
        return { success: true };
      }),
    resetAllStudentsCourses: studentProcedure.mutation(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      await resetAllStudentsCourses();
      return { success: true };
    }),
    resetSingleStudentCourses: studentProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await resetStudentCourses(input.id);
        return { success: true };
      }),
    deleteStudent: studentProcedure
      .input(z.object({ studentDbId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteStudentFromDb(input.studentDbId);
        return { success: true };
      }),
    bulkUploadFiles: studentProcedure
      .input(
        z.object({
          files: z.array(
            z.object({
              fileName: z.string(),
              fileContent: z.string(),
              mimeType: z.string(),
            })
          ),
          metadata: z.object({
            fileType: z.string(),
            subject: z.string(),
            year: z.number(),
            semester: z.string(),
            doctorName: z.string(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const adminId = ctx.student.studentDbId;
        if (typeof adminId !== "number" && adminId !== "super-admin") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `ID غير صالح: ${typeof adminId}` });
        }
        const numericAdminId = (adminId as string | number) === "super-admin" ? -1 : adminId;

        const academicYear = `${input.metadata.year}-${input.metadata.year + 1}`;
        let count = 0;
        for (const f of input.files) {
          const buf = Buffer.from(f.fileContent, "base64");
          const fileHash = crypto.createHash("sha256").update(buf).digest("hex");
          const dup = await getFileByHash(fileHash);
          if (dup) continue;
          const store = await storagePut(`admin-seed/${f.fileName}`, buf, f.mimeType);
          await createAcademicFile({
            fileName: f.fileName,
            fileType: input.metadata.fileType,
            subject: input.metadata.subject,
            year: input.metadata.year,
            semester: input.metadata.semester,
            doctorName: input.metadata.doctorName,
            academicYear,
            mimeType: f.mimeType,
            fileKey: store.key,
            fileUrl: store.url,
            fileHash,
            fileSize: buf.length,
            uploadedByStudentID: numericAdminId,
            courseCode: input.metadata.subject.split(" - ")[0] || undefined,
            description: undefined,
            lectureNumber: null,
            isApproved: true,
          } as Parameters<typeof createAcademicFile>[0]);
          count++;
        }
        return { count };
      }),

    // --- MODERATOR & APPROVAL ENDPOINTS ---
    
    getPendingStudents: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
       
      // Granular check: moderators need can_approve_students permission
      if (!ctx.student.isAdmin) {
        let perms: any = {};
        try { perms = JSON.parse((ctx.student as any).moderatorPermissions || "{}"); } catch {}
        if (!perms.can_approve_students) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية عرض طلبات التسجيل" });
      }

      const db_inst = await getDb();
      if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const pending = await db_inst.select().from(students).where(eq(students.registrationStatus, 'pending'));
      
      if (ctx.student.isAdmin) return pending;
      
      // Sanitized data for moderators — never expose studentID or email
      return pending.map(s => ({
        id: s.id,
        fullName: s.fullName,
        role: s.role,
        registrationStatus: s.registrationStatus,
        createdAt: s.createdAt,
      }));
    }),

    approveStudent: studentProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
        if (!ctx.student.isAdmin) {
          let perms: any = {};
          try { perms = JSON.parse((ctx.student as any).moderatorPermissions || "{}"); } catch {}
          if (!perms.can_approve_students) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية قبول الطلاب" });
        }
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await db_inst.update(students).set({
          registrationStatus: 'approved',
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: typeof ctx.student.studentDbId === 'number' ? ctx.student.studentDbId : -1
        }).where(eq(students.id, input.userId));
        return { success: true, message: "تم قبول الطالب بنجاح" };
      }),

    rejectStudent: studentProcedure
      .input(z.object({ userId: z.number(), reason: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
        if (!ctx.student.isAdmin) {
          let perms: any = {};
          try { perms = JSON.parse((ctx.student as any).moderatorPermissions || "{}"); } catch {}
          if (!perms.can_approve_students) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية رفض الطلاب" });
        }
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await db_inst.update(students).set({
          registrationStatus: 'rejected',
          rejectionReason: input.reason
        }).where(eq(students.id, input.userId));
        return { success: true, message: "تم رفض طلب التسجيل" };
      }),

    getPendingFiles: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.student.isAdmin) {
        let perms: any = {};
        try { perms = JSON.parse((ctx.student as any).moderatorPermissions || "{}"); } catch {}
        if (!perms.can_approve_files && !perms.can_view_files) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية عرض الملفات" });
      }
      const db_inst = await getDb();
      if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      return await db_inst.select().from(academicFiles).where(eq(academicFiles.status, 'pending'));
    }),

    approveFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
        if (!ctx.student.isAdmin) {
          let perms: any = {};
          try { perms = JSON.parse((ctx.student as any).moderatorPermissions || "{}"); } catch {}
          if (!perms.can_approve_files) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية قبول الملفات" });
        }
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const updateResult = await db_inst.update(academicFiles).set({
          status: 'approved',
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: typeof ctx.student.studentDbId === 'number' ? ctx.student.studentDbId : -1
        }).where(and(eq(academicFiles.id, input.fileId), eq(academicFiles.status, 'pending')));

        if (updateResult[0].affectedRows > 0) {
           const fileToApprove = await db_inst.select().from(academicFiles).where(eq(academicFiles.id, input.fileId)).limit(1);
           if (fileToApprove[0]) {
              const studentInfo = await db_inst.select().from(students).where(eq(students.id, fileToApprove[0].uploadedByStudentID)).limit(1);
              if (studentInfo[0]) {
                await db_inst.update(students).set({ petals: studentInfo[0].petals + 1 }).where(eq(students.id, studentInfo[0].id));
              }
           }
        }
        return { success: true, message: "تم قبول الملف ونشره للطلاب" };
      }),

    rejectFile: studentProcedure
      .input(z.object({ fileId: z.number(), reason: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
        if (!ctx.student.isAdmin) {
          let perms: any = {};
          try { perms = JSON.parse((ctx.student as any).moderatorPermissions || "{}"); } catch {}
          if (!perms.can_approve_files) throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية رفض الملفات" });
        }
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await db_inst.update(academicFiles).set({
          status: 'rejected',
          rejectionReason: input.reason,
          rejectedAt: new Date(),
          rejectedBy: typeof ctx.student.studentDbId === 'number' ? ctx.student.studentDbId : -1
        }).where(eq(academicFiles.id, input.fileId));
        return { success: true, message: "تم رفض الملف" };
      }),

    // --- SUPER ADMIN ONLY MODERATOR ENDPOINTS ---
    
    getAllModerators: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const db_inst = await getDb();
      if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const mods = await db_inst.select().from(students).where(eq(students.role, 'moderator'));
      return mods.map(m => ({
        ...m,
        email: m.email ? `${m.email.substring(0, 3)}***@***.com` : null
      }));
    }),
    
    createModerator: studentProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        permissions: z.any()
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const passwordHash = await hashPassword(input.password);
        await db_inst.insert(students).values({
          fullName: sanitize(input.name),
          email: input.email,
          passwordHash: passwordHash,
          role: 'moderator',
          moderatorPermissions: JSON.stringify(input.permissions),
          verificationStatus: 'VERIFIED',
          registrationStatus: 'approved',
          isApproved: true,
          studentID: `MOD-${Date.now()}`
        } as any);
        return { success: true };
      }),

    updateModeratorPermissions: studentProcedure
      .input(z.object({ moderatorId: z.number(), permissions: z.any() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await db_inst.update(students)
          .set({ moderatorPermissions: JSON.stringify(input.permissions) })
          .where(eq(students.id, input.moderatorId));
        return { success: true };
      }),

    toggleModeratorActive: studentProcedure
      .input(z.object({ moderatorId: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        // Use isAccountLocked as the inverse of isActive
        await db_inst.update(students)
          .set({ isAccountLocked: !input.isActive })
          .where(eq(students.id, input.moderatorId));
        return { success: true };
      }),

    deleteModerator: studentProcedure
      .input(z.object({ moderatorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await db_inst.delete(students).where(eq(students.id, input.moderatorId));
        return { success: true };
      }),
  }),

  announcements: router({
    create: studentProcedure
      .input(z.object({
        title: z.string().optional(),
        content: z.string().min(1),
        targetAudience: z.enum(["all", "students", "moderators"]).default("all")
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin && (ctx.student.role as string) !== "moderator") throw new TRPCError({ code: "FORBIDDEN" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        // Dynamic import because schema was added
        const { announcements } = await import("../drizzle/schema");
        await db_inst.insert(announcements).values({
          title: input.title,
          content: input.content,
          targetAudience: input.targetAudience,
          createdBy: typeof ctx.student.studentDbId === 'number' ? ctx.student.studentDbId : -1,
        } as any);
        return { success: true };
      }),

    getAll: optionalStudentProcedure.query(async ({ ctx }) => {
      const db_inst = await getDb();
      if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const { announcements } = await import("../drizzle/schema");
      
      const role = ctx.student?.role || "student";
      const isAdmin = ctx.student?.isAdmin || false;
      
      let query = db_inst.select().from(announcements).where(eq(announcements.isActive, true));
      return await query;
    }),
  }),

  files: router({
    list: optionalStudentProcedure
      .input(
        z.object({
          search: z.string().optional(),
          fileType: z.string().optional(),
          year: z.number().optional(),
          subject: z.string().optional(),
          subjects: z.string().optional(),
          doctorName: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        const viewerId =
          ctx.student && typeof ctx.student.studentDbId === "number"
            ? ctx.student.studentDbId
            : undefined;
        const files = await getAllAcademicFiles(
          false,
          viewerId,
          input.limit,
          input.offset,
          {
            search: input.search,
            fileType: input.fileType,
            year: input.year,
            subject: input.subject,
            subjects: input.subjects ? input.subjects.split(",") : undefined,
            doctorName: input.doctorName,
          }
        );
        let favSet = new Set<number>();
        if (typeof viewerId === "number") {
          const favs = await getStudentFavoritesFromDb(viewerId);
          favSet = new Set(favs.map((x) => x.id));
        }
        return files.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
          isFavorite: favSet.has(f.id),
        }));
      }),

    createUploadIntent: studentProcedure
      .input(
        z.object({
          fileName: z.string(),
          mimeType: z.string(),
          fileHash: z.string(),
          fileSize: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const ALLOWED_MIME_TYPES = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "image/webp"
        ];
        
        if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "نوع الملف غير مدعوم" });
        }
        if (input.fileSize > 50 * 1024 * 1024) { // 50MB limit
           throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الملف يتجاوز الحد المسموح به (50 ميجابايت)" });
        }
        
        const dupCheck = await getFileByHash(input.fileHash);
        if (dupCheck) {
          throw new TRPCError({ code: "CONFLICT", message: "هذا الملف موجود مسبقاً في الأرشيف" });
        }

        const student = await getStudentByDbId(ctx.student.studentDbId as number);
        if (student?.registrationStatus !== 'approved' && !ctx.student.isAdmin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "سيتم تفعيل ميزة رفع الملفات بعد موافقة الإدارة على حسابك." });
        }

        const safePrefix = `uploads/${ctx.student.studentDbId}/`;
        const { url, finalKey } = await storageGetSignedPutUrl(`${safePrefix}${input.fileName}`, input.mimeType);
        return { uploadUrl: url, fileKey: finalKey };
      }),

    finalizeUpload: studentProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileType: z.string(),
          subject: z.string(),
          courseCode: z.string().optional(),
          year: z.number(),
          semester: z.string(),
          doctorName: z.string(),
          academicYear: z.string(),
          mimeType: z.string(),
          fileKey: z.string(),
          fileHash: z.string(),
          fileSize: z.number(),
          description: z.string().optional(),
          lectureNumber: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Prefix Validation (Ensure they are not finalizing an arbitrary B2 key)
        const expectedPrefix = `uploads/${ctx.student.studentDbId}/`;
        if (!input.fileKey.startsWith(expectedPrefix)) {
           throw new TRPCError({ code: "BAD_REQUEST", message: "مسار الملف غير صحيح أو لا تملك صلاحية لرفعه" });
        }

        // 2. Head Object check on B2
        const headInfo = await storageHeadObject(input.fileKey);
        if (!headInfo.exists) {
           throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الملف الفعلي في التخزين، يرجى إعادة الرفع" });
        }
        if (headInfo.contentLength !== undefined && headInfo.contentLength !== input.fileSize) {
           throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الملف لا يتطابق مع الحجم المرفوع فعلياً" });
        }
        if (headInfo.contentType !== undefined && headInfo.contentType !== input.mimeType) {
           throw new TRPCError({ code: "BAD_REQUEST", message: "نوع الملف الفعلي لا يطابق النوع المصرح به" });
        }

        // 3. Dedup check (to protect against race conditions)
        const dupCheck = await getFileByHash(input.fileHash);
        if (dupCheck) {
           throw new TRPCError({ code: "CONFLICT", message: "هذا الملف موجود مسبقاً في الأرشيف" });
        }

        const descParts = [input.description, input.semester ? `الفصل: ${input.semester}` : ""].filter(
          Boolean
        );

        const userInDb = typeof ctx.student.studentDbId === "number" ? await getStudentByDbId(ctx.student.studentDbId) : null;
        const reallyIsAdmin = userInDb?.role === "admin";
        
        const fileUrl = `https://${process.env.B2_BUCKET_NAME}.s3.${process.env.B2_REGION}.backblazeb2.com/${input.fileKey}`;

        try {
          await createAcademicFile({
            fileName: input.fileName,
            fileType: input.fileType,
            subject: input.subject,
            courseCode: input.courseCode,
            year: input.year,
            doctorName: input.doctorName,
            academicYear: input.academicYear,
            mimeType: input.mimeType,
            fileKey: input.fileKey,
            fileUrl: fileUrl,
            fileHash: input.fileHash,
            fileSize: input.fileSize,
            description: descParts.length ? descParts.join("\n") : undefined,
            lectureNumber: input.lectureNumber ?? null,
            uploadedByStudentID: ctx.student.studentDbId as number,
            isApproved: reallyIsAdmin,
            status: reallyIsAdmin ? "approved" : "pending",
            failReason: null
          } as Parameters<typeof createAcademicFile>[0]);

          const newFile = await getFileByHash(input.fileHash);
          const db = await getDb();
          
          if (newFile && input.mimeType.startsWith("image/")) {
             const { aiJobs } = await import("../drizzle/schema");
             await db.insert(aiJobs).values({
               fileId: newFile.id,
               status: "pending",
             } as any);
          }

          return { 
            success: true, 
            newStars: reallyIsAdmin ? 1 : 0,
            starGained: reallyIsAdmin
          };
        } catch (error: any) {
           console.error("Finalize upload DB error:", error);
           throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "فشل حفظ بيانات الملف، يرجى المحاولة مرة أخرى" });
        }
      }),

    edit: studentProcedure
      .input(
        z.object({
          fileId: z.number(),
          fileName: z.string().optional(),
          fileType: z.string().optional(),
          subject: z.string().optional(),
          doctorName: z.string().optional(),
          year: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const file = await getAcademicFileById(input.fileId);
        if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود" });

        if (!ctx.student.isAdmin && file.uploadedByStudentID !== ctx.student.studentDbId) {
           throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية تعديل بيانات هذا الملف" });
        }

        const updateData: any = {};
        if (input.fileName) updateData.fileName = input.fileName;
        if (input.fileType) updateData.fileType = input.fileType;
        if (input.subject) updateData.subject = input.subject;
        if (input.doctorName) updateData.doctorName = input.doctorName;
        if (input.year) updateData.year = input.year;

        await updateAcademicFile(input.fileId, updateData);

        return { success: true };
      }),

    approve: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await approveAcademicFile(input.fileId);
        return { success: true };
      }),

    analyzeDocument: studentProcedure
      .input(z.object({ fileData: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        // Limit base64 length (roughly 1MB) to prevent RAM exhaustion and timeouts
        if (input.fileData.length > 1.5 * 1024 * 1024) {
           throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "حجم الصورة كبير جداً للتحليل السريع." });
        }
        try {
          const result = await invokeLLM({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "صف محتوى هذه الصورة الأكاديمي باختصار بالعربية (عنوان المادة أو الموضوع إن وجد).",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${input.mimeType};base64,${input.fileData}`,
                    },
                  },
                ],
              },
            ],
          });
          const summary = extractAssistantText(result).trim();
          return { summary };
        } catch {
          return { summary: "" };
        }
      }),

    getExistingLectures: verifiedProcedure
      .input(
        z.object({
          subject: z.string(),
          doctorName: z.string(),
          academicYear: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await getExistingLectureNumbers(
          input.subject,
          input.doctorName,
          input.academicYear
        );
      }),

    incrementViews: publicProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input }) => {
        await incrementFileViews(input.fileId);
        return { success: true };
      }),

    download: publicProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const file = await getAcademicFileById(input.fileId);
        if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود" });

        if (!file.isApproved) {
          let isAllowed = false;
          const token = ctx.req?.headers?.authorization?.replace("Bearer ", "") || (ctx.req?.headers?.cookie?.match(/(?:^|;\s*)auth_token=([^;]*)/)?.[1]);
          if (token) {
            try {
              const payload = verifyToken(token) as any;
              if (payload && (payload.role === "admin" || payload.openId === ENV.ownerOpenId || file.uploadedByStudentID === payload.studentDbId)) {
                isAllowed = true;
              }
            } catch (e) {}
          }
          if (!isAllowed) {
            throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود أو قيد المراجعة" });
          }
        }
        
        await incrementFileDownloads(input.fileId);

        // توليد رابط موقع (Presigned URL) صالح لمدة ساعة من R2
        const signedUrl = await storageGetSignedUrl(file.fileKey);
        
        if (!signedUrl) {
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "فشل في توليد رابط التحميل، يرجى المحاولة لاحقاً" 
          });
        }

        return { 
          success: true, 
          url: signedUrl, 
          fileName: file.fileName 
        };
      }),


    myFiles: studentProcedure.query(async ({ ctx }) => {
      const rows = await getStudentFiles(ctx.student.studentDbId as number);
      return rows.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
      }));
    }),

    getFavorites: studentProcedure.query(async ({ ctx }) => {
      try {
        const rows = await getStudentFavoritesFromDb(ctx.student.studentDbId as number);
        return rows.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
        }));
      } catch (err) {
        console.error("Error fetching favorites:", err);
        return [];
      }
    }),
    toggleFavorite: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await toggleFavoriteInDb(ctx.student.studentDbId as number, input.fileId);
      }),

    report: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input }) => {
        await reportAcademicFile(input.fileId);
        return { success: true, message: "تم إرسال البلاغ بنجاح، سيقوم المشرفون بمراجعة الملف." };
      }),

    delete: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const file = await getAcademicFileById(input.fileId);
        if (!file) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "الملف غير موجود"
          });
        }

        // Check if user is owner or admin
        const isOwner = file.uploadedByStudentID === ctx.student.studentDbId;
        const isAdmin = ctx.student.isAdmin;

        if (!isOwner && !isAdmin) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "ليس لديك صلاحية لحذف هذا الملف"
          });
        }

        await deleteAcademicFile(input.fileId);
        return { success: true };
      }),
  }),

  comments: router({
    add: studentProcedure
      .input(z.object({ fileID: z.number(), text: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await addCommentToDb({
          fileID: input.fileID,
          text: sanitize(input.text),
          studentID: ctx.student.studentDbId as number,
        });
        return { success: true };
      }),
    list: publicProcedure
      .input(z.object({ fileID: z.number() }))
      .query(async ({ input }) => {
        const comments = await getCommentsByFileId(input.fileID);
        return comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));
      }),
    myComments: studentProcedure.query(async ({ ctx }) => {
      const list = await getStudentComments(ctx.student.studentDbId as number);
      return list.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));
    }),
  }),

  stats: statsRouter,

  students: router({
    getMyCourses: studentProcedure.query(async ({ ctx }) => {
      const id = ctx.student.studentDbId;
      if (typeof id !== "number") throw new TRPCError({ code: "BAD_REQUEST" });
      const db_inst = await getDb();
      if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const { studentCourses } = await import("../drizzle/schema");
      const courses = await db_inst.select().from(studentCourses).where(eq(studentCourses.studentId, String(id)));
      return courses.map(c => c.courseId);
    }),

    addCourse: studentProcedure
      .input(z.object({ courseId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const id = ctx.student.studentDbId;
        if (typeof id !== "number") throw new TRPCError({ code: "BAD_REQUEST" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { studentCourses } = await import("../drizzle/schema");
        
        // Count current
        const current = await db_inst.select().from(studentCourses).where(eq(studentCourses.studentId, String(id)));
        if (current.length >= 6) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك إضافة أكثر من 6 مواد" });
        
        // Check if exists
        if (current.some(c => c.courseId === input.courseId)) {
          return { success: true };
        }
        
        await db_inst.insert(studentCourses).values({
          studentId: String(id),
          courseId: input.courseId
        });
        
        // Also update JSON for backward compatibility
        const updatedCourses = [...current.map(c => c.courseId), input.courseId];
        await updateStudent(id, { enrolledCourses: JSON.stringify(updatedCourses), coursesUpdatedAt: new Date() });
        
        return { success: true };
      }),

    removeCourse: studentProcedure
      .input(z.object({ courseId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const id = ctx.student.studentDbId;
        if (typeof id !== "number") throw new TRPCError({ code: "BAD_REQUEST" });
        const db_inst = await getDb();
        if (!db_inst) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { studentCourses } = await import("../drizzle/schema");
        
        await db_inst.delete(studentCourses)
          .where(and(
            eq(studentCourses.studentId, String(id)),
            eq(studentCourses.courseId, input.courseId)
          ));
          
        const current = await db_inst.select().from(studentCourses).where(eq(studentCourses.studentId, String(id)));
        await updateStudent(id, { enrolledCourses: JSON.stringify(current.map(c => c.courseId)), coursesUpdatedAt: new Date() });
        
        return { success: true };
      }),

    getEnrolledCourses: studentProcedure.query(async ({ ctx }) => {
      const id = ctx.student.studentDbId;
      if (typeof id !== "number") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تنفيذ هذه العملية بحساب الإدارة" });
      }
      const student = await getStudentByDbId(id);
      return student?.enrolledCourses ? JSON.parse(student.enrolledCourses) : [];
    }),
    completeOnboarding: studentProcedure
      .input(z.object({ enrolledCourses: z.any() }))
      .mutation(async ({ input, ctx }) => {
        const id = ctx.student.studentDbId;
        if (typeof id !== "number") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تنفيذ هذه العملية بحساب الإدارة" });
        }
        const coursesStr = typeof input.enrolledCourses === 'string' 
          ? input.enrolledCourses 
          : JSON.stringify(input.enrolledCourses);

        await updateStudent(id, {
          enrolledCourses: coursesStr,
          onboardingCompleted: true,
          coursesUpdatedAt: new Date(),
        });
        return { success: true };
      }),
    saveEnrolledCourses: studentProcedure
      .input(z.array(z.string()).max(6))
      .mutation(async ({ input, ctx }) => {
        const id = ctx.student.studentDbId;
        if (typeof id !== "number") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تنفيذ هذه العملية بحساب الإدارة" });
        }
        await updateStudent(id, {
          enrolledCourses: JSON.stringify(input),
          coursesUpdatedAt: new Date(),
        });
        return { success: true };
      }),
    resetSemester: studentProcedure.mutation(async ({ ctx }) => {
      const id = ctx.student.studentDbId;
      if (typeof id !== "number") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تنفيذ هذه العملية بحساب الإدارة" });
      }
      await updateStudent(id, {
        enrolledCourses: null,
        onboardingCompleted: false,
        coursesUpdatedAt: new Date(),
      });
      return { success: true };
    }),
  }),

  notifications: router({
    getUnreadNotifications: studentProcedure.query(async ({ ctx }) => {
      const notes = await getUnreadNotifications(ctx.student.studentDbId as number);
      return notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }));
    }),
    markAsRead: studentProcedure.mutation(async ({ ctx }) => {
      await markNotificationsAsRead(ctx.student.studentDbId as number);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
