import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Lock, User, UserCircle, ArrowRight, Shield, Sparkles, Flower, Box, Cpu, Mail, Sun, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useGender } from "@/contexts/GenderContext";
import Footer from "@/components/Footer";

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { genderTheme, toggleGender } = useGender();
  
  const [studentID, setStudentID] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [role, setRole] = useState<"student" | "professor">("student");
  const [error, setError] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await login(data.token);
      toast.success(t("register_success") || "تم إنشاء الحساب بنجاح!");
      navigate("/onboarding", { replace: true });
    },
    onError: (err) => setError(err.message || t("error_register")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({ studentID, fullName, email, password, securityQuestion, securityAnswer, role });
  };

  const isFemale = genderTheme === 'female';

  return (
    <div className={`min-h-screen transition-all duration-1000 flex flex-col items-center justify-center p-4 relative overflow-hidden ${
        isFemale ? (theme === 'dark' ? 'bg-[#1a050d]' : 'bg-[#fff0f6]') : (theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50')
      }`}>
      
      {/* 1. Global Navigation - Strictly following CTO classes */}
      <div className="flex items-center gap-4 absolute top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className={`bg-card/50 backdrop-blur-md border-border rounded-xl w-10 h-10 transition-all hover:scale-110 ${isFemale ? 'text-pink-500 border-pink-200' : 'text-blue-500 border-blue-500/20'}`}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')} className={`bg-card/50 backdrop-blur-md border-border rounded-xl px-3 h-10 font-bold ${!isFemale && 'text-blue-600 dark:text-blue-400 border-blue-500/20'}`}>
          {i18n.language.toUpperCase()}
        </Button>
        <Button onClick={toggleGender} variant="outline" size="icon" className={`bg-card/50 backdrop-blur-md border-border rounded-xl h-10 w-10 ${isFemale ? 'text-pink-500' : 'text-blue-500 border-blue-500/20'}`}>
          {isFemale ? <Flower size={18} /> : <Box size={18} />}
        </Button>
        <Button variant="outline" size="icon" onClick={toggleTheme} className={`bg-card/50 backdrop-blur-md border-border rounded-xl h-10 w-10 ${!isFemale && 'border-blue-500/20'}`}>
          {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
        </Button>
      </div>

      <Card className={`w-full max-w-lg relative z-10 backdrop-blur-3xl transition-all duration-1000 shadow-2xl rounded-[3rem] p-10 overflow-hidden my-12 ${
          isFemale 
            ? 'bg-white/40 border-pink-200 shadow-pink-500/10' 
            : 'bg-white/70 dark:bg-blue-950/30 border-white/20 dark:border-blue-500/20 shadow-blue-500/10'
      }`}>
        <div className="text-center mb-8">
          {/* 3. Balanced Logo & Title */}
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-2xl border transition-all transform rotate-3 ${
              isFemale ? 'bg-gradient-to-tr from-pink-500 to-rose-600 border-pink-400 text-white' : 'bg-gradient-to-tr from-blue-600 to-purple-700 border-blue-400/30 text-white shadow-blue-500/20'
          }`}>
            {isFemale ? <Flower className="h-10 w-10" /> : <Cpu className="h-10 w-10" />}
          </div>
          <h1 className={`text-2xl font-bold mb-1 glow-text ${isFemale ? 'text-pink-600' : 'text-blue-900 dark:text-white'}`}>{t("register")}</h1>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>
            انضم لعائلة جيتـا الأكاديمية 🛡️
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={`text-[10px] font-black px-4 uppercase tracking-widest glow-text ${isFemale ? 'text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>{t("full_name")}</label>
            <div className="relative">
              <UserCircle className={`absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-blue-400/50'}`} />
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder={t("full_name")} 
                className={`h-14 pr-14 rounded-2xl font-bold transition-all ${
                  isFemale 
                    ? 'bg-white/50 border-pink-100' 
                    : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-white placeholder:text-blue-300'
                }`} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-black px-4 uppercase tracking-widest glow-text ${isFemale ? 'text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>{t("student_id")}</label>
            <div className="relative">
              <User className={`absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-blue-400/50'}`} />
              <Input 
                value={studentID} 
                onChange={(e) => setStudentID(e.target.value)} 
                placeholder="00000" 
                className={`h-14 pr-14 rounded-2xl font-bold transition-all ${
                  isFemale 
                    ? 'bg-white/50 border-pink-100' 
                    : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-white placeholder:text-blue-300'
                }`} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={`text-[10px] font-black px-4 uppercase tracking-widest glow-text ${isFemale ? 'text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>البريد الإلكتروني (Email)</label>
            <div className="relative">
              <Mail className={`absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-blue-400/50'}`} />
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="example@gmail.com" 
                className={`h-14 pr-14 rounded-2xl font-bold transition-all ${
                  isFemale 
                    ? 'bg-white/50 border-pink-100' 
                    : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-white placeholder:text-blue-300'
                }`} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-black px-4 uppercase tracking-widest glow-text ${isFemale ? 'text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>{t("role")}</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)} 
              className={`w-full border h-14 rounded-2xl font-bold outline-none appearance-none px-6 transition-all ${
                isFemale 
                  ? 'bg-white/50 border-pink-100 text-pink-900' 
                  : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-white'
              }`}
            >
              <option value="student">{t("student")}</option>
              <option value="professor">{t("professor")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-black px-4 uppercase tracking-widest glow-text ${isFemale ? 'text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>{t("password")}</label>
            <div className="relative">
              <Lock className={`absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-blue-400/50'}`} />
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className={`h-14 pr-14 rounded-2xl font-bold transition-all ${
                  isFemale 
                    ? 'bg-white/50 border-pink-100' 
                    : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-white placeholder:text-blue-300'
                }`} 
                required 
              />
            </div>
          </div>

          <Button type="submit" disabled={registerMutation.isPending} className={`md:col-span-2 h-14 font-black text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] glow-text ${isFemale ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'}`}>
            {registerMutation.isPending ? <Loader2 className="animate-spin" /> : 'إنشاء حسابك الأكاديمي 🛡️'}
          </Button>

          <div className="md:col-span-2 text-center pt-6 border-t border-border/30 mt-4">
            {/* 2. Contrast Fix for Bottom Text */}
            <p className={`text-sm mb-4 font-medium ${isFemale ? 'text-pink-900' : 'text-blue-900 dark:text-blue-100'}`}>لديك حساب بالفعل؟</p>
            <Button variant="link" onClick={() => navigate("/login")} className={`font-bold hover:underline p-0 h-auto ${isFemale ? 'text-pink-600' : 'text-blue-600 dark:text-blue-400'}`}>تسجيل الدخول</Button>
          </div>
        </form>
      </Card>
      
      <div className="w-full"><Footer /></div>
    </div>
  );
}
