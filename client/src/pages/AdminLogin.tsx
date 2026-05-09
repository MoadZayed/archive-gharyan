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
    <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center p-4 pb-20 selection:bg-violet-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-full max-w-sm z-10 mb-8"
      >
        <Card className="bg-black/60 backdrop-blur-3xl border-white/5 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t-white/10">
          <div className="flex flex-col items-center mb-12">
            <Logo className="scale-125 mb-4" />
            <h1 className="text-2xl font-black text-white tracking-tighter mb-2">النظام المركزي</h1>
            <div className="flex items-center gap-2 px-4 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-[0.25em]">Admin Portal v2.0</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 px-3 uppercase tracking-widest">اسم مدير النظام</label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-violet-500 transition-colors" />
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Username" 
                  className="bg-white/[0.02] border-white/5 h-14 rounded-2xl font-bold pr-12 text-white focus:border-violet-500/40 transition-all outline-none focus:ring-4 focus:ring-violet-500/5" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 px-3 uppercase tracking-widest">كلمة المرور المشفرة</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-violet-500 transition-colors" />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="bg-white/[0.02] border-white/5 h-14 rounded-2xl font-bold pr-12 pl-12 text-white focus:border-violet-500/40 transition-all outline-none focus:ring-4 focus:ring-violet-500/5" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loginMutation.isPending} 
              className="w-full h-16 bg-white text-black hover:bg-white/90 font-black rounded-2xl shadow-2xl transition-all active:scale-95 text-lg"
            >
              {loginMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : "دخول المنطقة المحظورة"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <button 
              type="button" 
              onClick={() => navigate("/")} 
              className="text-[10px] font-black text-white/20 hover:text-white/50 transition-colors uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto"
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
