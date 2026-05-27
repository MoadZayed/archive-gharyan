import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, ReactNode } from "react";
import { Loader2, Clock, ShieldX } from "lucide-react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      // Role-based redirects
      if (user.isAdmin && location !== "/admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (user.role === "moderator" && location !== "/moderator/panel") {
        navigate("/moderator/panel", { replace: true });
        return;
      }
      // Onboarding redirect
      if (user.onboardingCompleted && location === "/onboarding") {
        navigate("/files", { replace: true });
        return;
      }
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Block admin from student pages
  if (user.isAdmin) return null;

  // Block moderators from student pages
  if (user.role === "moderator") return null;

  // Show pending-approval message instead of page content
  const registrationStatus = (user as any).registrationStatus;
  if (registrationStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(251,191,36,0.1)" }}>
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black">طلبك قيد المراجعة</h1>
          <p className="font-bold" style={{ color: "var(--text-muted)" }}>
            تم استلام طلب تسجيلك بنجاح. يرجى الانتظار حتى يتم مراجعة طلبك من قبل الإدارة.
            سيتم إخطارك عند قبول طلبك.
          </p>
          <button
            onClick={() => { localStorage.removeItem("auth_token"); window.location.href = "/login"; }}
            className="px-6 py-3 rounded-2xl font-bold text-sm border"
            style={{ borderColor: "var(--border-pink)", color: "var(--text-muted)" }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (registrationStatus === "rejected") {
    const rejectionReason = (user as any).rejectionReason;
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} dir="rtl">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-red-500/10">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black">تم رفض طلبك</h1>
          {rejectionReason && (
            <p className="font-bold p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
              السبب: {rejectionReason}
            </p>
          )}
          <p className="font-bold" style={{ color: "var(--text-muted)" }}>
            للاستفسار أو الاعتراض يرجى التواصل مع إدارة المنصة.
          </p>
          <button
            onClick={() => { localStorage.removeItem("auth_token"); window.location.href = "/login"; }}
            className="px-6 py-3 rounded-2xl font-bold text-sm border"
            style={{ borderColor: "var(--border-pink)", color: "var(--text-muted)" }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // Prevent rendering children if redirecting from onboarding
  if (user.onboardingCompleted && location === "/onboarding") {
    return null;
  }

  return <>{children}</>;
}
