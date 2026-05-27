import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { ShieldCheck, Loader2, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");
  const { theme, toggleTheme } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err.message || "فشل تغيير كلمة المرور");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }
    if (!token) {
      toast.error("الرابط غير صالح");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Card className="p-10 text-center" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <h2 className="text-xl font-bold mb-4">رابط غير صالح</h2>
          <Button onClick={() => navigate("/login")} style={{ background: 'var(--button-gradient)', color: 'white', border: 'none' }}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      dir="rtl"
    >
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20" style={{ backgroundColor: 'var(--accent-primary)' }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20" style={{ backgroundColor: 'var(--accent-secondary)' }} />

      <div className="absolute top-6 right-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="backdrop-blur-md rounded-xl"
          style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <Card
        className="w-full max-w-md relative z-10 backdrop-blur-3xl shadow-2xl rounded-[3rem] p-10"
        style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)', boxShadow: '0 0 40px var(--glow-color)' }}
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ rotate: 10 }}
            animate={{ rotate: 0 }}
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border"
            style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)', borderColor: 'var(--border-pink)' }}
          >
            <ShieldCheck size={40} />
          </motion.div>
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>كلمة مرور جديدة</h1>
          <p className="font-bold text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>أدخل كلمة المرور الجديدة لحسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>كلمة المرور الجديدة</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-2xl font-bold pr-12 border outline-none focus:ring-0"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px var(--glow-color)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--accent-secondary)' }}>تأكيد كلمة المرور</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 rounded-2xl font-bold border outline-none focus:ring-0"
              style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px var(--glow-color)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full h-14 font-black text-lg rounded-2xl border-none transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'var(--button-gradient)', color: 'white', boxShadow: '0 10px 30px var(--glow-color)' }}
          >
            {resetMutation.isPending ? <Loader2 className="animate-spin" /> : "تحديث كلمة المرور"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
