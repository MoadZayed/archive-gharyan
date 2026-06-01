import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Lock, User, UserCircle, ArrowRight, Shield, Sparkles, Flower, Box, Cpu, Mail, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  
  const [studentID, setStudentID] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [role, setRole] = useState<"student" | "professor">("student");
  const [showPassword, setShowPassword] = useState(false);

  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      // Do not log in automatically. The user is pending.
      toast.success(data.message || "تم إرسال طلب التسجيل بنجاح، يرجى انتظار موافقة الإدارة قبل تسجيل الدخول. سيتم إخطارك عند قبول طلبك.", { duration: 8000 });
      navigate("/login", { replace: true });
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        toast.error("رقم القيد مسجل مسبقاً");
      } else {
        toast.error(err.message || "فشل إنشاء الحساب، يرجى المحاولة لاحقاً");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    registerMutation.mutate({ studentID, fullName, email, password, securityQuestion, securityAnswer, role });
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

      <Card className="w-full max-w-2xl relative z-10 backdrop-blur-3xl transition-all duration-1000 shadow-2xl rounded-[3rem] p-6 md:p-10 overflow-hidden my-12 border"
            style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)', boxShadow: '0 0 40px rgba(233,30,99,0.1)' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(233,30,99,0.3)] border transition-all transform hover:rotate-3"
               style={{ background: 'var(--button-gradient)', borderColor: 'var(--accent-secondary)', color: 'white' }}>
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t("register")}</h1>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            انضم لعائلة الأرشيف الأكاديمي 🛡️
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>{t("full_name")}</label>
            <div className="relative">
              <UserCircle className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder={t("full_name")} 
                className="h-[52px] pr-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>{t("student_id")}</label>
            <div className="relative">
              <User className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <Input 
                value={studentID} 
                onChange={(e) => setStudentID(e.target.value)} 
                placeholder="00000" 
                className="h-[52px] pr-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                pattern="\d{6,10}"
                title="يجب أن يتكون رقم القيد من 6 إلى 10 أرقام"
                required 
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>البريد الإلكتروني (Email)</label>
            <div className="relative">
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="example@gmail.com" 
                className="h-[52px] pr-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>{t("role")}</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)} 
              className="w-full border h-[52px] rounded-2xl font-bold outline-none appearance-none px-4 transition-all"
              style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="student" className="bg-[#2d1020]">{t("student")}</option>
              <option value="professor" className="bg-[#2d1020]">{t("professor")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>{t("password")}</label>
            <div className="relative">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--accent-primary)] focus:outline-none"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <Input 
                type={showPassword ? "text" : "password"}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="h-[52px] pr-12 pl-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>سؤال الأمان (Security Question)</label>
            <select 
              value={securityQuestion} 
              onChange={(e) => setSecurityQuestion(e.target.value)} 
              className="w-full border h-[52px] rounded-2xl font-bold outline-none appearance-none px-4 transition-all"
              style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              required
            >
              <option value="" className="bg-[#2d1020]">اختر سؤالاً...</option>
              <option value="ما هو اسم أول مدرسة ارتدتها؟" className="bg-[#2d1020]">ما هو اسم أول مدرسة ارتدتها؟</option>
              <option value="ما هي مدينتك المفضلة؟" className="bg-[#2d1020]">ما هي مدينتك المفضلة؟</option>
              <option value="ما هو تخصصك المفضل؟" className="bg-[#2d1020]">ما هو تخصصك المفضل؟</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[12px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>إجابة الأمان (Security Answer)</label>
            <div className="relative">
              <Shield className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
              <Input 
                value={securityAnswer} 
                onChange={(e) => setSecurityAnswer(e.target.value)} 
                placeholder="إجابتك..." 
                className="h-[52px] pr-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required 
                minLength={3}
              />
            </div>
          </div>

          <Button type="submit" disabled={registerMutation.isPending} className="md:col-span-2 w-full h-[56px] mt-4 font-black text-[16px] rounded-[14px] shadow-[0_10px_30px_rgba(233,30,99,0.3)] transition-all hover:scale-[1.02] active:scale-95 border-none" style={{ background: 'var(--button-gradient)', color: 'white' }}>
            {registerMutation.isPending ? <Loader2 className="animate-spin" /> : 'إنشاء حسابك الأكاديمي 🛡️'}
          </Button>

          <div className="md:col-span-2 text-center pt-6 border-t mt-4" style={{ borderColor: 'var(--glass-white)' }}>
            <p className="text-[14px] mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>لديك حساب بالفعل؟</p>
            <Button variant="link" onClick={() => navigate("/login")} className="font-bold hover:underline p-0 h-auto text-[15px]" style={{ color: 'var(--accent-primary)' }}>تسجيل الدخول</Button>
          </div>
        </form>
      </Card>
      
      <div className="w-full max-w-7xl"><Footer /></div>
    </div>
  );
}
