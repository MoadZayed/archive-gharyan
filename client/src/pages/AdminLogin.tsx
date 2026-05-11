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
import { useGender } from "@/contexts/GenderContext";

export default function AdminLogin() {
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';
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
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 pb-20 selection:bg-blue-500/30 ${
      isFemale ? 'bg-pink-50 dark:bg-[#1a050d]' : 'bg-slate-50 dark:bg-[#020617]'
    }`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] ${
          isFemale ? 'bg-pink-400/20 dark:bg-pink-600/10' : 'bg-blue-400/20 dark:bg-blue-600/10'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] ${
          isFemale ? 'bg-rose-400/10 dark:bg-rose-600/5' : 'bg-indigo-400/10 dark:bg-indigo-600/5'
        }`} />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-sm z-10 mb-8"
      >
        <Card className={`backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl ${
          isFemale 
            ? 'bg-white/60 dark:bg-black/60 border-pink-200 dark:border-pink-800 shadow-pink-500/10' 
            : 'bg-white/60 dark:bg-black/60 border-blue-200 dark:border-blue-800 shadow-blue-500/10'
        }`}>
          <div className="flex flex-col items-center mb-12">
            <Logo className="scale-125 mb-4" />
            <h1 className={`text-2xl font-black tracking-tighter mb-2 ${isFemale ? 'text-pink-900 dark:text-pink-100' : 'text-blue-900 dark:text-blue-100'}`}>النظام المركزي</h1>
            <div className={`flex items-center gap-2 px-4 py-1 rounded-full border ${
              isFemale ? 'bg-pink-100 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20' : 'bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isFemale ? 'bg-pink-500' : 'bg-blue-500'}`} />
              <p className={`text-[9px] font-black uppercase tracking-[0.25em] ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>Admin Portal v2.0</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-8">
            <div className="space-y-3">
              <label className={`text-[10px] font-black px-3 uppercase tracking-widest ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>اسم مدير النظام</label>
              <div className="relative group">
                <User className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                  isFemale ? 'text-pink-400 dark:text-pink-600 group-focus-within:text-pink-500' : 'text-blue-400 dark:text-blue-600 group-focus-within:text-blue-500'
                }`} />
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Username" 
                  className={`h-14 rounded-2xl font-bold pr-12 transition-all outline-none ${
                    isFemale 
                      ? 'bg-white border-pink-200 dark:bg-slate-800 dark:border-pink-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-300 dark:placeholder:text-pink-600 focus:ring-pink-400' 
                      : 'bg-white border-blue-200 dark:bg-slate-800 dark:border-blue-800 text-blue-900 dark:text-blue-100 placeholder:text-blue-300 dark:placeholder:text-blue-600 focus:ring-blue-500'
                  }`} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className={`text-[10px] font-black px-3 uppercase tracking-widest ${isFemale ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'}`}>كلمة المرور المشفرة</label>
              <div className="relative group">
                <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                  isFemale ? 'text-pink-400 dark:text-pink-600 group-focus-within:text-pink-500' : 'text-blue-400 dark:text-blue-600 group-focus-within:text-blue-500'
                }`} />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className={`h-14 rounded-2xl font-bold pr-12 pl-12 transition-all outline-none ${
                    isFemale 
                      ? 'bg-white border-pink-200 dark:bg-slate-800 dark:border-pink-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-300 dark:placeholder:text-pink-600 focus:ring-pink-400' 
                      : 'bg-white border-blue-200 dark:bg-slate-800 dark:border-blue-800 text-blue-900 dark:text-blue-100 placeholder:text-blue-300 dark:placeholder:text-blue-600 focus:ring-blue-500'
                  }`} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isFemale ? 'text-pink-400 dark:text-pink-600 hover:text-pink-500' : 'text-blue-400 dark:text-blue-600 hover:text-blue-500'
                  }`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loginMutation.isPending} 
              className={`w-full h-14 font-black text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 border-0 ${
                isFemale ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loginMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "دخول المنطقة المحظورة"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <button 
              type="button" 
              onClick={() => navigate("/")} 
              className={`text-[10px] font-black transition-colors uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto ${
                isFemale ? 'text-pink-500/50 hover:text-pink-500' : 'text-blue-500/50 hover:text-blue-500'
              }`}
            >
              <span>←</span>
              الرجوع للواجهة العامة
            </button>
          </div>
        </Card>
      </motion.div>

      <div className="mt-20 w-full">
        <Footer />
      </div>
    </div>
  );
}
