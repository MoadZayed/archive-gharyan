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

// Helper to sanitize strings
const sanitize = (text: string) => DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

// Student authentication context
interface StudentContext {
  studentID: string;
  studentDbId: number | string;
  role: string;
  isAdmin: boolean;
  isOAuth: boolean;
  verificationStatus: string;
}

const studentProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // 1. Check if user is already authenticated via OAuth (cookie)
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

  // 2. Fallback to manual token (studentID)
  const token = ctx.req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "يرجى تسجيل الدخول للوصول لهذه الميزة"
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً",
    });
  }

  // Special case for Super Admin (Hardcoded string ID in token)
  if (decoded.studentDbId === 'super-admin') {
    return next({
      ctx: {
        ...ctx,
        student: {
          ...decoded,
          isOAuth: false,
          isAdmin: true
        },
      },
    });
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
  // 1. Check OAuth
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

  // 2. Check Token
  const token = ctx.req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return next({ ctx: { ...ctx, student: null } });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next({ ctx: { ...ctx, student: null } });
  }

  if (decoded.studentDbId === 'super-admin') {
    return next({
      ctx: {
        ...ctx,
        student: {
          ...decoded,
          isOAuth: false,
          isAdmin: true
        },
      },
    });
  }

  const studentData = typeof decoded.studentDbId === 'number' ? await getStudentByDbId(decoded.studentDbId) : null;
  const isAdmin = studentData?.role === 'admin' || decoded.role === 'admin';

  return next({
    ctx: {
      ...ctx,
      student: {
        ...decoded,
        role: studentData?.role || decoded.role || 'student',
        verificationStatus: studentData?.verificationStatus || (isAdmin ? 'VERIFIED' : 'PENDING'),
        isOAuth: false,
        isAdmin
      },
    },
  });
});

/**
 * Verified Procedure: Only for students with VERIFIED status.
 */
const verifiedProcedure = studentProcedure.use(async ({ ctx, next }) => {
  if (!ctx.student) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });
  }

  // Admins are always verified
  if (ctx.student.isAdmin) {
    return next();
  }

  if (ctx.student.verificationStatus !== 'VERIFIED') {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "حسابك قيد المراجعة حالياً. سيتم تفعيل هذه الميزة فور اعتماد حسابك من قبل الإدارة."
    });
  }

  return next();
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    saveEnrolledCourses: studentProcedure
      .input(z.array(z.string()).max(6, "لا يمكنك اختيار أكثر من 6 مواد"))
      .mutation(async ({ input, ctx }) => {
        await updateStudent(ctx.student.studentDbId, {
          enrolledCourses: JSON.stringify(input),
          coursesUpdatedAt: new Date(),
        });
        return { success: true, message: "تم تسجيل المواد بنجاح" };
      }),

    register: publicProcedure
      .input(
        z.object({
          studentID: z.string().min(1, "رقم القيد مطلوب"),
          fullName: z.string().min(3, "الاسم الكامل مطلوب"),
          email: z.string().email("البريد الإلكتروني غير صالح"),
          password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
          securityQuestion: z.string().min(1, "يرجى اختيار سؤال أمان"),
          securityAnswer: z.string().min(3, "الإجابة يجب أن لا تقل عن 3 أحرف"),
          role: z.enum(["student", "professor"]).default("student"),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await getStudentByID(input.studentID);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "رقم القيد مسجل مسبقاً",
          });
        }

        const passwordHash = await hashPassword(input.password);
        const normalizedAnswer = input.securityAnswer.trim().toLowerCase();
        const securityAnswerHash = await hashPassword(normalizedAnswer);

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
        if (!student) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        const token = generateToken(input.studentID, student.id);

        return {
          success: true,
          token,
          student: {
            id: student.id,
            studentID: student.studentID,
            fullName: student.fullName,
            role: student.role,
            isAdmin: student.role === 'admin'
          },
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          studentID: z.string().min(1, "رقم القيد مطلوب"),
          password: z.string().min(1, "كلمة المرور مطلوبة"),
        })
      )
      .mutation(async ({ input }) => {
        const student = await getStudentByID(input.studentID);
        
        if (!student) {
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: "رقم القيد غير مسجل، ليس لديك حساب بعد" 
          });
        }

        // 1. Lockout Check
        if (student.lockoutUntil && student.lockoutUntil > new Date()) {
          const waitTime = Math.ceil((student.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `تم قفل الحساب مؤقتاً لدواعي أمنية بسبب محاولات فاشلة متكررة. يرجى المحاولة بعد ${waitTime} دقيقة.`
          });
        }

        const passwordValid = await verifyPassword(input.password, student.passwordHash || "");
        
        if (!passwordValid) {
          const newFailedAttempts = (student.failedAttempts || 0) + 1;
          let lockoutUntil = null;
          
          if (newFailedAttempts >= 5) {
            lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
          }

          await updateStudent(student.id, {
            failedAttempts: newFailedAttempts,
            lockoutUntil
          });

          if (newFailedAttempts >= 5) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "تم قفل الحساب مؤقتاً لمدة 15 دقيقة بسبب تكرار الخطأ في كلمة المرور."
            });
          }

          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: `كلمة المرور غير صحيحة. محاولات متبقية قبل القفل: ${5 - newFailedAttempts}`
          });
        }

        // Check for 60-day inactivity
        if (student.lastInteractionAt) {
          const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
          const diff = Date.now() - student.lastInteractionAt.getTime();
          if (diff > sixtyDaysInMs || student.isAccountLocked) {
             await updateStudent(student.id, { isAccountLocked: true });
             throw new TRPCError({ 
               code: "FORBIDDEN", 
               message: "تم قفل حسابك بسبب عدم النشاط لمدة 60 يوماً. يرجى التواصل مع الدعم الفني لإعادة التنشيط." 
             });
          }
        }

        // Success: Reset lockout and update interaction
        await updateStudent(student.id, {
          failedAttempts: 0,
          lockoutUntil: null,
          lastInteractionAt: new Date()
        });

        const token = generateToken(student.studentID!, student.id, student.role);

        return {
          success: true,
          token,
          student: {
            id: student.id,
            studentID: student.studentID,
            fullName: student.fullName,
            role: student.role,
            isAdmin: student.role === 'admin'
          },
        };
      }),

    adminLogin: publicProcedure
      .input(
        z.object({
          username: z.string().min(1, "اسم المستخدم مطلوب"),
          password: z.string().min(1, "كلمة المرور مطلوبة"),
        })
      )
      .mutation(async ({ input }) => {
        console.log(`[AUTH] Admin login attempt for user: ${input.username}`);
        
        try {
          // Use env variables with safe fallbacks
          const ADMIN_USERNAME = process.env.ADMIN_USERNAME || ENV.adminUsername || "admin";
          const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ENV.adminPassword || "admin123";

          if (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) {
            console.log("[AUTH] Admin credentials matched. Generating session...");
            
            // Generate a secure token with 'super-admin' identifier - set to 7 days for admin stability
            const token = generateToken(ADMIN_USERNAME, 'super-admin', 'admin', '7d');
            
            const response = {
              success: true,
              token,
              student: {
                id: -1,
                studentID: ADMIN_USERNAME,
                fullName: "المدير العام",
                role: 'admin',
                isAdmin: true
              }
            };

            console.log("[AUTH] Admin login successful. Sending JSON response.");
            return response;
          }

          console.warn(`[AUTH] Admin login failed for user: ${input.username} - Invalid credentials`);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور."
          });

        } catch (error) {
          if (error instanceof TRPCError) {
            console.log(`[AUTH] Controlled TRPC Error: ${error.message}`);
            throw error;
          }
          
          console.error("[CRITICAL] Admin login unexpected crash:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "حدث خطأ فني أثناء محاولة تسجيل الدخول. يرجى التأكد من إعدادات السيرفر."
          });
        }
      }),

    getSecurityQuestion: publicProcedure
      .input(z.object({ studentID: z.string(), email: z.string() }))
      .query(async ({ input }) => {
        const student = await getStudentByID(input.studentID);
        if (!student || !student.securityQuestion) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "لم يتم العثور على حساب مرتبطة برقم القيد هذا",
          });
        }
        
        if (student.email && student.email.toLowerCase() !== input.email.toLowerCase()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "البريد الإلكتروني غير متطابق مع رقم القيد",
          });
        }

        return { securityQuestion: student.securityQuestion };
      }),

    resetPassword: publicProcedure
      .input(
        z.object({
          studentID: z.string(),
          securityAnswer: z.string().min(3),
          newPassword: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        const student = await getStudentByID(input.studentID);
        if (!student || !student.securityAnswerHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات الاستعادة غير صحيحة" });
        }

        const normalizedAnswer = input.securityAnswer.trim().toLowerCase();
        const isAnswerCorrect = await verifyPassword(normalizedAnswer, student.securityAnswerHash);

        if (!isAnswerCorrect) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "إجابة سؤال الأمان غير صحيحة" });
        }

        // Flexible logic: accept same password without error
        const newPasswordHash = await hashPassword(input.newPassword);
        
        await updateStudent(student.id, {
          passwordHash: newPasswordHash,
          failedAttempts: 0,
          lockoutUntil: null,
        });

        return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
      }),

    checkSemesterStatus: studentProcedure
      .mutation(async ({ ctx }) => {
        await updateStudent(ctx.student.studentDbId, {
          coursesUpdatedAt: new Date(),
        });
        return { success: true };
      }),

    resetMyCourses: studentProcedure
      .mutation(async ({ ctx }) => {
        await updateStudent(ctx.student.studentDbId, {
          enrolledCourses: null,
          coursesUpdatedAt: new Date(),
        });
        return { success: true };
      }),

    me: optionalStudentProcedure.query(async ({ ctx }) => {
      if (!ctx.student) return null;
      const student = typeof ctx.student.studentDbId === 'number' 
        ? await getStudentByDbId(ctx.student.studentDbId) 
        : null;
      return {
        ...ctx.student,
        fullName: student?.fullName || ctx.student.studentID,
        enrolledCourses: student?.enrolledCourses ? JSON.parse(student.enrolledCourses) : [],
        coursesUpdatedAt: student?.coursesUpdatedAt ? student.coursesUpdatedAt.getTime() : null,
        verificationStatus: student?.verificationStatus || 'PENDING',
      };
    }),

    logout: publicProcedure.mutation(async () => {
      return { success: true };
    }),
  }),

  admin: router({
    getSystemStats: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
      
      const cacheKey = "admin_system_stats";
      const cachedData = serverCache.get(cacheKey);
      if (cachedData) return cachedData;

      const stats = await getAdvancedSystemStats();
      serverCache.set(cacheKey, stats, 900); // 15 Minutes cache
      return stats;
    }),
    getDashboardStats: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
      return await getAdminStats();
    }),
    getAllFiles: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
      const files = await getAllFilesWithUploader();
      return files.map(f => ({
        ...f,
        createdAt: f.createdAt.toISOString()
      }));
    }),
    getAllStudents: studentProcedure.query(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
      return await getAllStudents();
    }),
    resetAllStudentsCourses: studentProcedure.mutation(async ({ ctx }) => {
      if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
      await resetAllStudentsCourses();
      return { success: true };
    }),
    resetSingleStudentCourses: studentProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
        await resetStudentCourses(input.id);
        return { success: true };
      }),
    deleteFileAdmin: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteAcademicFile(input.fileId);
        return { success: true, message: "تم حذف الملف من قبل الإدارة" };
      }),
    bulkUploadFiles: studentProcedure
      .input(z.object({
        files: z.array(z.object({
          fileName: z.string(),
          fileData: z.string(), // base64
          mimeType: z.string()
        })),
        metadata: z.object({
          fileType: z.string(),
          subject: z.string(),
          year: z.number().int(),
          semester: z.string(),
          doctorName: z.string()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        
        for (const file of input.files) {
          const buffer = Buffer.from(file.fileData, "base64");
          const fileKey = `files/admin/${Date.now()}-${file.fileName}`;
          const { url } = await storagePut(fileKey, buffer, file.mimeType);

          await createAcademicFile({
            ...input.metadata,
            fileName: file.fileName,
            uploadedByStudentID: ctx.student.studentDbId,
            fileKey,
            fileUrl: url,
            fileSize: buffer.length,
            mimeType: file.mimeType,
            isApproved: true // Auto-approve admin seeds
          } as any);
        }

        return { success: true, count: input.files.length };
      }),
    getTrashFiles: studentProcedure
      .query(async ({ ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        const files = await getDeletedAcademicFiles();
        return files.map((file: any) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
          deletedAt: file.deletedAt?.toISOString(),
        }));
      }),
    deleteStudent: studentProcedure
      .input(z.object({ studentDbId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "غير مسموح بالوصول" });
        await deleteStudentFromDb(input.studentDbId);
        return { success: true, message: "تم حذف الطالب وكافة بياناته بنجاح" };
      }),
    restoreFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await resetAcademicFileReports(input.fileId);
        return { success: true, message: "تم تبرئة الملف وتصفير الإبلاغات بنجاح" };
      }),
    restoreDeletedFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await restoreAcademicFile(input.fileId);
        return { success: true, message: "تم استعادة الملف من سلة المهملات بنجاح" };
      }),
    hardDeleteFile: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await hardDeleteAcademicFile(input.fileId);
        return { success: true, message: "تم إعدام الملف نهائياً من السيرفر" };
      }),
    verifyStudent: studentProcedure
      .input(z.object({ 
        studentDbId: z.number(), 
        status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']) 
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        
        await ctx.db!
          .update(students)
          .set({ verificationStatus: input.status })
          .where(eq(students.id, input.studentDbId));
          
        return { success: true, message: `تم تحديث حالة الطالب إلى ${input.status}` };
      }),
  }),

  files: router({
    list: studentProcedure
      .input(z.object({ 
        search: z.string().optional(),
        fileType: z.string().optional(),
        year: z.number().int().optional(),
        subject: z.string().optional(),
        doctorName: z.string().optional(),
        limit: z.number().int().default(20),
        offset: z.number().int().default(0)
      }))
      .query(async ({ input, ctx }) => {
        const files = await getAllAcademicFiles(
          ctx.student.isAdmin, 
          ctx.student.studentDbId, 
          input.limit, 
          input.offset,
          {
            search: input.search,
            fileType: input.fileType,
            year: input.year,
            subject: input.subject,
            doctorName: input.doctorName
          }
        );
        
        return files.map((file: any) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
        }));
      }),

    incrementViews: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input }) => {
        await incrementFileViews(input.fileId);
        return { success: true };
      }),

    getFavorites: studentProcedure.query(async ({ ctx }) => {
      const files = await getStudentFavoritesFromDb(ctx.student.studentDbId);
      return files.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
      }));
    }),

    toggleFavorite: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await toggleFavoriteInDb(ctx.student.studentDbId, input.fileId);
        
        // If it was a successful "favorite" (not unfavorite), send notification to owner
        if (result.isFavorite) {
          const file = await getAcademicFileById(input.fileId);
          if (file && file.uploadedByStudentID !== ctx.student.studentDbId) {
            await addNotification({
              userId: file.uploadedByStudentID,
              type: 'LIKE',
              message: `قام أحد الزملاء بالإعجاب بملفك [${file.fileName}]`,
            } as any);
          }
        }
        
        return result;
      }),

    getExistingLectures: studentProcedure
      .input(z.object({ 
        subject: z.string(), 
        doctorName: z.string(),
        academicYear: z.string().optional()
      }))
      .query(async ({ input, ctx }) => {
        const results = await ctx.db!
          .select({ lectureNumber: academicFiles.lectureNumber })
          .from(academicFiles)
          .where(and(
            eq(academicFiles.subject, input.subject),
            eq(academicFiles.doctorName, input.doctorName),
            input.academicYear ? eq(academicFiles.academicYear, input.academicYear) : sql`1=1`,
            isNull(academicFiles.deletedAt)
          ));
        return results.map(r => r.lectureNumber).filter(n => n !== null) as number[];
      }),

    myFiles: studentProcedure.query(async ({ ctx }) => {
      const files = await getStudentFiles(ctx.student.studentDbId);
      return files.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
      }));
    }),

    vote: verifiedProcedure
      .input(z.object({ fileId: z.number(), voteType: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await voteFile(input.fileId, ctx.student.studentDbId, input.voteType);
        
        // Gamification: Give +2 points to the file owner if upvoted
        if (input.voteType > 0) {
          const file = await getAcademicFileById(input.fileId);
          if (file && file.uploadedByStudentID !== ctx.student.studentDbId) {
            await incrementReputation(file.uploadedByStudentID, 2);
            // Invalidate leaderboard cache as reputation changed
            serverCache.invalidate("top_contributors");
          }
        }
        
        return { success: true };
      }),

    upload: verifiedProcedure
      .input(
        z.object({
          fileName: z.string().min(1),
          fileType: z.string(),
          subject: z.string().min(1),
          courseCode: z.string().optional(),
          year: z.number().int(),
          semester: z.string(),
          doctorName: z.string().min(1),
          description: z.string().optional(),
          academicYear: z.string().min(1),
          lectureNumber: z.number().optional().nullable(),
          fileData: z.string().optional(), // Now optional
          fileKey: z.string().optional(), // New
          fileUrl: z.string().optional(), // New
          fileHash: z.string().optional(), // New
          mimeType: z.string(),
          fileSize: z.number().optional(), // New
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const student = ctx.student;
        const studentDbId = Number(student.studentDbId);

        // 0. Rate Limiting Check (Max 20 files per hour)
        const lastHour = new Date(Date.now() - 60 * 60 * 1000);
        const recentUploads = await ctx.db
          .select({ value: count() })
          .from(academicFiles)
          .where(and(
            eq(academicFiles.uploadedByStudentID, studentDbId),
            sql`${academicFiles.createdAt} > ${lastHour}`
          ));
        
        if (recentUploads[0].value >= 20) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "تجاوزت الحد المسموح للرفع حالياً، يرجى المحاولة بعد ساعة للحفاظ على استقرار الخادم."
          });
        }

        let fileKey = input.fileKey;
        let fileUrl = input.fileUrl;
        let fileHash = input.fileHash;
        let fileSize = input.fileSize || 0;

        // If file data is provided (Legacy/Small files), process it
        if (input.fileData && !fileKey) {
          const buffer = Buffer.from(input.fileData, "base64");
          fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
          fileSize = buffer.length;

          // 50MB Strict Check
          if (fileSize > 50 * 1024 * 1024) {
            throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "حجم الملف يتجاوز الحد المسموح به (50MB)" });
          }

          fileKey = `files/${student.studentDbId}/${Date.now()}-${input.fileName}`;
          const result = await storagePut(fileKey, buffer, input.mimeType);
          fileUrl = result.url;
        }

        if (!fileKey || !fileUrl || !fileHash) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "بيانات الملف غير مكتملة" });
        }
        
        // 1. Duplicate Check
        const existingFile = await getFileByHash(fileHash);
        if (existingFile) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "DUPLICATE_FILE" 
          });
        }

        await createAcademicFile({
          fileName: sanitize(input.fileName),
          fileType: input.fileType,
          subject: input.subject,
          courseCode: input.courseCode ? sanitize(input.courseCode) : null,
          year: input.year,
          semester: input.semester,
          doctorName: input.doctorName,
          description: input.description ? sanitize(input.description) : null,
          lectureNumber: input.lectureNumber,
          academicYear: input.academicYear,
          uploadedByStudentID: student.studentDbId,
          fileKey,
          fileUrl,
          fileHash,
          fileSize,
          mimeType: input.mimeType,
        } as any);

        // Update interaction
        await updateStudent(student.studentDbId as number, { lastInteractionAt: new Date() });

        // Gamification: +10 points for uploading
        await incrementReputation(student.studentDbId as number, 10);

        // Invalidate Stats Caches
        serverCache.invalidate("admin_system_stats");
        serverCache.invalidate("top_contributors");

        return { success: true, message: "تم رفع الملف بنجاح! وهو قيد المراجعة" };
      }),

    report: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await reportAcademicFile(input.fileId);
        // Update interaction
        await updateStudent(ctx.student.studentDbId, { lastInteractionAt: new Date() });
        return { success: true, message: "تم استلام البلاغ، شكراً لمساهمتك في حماية المجتمع" };
      }),

    delete: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const file = await getAcademicFileById(input.fileId);
        if (!file) throw new TRPCError({ code: "NOT_FOUND" });
        
        // Ownership Check: Only owner or admin can delete
        if (file.uploadedByStudentID !== ctx.student.studentDbId && !ctx.student.isAdmin) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "غير مصرح لك بحذف ملفات الآخرين" 
          });
        }
        
        await deleteAcademicFile(input.fileId);
        return { success: true };
      }),

    approve: studentProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.student.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
        await approveAcademicFile(input.fileId);
        
        // Gamification: +50 points to the file owner
        const file = await getAcademicFileById(input.fileId);
        if (file) {
          await incrementReputation(file.uploadedByStudentID, 50);
          // Invalidate Caches
          serverCache.invalidate("admin_system_stats");
          serverCache.invalidate("top_contributors");
        }
        
        return { success: true };
      }),

    download: verifiedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const file = await getAcademicFileById(input.fileId);
        if (!file) throw new TRPCError({ code: "NOT_FOUND" });
        
        // If it's a student session, update interaction
        if (ctx.student?.studentDbId) {
          await updateStudent(ctx.student.studentDbId, { lastInteractionAt: new Date() });
        }

        const { url } = await storageGet(file.fileKey);
        return { fileName: file.fileName, url, mimeType: file.mimeType };
      }),

    analyzeDocument: studentProcedure
      .input(z.object({ fileData: z.string(), mimeType: z.string() }))
      .mutation(async ({ input }) => {
        // Strict Policy: Only images for AI processing to save resources
        if (!input.mimeType.startsWith("image/")) {
          return {
            subject_name: null,
            doctor_name: null,
            year: null,
            semester: null,
            file_type: null,
            summary: "تم تخطي التحليل الآلي لهذا الملف (سياسة الأمان تقتصر على الصور فقط)"
          };
        }

        const prompt = `Analyze this academic image and extract a brief 1-sentence summary of what it shows:
        {
          "summary": "string"
        }
        Return ONLY the JSON object. Note: Manual data entry is enforced, so DO NOT try to extract subject or doctor names.`;

        try {
          const result = await invokeLLM({
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "file_url",
                    file_url: {
                      url: `data:${input.mimeType};base64,${input.fileData}`,
                      mime_type: input.mimeType as any
                    }
                  }
                ]
              }
            ],
            responseFormat: { type: "json_object" }
          });

          const content = typeof result.choices[0].message.content === 'string' 
            ? result.choices[0].message.content 
            : JSON.stringify(result.choices[0].message.content);
            
          try {
            return JSON.parse(content);
          } catch (pErr) {
            console.error("AI JSON Parse Error:", pErr, "Content:", content);
            return { summary: content.substring(0, 500) || "تعذر تحليل التنسيق، يرجى إدخال البيانات يدوياً" };
          }
        } catch (error) {
          console.error("AI Analysis Error:", error);
          return { summary: "تعذر تحليل الصورة، يرجى إدخال البيانات يدوياً" };
        }
      }),
  }),

  comments: router({
    add: studentProcedure
      .input(z.object({ fileID: z.number(), text: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        await addCommentToDb({
          fileID: input.fileID,
          text: sanitize(input.text),
          studentID: ctx.student.studentDbId,
        });
        return { success: true };
      }),
    list: publicProcedure
      .input(z.object({ fileID: z.number() }))
      .query(async ({ input }) => {
        const comments = await getCommentsByFileId(input.fileID);
        return comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }));
      }),
    myComments: studentProcedure.query(async ({ ctx }) => {
      const comments = await getStudentComments(ctx.student.studentDbId as number);
      return comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }));
    }),
  }),

  leaderboard: router({
    getTopContributors: publicProcedure.query(async ({ ctx }) => {
      const cacheKey = "top_contributors";
      const cachedData = serverCache.get(cacheKey);
      if (cachedData) return cachedData;

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Get top 10 contributors based on reputationPoints
      const topStudents = await db
        .select({
          id: students.id,
          fullName: students.fullName,
          studentID: students.studentID,
          reputationPoints: students.reputationPoints,
        })
        .from(students)
        .where(isNull(students.deletedAt))
        .orderBy(desc(students.reputationPoints))
        .limit(10);

      serverCache.set(cacheKey, topStudents, 300); // 5 Minutes cache
      return topStudents;
    }),
  }),

  stats: router({
    getPlatformStats: publicProcedure.query(async () => {
      return await getPublicPlatformStats();
    }),
  }),
  semester: router({
    getConsensus: studentProcedure.query(async ({ ctx }) => {
      const activeSemester = await ctx.db!.query.semesters.findFirst({
        where: eq(semesters.isActive, true),
      });

      if (!activeSemester) return { reached: false, count: 0, daysPassed: 0 };

      const votes = await ctx.db!.query.semesterVotes.findMany({
        where: eq(semesterVotes.isNewSemester, true),
      });

      const daysPassed = Math.floor((Date.now() - activeSemester.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        reached: activeSemester.consensusReached || votes.length >= 150,
        count: votes.length,
        daysPassed,
        threshold: 150,
        showVote: daysPassed >= 90 && !activeSemester.consensusReached
      };
    }),
    vote: studentProcedure.mutation(async ({ ctx }) => {
      const activeSemester = await ctx.db!.query.semesters.findFirst({
        where: eq(semesters.isActive, true),
      });

      if (!activeSemester) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد فصل دراسي نشط حالياً" });

      // Check for existing vote (pseudo-logic, should check if user already voted in this semester)
      const existingVote = await ctx.db!.query.semesterVotes.findFirst({
        where: eq(semesterVotes.studentID, ctx.student.studentDbId as number)
      });

      if (existingVote) throw new TRPCError({ code: "CONFLICT", message: "لقد قمت بالتصويت بالفعل لهذا الفصل" });

      await ctx.db!.insert(semesterVotes).values({
        studentID: ctx.student.studentDbId as number,
        isNewSemester: true,
      });

      // Recalculate consensus
      const votes = await ctx.db!.query.semesterVotes.findMany();
      if (votes.length >= 150) {
        await ctx.db!.update(semesters)
          .set({ consensusReached: true })
          .where(eq(semesters.id, activeSemester.id));
      }

      return { success: true };
    }),
  }),

  notifications: router({
    getUnreadNotifications: studentProcedure.query(async ({ ctx }) => {
      const notes = await getUnreadNotifications(ctx.student.studentDbId);
      return notes.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString()
      }));
    }),

    markAsRead: studentProcedure.mutation(async ({ ctx }) => {
      await markNotificationsAsRead(ctx.student.studentDbId);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;