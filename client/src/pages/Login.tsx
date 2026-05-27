import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Loader2, Sun, Moon, ArrowRight, Lock, Flower, Box, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";

export default function Login() {
  const [, navigate] = useLocation();
  const { login: setAuthSession } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [studentID, setStudentID] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setAuthSession(data.token);
      toast.success(t("welcome"));
      if (data.student.role === "moderator") {
        navigate("/moderator/panel", { replace: true });
      } else if (data.student.isAdmin || data.student.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/files", { replace: true });
      }
    },
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        toast.error("بيانات الدخول غير صحيحة");
      } else if (err.data?.code === "NOT_FOUND") {
        toast.error("رقم القيد غير مسجل");
      } else if (err.data?.code === "FORBIDDEN") {
        toast.error(err.message || "لا يمكنك الدخول في الوقت الحالي", { duration: 6000 });
      } else {
        toast.error(err.message || "حدث خطأ أثناء تسجيل الدخول");
      }
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ studentID, password });
  };



  return (
    <div className="min-h-screen transition-all duration-1000 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" 
         style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
         dir="rtl"
    >
      {/* 1. Global Navigation */}
      <div className="flex items-center gap-4 absolute top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/")} 
          className="bg-[var(--glass-white)] backdrop-blur-md rounded-xl w-10 h-10 transition-all hover:scale-110 shadow-[0_4px_15px_rgba(233,30,99,0.2)] border-[var(--border-pink)] text-[var(--accent-primary)]"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Background Decor */}
      <div 
        className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />
      <div 
        className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,91,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />

      <Card className="w-full max-w-md relative z-10 backdrop-blur-3xl transition-all duration-1000 shadow-2xl rounded-[3rem] p-6 md:p-10 overflow-hidden border"
            style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)', boxShadow: '0 0 40px rgba(233,30,99,0.1)' }}>
        <div className="text-center mb-8">
          {/* Balanced Logo & Title */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(233,30,99,0.3)] border transition-all transform hover:rotate-3"
               style={{ background: 'var(--button-gradient)', borderColor: 'var(--accent-secondary)', color: 'white' }}>
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t("login")}</h1>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            بوابة الأرشيف الأكاديمي 🛡️
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>{t("student_id")}</label>
            <Input 
              value={studentID} 
              onChange={(e) => setStudentID(e.target.value)} 
              placeholder="00000" 
              className="h-[52px] rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right pr-4"
              style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              required 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <label className="text-[12px] font-black uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>{t("password")}</label>
            </div>
            <div className="relative">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="h-[52px] pr-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required 
              />
            </div>
            <div className="my-4 text-center">
              <button type="button" onClick={() => navigate("/forgot-password")} className="text-[13px] font-bold hover:underline transition-colors" style={{ color: 'var(--accent-primary)' }}>نسيت كلمة المرور؟</button>
            </div>
          </div>

          <Button type="submit" disabled={loginMutation.isPending} className="w-full h-[56px] font-black text-[16px] rounded-[14px] shadow-[0_10px_30px_rgba(233,30,99,0.3)] transition-all hover:scale-[1.02] active:scale-95 border-none" style={{ background: 'var(--button-gradient)', color: 'white' }}>
            {loginMutation.isPending ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
          </Button>
        </form>

        <div className="text-center pt-6 border-t mt-6" style={{ borderColor: 'var(--glass-white)' }}>
          <p className="text-[14px] mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>
            {t("dont_have_account")}
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate("/register")} 
            className="font-bold hover:underline p-0 h-auto text-[15px]"
            style={{ color: 'var(--accent-primary)' }}
          >
            {t("register")}
          </Button>
          <div className="mt-4">
            <Button 
              variant="link" 
              onClick={() => navigate("/admin-login")} 
              className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all"
              style={{ color: 'var(--text-muted)' }}
            >
              بوابة الإدارة 🛡️
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="mt-12 w-full max-w-7xl">
        <Footer />
      </div>
    </div>
  );
}