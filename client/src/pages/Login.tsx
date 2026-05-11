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
import { useGender } from "@/contexts/GenderContext";
import Footer from "@/components/Footer";

export default function Login() {
  const [, navigate] = useLocation();
  const { login: setAuthSession } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { genderTheme, toggleGender } = useGender();

  const [studentID, setStudentID] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setAuthSession(data.token);
      toast.success(t("welcome"));
      navigate(data.student.isAdmin ? "/admin" : "/onboarding", { replace: true });
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        toast.error("بيانات غير صحيحة");
      } else if (err.data?.code === "NOT_FOUND") {
        toast.error("رقم القيد غير مسجل");
      } else {
        toast.error(err.message || "حدث خطأ أثناء تسجيل الدخول");
      }
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ studentID, password });
  };

  const isFemale = genderTheme === 'female';

  return (
    <div className={`min-h-screen transition-all duration-1000 flex flex-col items-center justify-center p-4 relative overflow-hidden ${
        isFemale ? (theme === 'dark' ? 'bg-[#1a050d]' : 'bg-[#fff0f6]') : (theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50')
      }`}
    >
      {/* 1. Global Navigation - Strictly following CTO classes */}
      <div className="flex items-center gap-4 absolute top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate("/")} 
          className={`bg-card/50 backdrop-blur-md border-border rounded-xl w-10 h-10 transition-all hover:scale-110 ${
            isFemale ? 'text-pink-500 border-pink-200' : 'text-blue-500 border-blue-200/20 dark:border-blue-500/20'
          }`}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')} 
          className={`bg-card/50 backdrop-blur-md border-border rounded-xl px-3 h-10 font-bold ${
            !isFemale && 'text-blue-600 dark:text-blue-400 border-blue-500/20'
          }`}
        >
          {i18n.language.toUpperCase()}
        </Button>
        <Button
          onClick={toggleGender}
          variant="outline"
          size="icon"
          className={`bg-card/50 backdrop-blur-md border-border rounded-xl h-10 w-10 ${isFemale ? 'text-pink-500' : 'text-blue-500 border-blue-500/20'}`}
        >
          {isFemale ? <Flower size={18} /> : <Box size={18} />}
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleTheme} 
          className={`bg-card/50 backdrop-blur-md border-border rounded-xl h-10 w-10 ${!isFemale && 'border-blue-500/20'}`}
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
        </Button>
      </div>

      {/* Background Decor */}
      <div className={`fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-pink-400' : 'bg-blue-600'
      }`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-rose-400' : 'bg-purple-600'
      }`} />

      <Card className={`w-full max-w-md relative z-10 backdrop-blur-3xl transition-all duration-1000 shadow-2xl rounded-[3rem] p-10 overflow-hidden ${
        isFemale 
          ? 'bg-white/40 dark:bg-slate-900/40 border-pink-200 dark:border-pink-800 shadow-pink-500/10' 
          : 'bg-white/70 dark:bg-slate-900/40 border-blue-200 dark:border-blue-800 shadow-blue-500/10'
      }`}>
        <div className="text-center mb-8">
          {/* Balanced Logo & Title */}
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-2xl border transition-all transform rotate-3 ${
              isFemale ? 'bg-gradient-to-tr from-pink-500 to-pink-600 border-pink-400 text-white' : 'bg-gradient-to-tr from-blue-600 to-blue-700 border-blue-400 text-white'
          }`}>
            {isFemale ? <Sparkles size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h1 className={`text-2xl font-bold mb-1 glow-text ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-900 dark:text-blue-400'}`}>{t("login")}</h1>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isFemale ? 'text-pink-400 dark:text-pink-300' : 'text-blue-500 dark:text-blue-300'}`}>
            بوابة جيتـا التعليمية 🛡️
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className={`text-[10px] font-black px-4 uppercase tracking-widest glow-text ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>{t("student_id")}</label>
            <Input 
              value={studentID} 
              onChange={(e) => setStudentID(e.target.value)} 
              placeholder="00000" 
              className={`h-14 rounded-2xl font-bold transition-all ${
                isFemale 
                  ? 'bg-white border-pink-200 dark:bg-slate-800 dark:border-pink-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-300 dark:placeholder:text-pink-600 focus:ring-pink-400' 
                  : 'bg-white border-blue-200 dark:bg-slate-800 dark:border-blue-800 text-blue-900 dark:text-blue-100 placeholder:text-blue-300 dark:placeholder:text-blue-600 focus:ring-blue-500'
              }`} 
              required 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <label className={`text-[10px] font-black uppercase tracking-widest glow-text ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>{t("password")}</label>
            </div>
            <div className="relative">
              <Lock className={`absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-400 dark:text-pink-600' : 'text-blue-400 dark:text-blue-600'}`} />
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className={`h-14 pr-14 rounded-2xl font-bold transition-all ${
                  isFemale 
                    ? 'bg-white border-pink-200 dark:bg-slate-800 dark:border-pink-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-300 dark:placeholder:text-pink-600 focus:ring-pink-400' 
                    : 'bg-white border-blue-200 dark:bg-slate-800 dark:border-blue-800 text-blue-900 dark:text-blue-100 placeholder:text-blue-300 dark:placeholder:text-blue-600 focus:ring-blue-500'
                }`} 
                required 
              />
            </div>
            {/* 3. Spacing for Forgot Password */}
            <div className="my-4 text-center">
              <button type="button" onClick={() => navigate("/forgot-password")} className={`text-xs font-bold hover:underline transition-colors glow-text ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>نسيت كلمة المرور؟</button>
            </div>
          </div>

          <Button type="submit" disabled={loginMutation.isPending} className={`w-full h-14 font-black text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 glow-text border-0 ${
            isFemale ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
            {loginMutation.isPending ? <Loader2 className="animate-spin" /> : (isFemale ? 'دخول متألق ✨' : 'تسجيل الدخول 🛡️')}
          </Button>
        </form>

        <div className="text-center pt-8 border-t border-border/30 mt-6">
          <p className={`text-sm mb-4 font-bold ${isFemale ? 'text-pink-900 dark:text-pink-200' : 'text-blue-900 dark:text-blue-200'}`}>
            {t("dont_have_account")}
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate("/register")} 
            className={`font-black hover:underline p-0 h-auto ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}
          >
            {t("register")}
          </Button>
          <div className="mt-2">
            <Button 
              variant="link" 
              onClick={() => navigate("/admin-login")} 
              className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all ${isFemale ? 'text-pink-900 dark:text-pink-200' : 'text-blue-900 dark:text-blue-200'}`}
            >
              بوابة الإدارة 🛡️
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="mt-12 w-full">
        <Footer />
      </div>
    </div>
  );
}