import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Lock, User, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: async (data) => {
      await login(data.token);
      toast.success("مرحباً بك أيها المدير العام في قمرة القيادة");
      // Use window.location.href to force full refresh and clear student contexts/themes
      window.location.href = "/admin";
    },
    onError: (err) => {
      // Ensure we display the specific error message from the backend if available
      const errorMessage = err.message || "فشل تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مجدداً.";
      toast.error(errorMessage);
    },
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 pb-20 relative overflow-hidden" 
         style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
         dir="rtl"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,24,91,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-sm z-10 mb-8"
      >
        <Card className="backdrop-blur-3xl p-6 md:p-10 rounded-[3rem] shadow-2xl border"
              style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)', boxShadow: '0 0 40px rgba(233,30,99,0.1)' }}>
          <div className="flex flex-col items-center mb-12">
            <Logo className="scale-125 mb-4" />
            <h1 className="text-2xl font-black tracking-tighter mb-2" style={{ color: 'var(--text-primary)' }}>النظام المركزي</h1>
            <div className="flex items-center gap-2 px-4 py-1 rounded-full border"
                 style={{ backgroundColor: 'rgba(233,30,99,0.1)', borderColor: 'var(--border-pink)' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <p className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--accent-secondary)' }}>Admin Portal v2.0</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[12px] font-black px-3 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>اسم مدير النظام</label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors" style={{ color: 'var(--text-muted)' }} />
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Username" 
                  className="h-[52px] pr-12 rounded-2xl font-bold transition-all border outline-none focus:ring-0 text-right"
                  style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  required 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[12px] font-black px-3 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>كلمة المرور المشفرة</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors" style={{ color: 'var(--text-muted)' }} />
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loginMutation.isPending} 
              className="w-full h-[56px] font-black text-lg rounded-[14px] shadow-[0_10px_30px_rgba(233,30,99,0.3)] transition-all hover:scale-[1.02] active:scale-95 border-0"
              style={{ background: 'var(--button-gradient)', color: 'white' }}
            >
              {loginMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "دخول المنطقة المحظورة"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <button 
              type="button" 
              onClick={() => navigate("/")} 
              className="text-[10px] font-black transition-colors uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              الرجوع للواجهة العامة
              <span>→</span>
            </button>
          </div>
        </Card>
      </motion.div>

      <div className="mt-20 w-full max-w-7xl">
        <Footer />
      </div>
    </div>
  );
}
