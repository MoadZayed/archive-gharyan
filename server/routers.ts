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
import { storagePut, storageGetSignedUrl } from "./storage";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import type { InvokeResult } from "./_core/llm";
import { eq } from "drizzle-orm";
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

  if (decoded.studentDbId === "super-admin") {
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

  if (decoded.studentDbId === "super-admin") {
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
    .input(z.object({ enrolledCourses: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await updateStudent(ctx.student.studentDbId as number, {
        enrolledCourses: input.enrolledCourses,
        onboardingCompleted: true,
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
        token: generateToken(input.studentID, student.id),
        student: {
          id: student.id,
          studentID: student.studentID,
          fullName: student.fullName,
          role: student.role,
          isAdmin: student.role === "admin",
        },
      };
    }),

  login: publicProcedure
    .input(z.object({ studentID: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const student = await getStudentByID(input.studentID);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "رقم القيد غير مسجل" });
      if (student.lockoutUntil && student.lockoutUntil > new Date())
        throw new TRPCError({ code: "FORBIDDEN", message: "الحساب مقفل مؤقتاً" });
      const valid = await verifyPassword(input.password, student.passwordHash || "");
      if (!valid) {
        const attempts = (student.failedAttempts || 0) + 1;
        await updateStudent(student.id, {
          failedAttempts: attempts,
          lockoutUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور خاطئة" });
      }
      await updateStudent(student.id, {
        failedAttempts: 0,
        lockoutUntil: null,
        lastInteractionAt: new Date(),
      });
      return {
        success: true,
        token: generateToken(student.studentID!, student.id, student.role),
        student: {
          id: student.id,
          studentID: student.studentID,
          fullName: student.fullName,
          role: student.role,
          isAdmin: student.role === "admin",
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
          token: generateToken(ADMIN_USERNAME, "super-admin", "admin", "7d"),
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
              fileData: z.string(),
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
        if (typeof adminId !== "number") throw new TRPCError({ code: "BAD_REQUEST" });

        const academicYear = `${input.metadata.year}-${input.metadata.year + 1}`;
        let count = 0;
        for (const f of input.files) {
          const buf = Buffer.from(f.fileData, "base64");
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
            uploadedByStudentID: adminId,
            courseCode: input.metadata.subject.split(" - ")[0] || undefined,
            description: undefined,
            lectureNumber: null,
            isApproved: true,
          } as Parameters<typeof createAcademicFile>[0]);
          count++;
        }
        return { count };
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

    upload: studentProcedure
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
          fileUrl: z.string(),
          fileHash: z.string(),
          fileSize: z.number(),
          description: z.string().optional(),
          lectureNumber: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const dup = await getFileByHash(input.fileHash);
        if (dup) {
          throw new TRPCError({ code: "CONFLICT", message: "DUPLICATE_FILE" });
        }
        const descParts = [input.description, input.semester ? `الفصل: ${input.semester}` : ""].filter(
          Boolean
        );
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
          fileUrl: input.fileUrl,
          fileHash: input.fileHash,
          fileSize: input.fileSize,
          description: descParts.length ? descParts.join("\n") : undefined,
          lectureNumber: input.lectureNumber ?? null,
          uploadedByStudentID: ctx.student.studentDbId as number,
          isApproved: false,
        } as Parameters<typeof createAcademicFile>[0]);
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
      .mutation(async ({ input }) => {
        const file = await getAcademicFileById(input.fileId);
        if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "الملف غير موجود" });
        await incrementFileDownloads(input.fileId);

        let url = file.fileUrl;
        // تحويل الروابط المحلية إلى روابط مطلقة نظراً للنشر السحابي
        if (url.startsWith("/uploads")) {
          const backendUrl =
            process.env.VITE_API_URL ||
            process.env.RAILWAY_STATIC_URL ||
            `http://localhost:${process.env.PORT || 4001}`;
          url = `${backendUrl.replace(/\/+$/, "")}${url}`;
        }

        return { success: true, url, fileName: file.fileName };
      }),


    myFiles: studentProcedure.query(async ({ ctx }) => {
      const rows = await getStudentFiles(ctx.student.studentDbId as number);
      return rows.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
      }));
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
    completeOnboarding: studentProcedure
      .input(z.object({ enrolledCourses: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await updateStudent(ctx.student.studentDbId as number, {
          enrolledCourses: input.enrolledCourses,
          onboardingCompleted: true,
        });
        return { success: true };
      }),
    saveEnrolledCourses: studentProcedure
      .input(z.array(z.string()).max(6))
      .mutation(async ({ input, ctx }) => {
        await updateStudent(ctx.student.studentDbId as number, {
          enrolledCourses: JSON.stringify(input),
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
