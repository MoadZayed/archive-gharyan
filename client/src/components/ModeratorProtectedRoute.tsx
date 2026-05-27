import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

interface ModeratorProtectedRouteProps {
  children: ReactNode;
}

export default function ModeratorProtectedRoute({ children }: ModeratorProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (user.isAdmin) {
        navigate("/admin", { replace: true });
      } else if (user.role !== "moderator") {
        navigate("/files", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050506]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "moderator" || user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050506] text-white">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <ShieldAlert className="h-16 w-16 text-destructive animate-bounce" />
          <h1 className="text-2xl font-black">وصول محظور</h1>
          <p className="text-muted-foreground font-bold">هذه الصفحة مخصصة للمشرفين فقط.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
