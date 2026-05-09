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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-10 text-center">
          <h2 className="text-xl font-bold mb-4">رابط غير صالح</h2>
          <Button onClick={() => navigate("/login")}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-50">
        <Button variant="outline" size="icon" onClick={toggleTheme} className="bg-card/50 backdrop-blur-md border-border rounded-xl">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-3xl bg-card/40 dark:bg-white/[0.02] border border-border/50 dark:border-white/10 shadow-2xl rounded-[3rem] p-10">
        <div className="flex flex-col items-center mb-12">
          <motion.div initial={{ rotate: 10 }} animate={{ rotate: 0 }} className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-6 border border-primary/20">
            <ShieldCheck size={40} />
          </motion.div>
          <h1 className="text-3xl font-black text-foreground mb-2">كلمة مرور جديدة</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">أدخل كلمة المرور الجديدة لحسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground px-4 uppercase tracking-widest">كلمة المرور الجديدة</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-background/50 border-border h-14 rounded-2xl font-bold pr-12" 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground px-4 uppercase tracking-widest">تأكيد كلمة المرور</label>
            <Input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="bg-background/50 border-border h-14 rounded-2xl font-bold" 
              required 
            />
          </div>

          <Button type="submit" disabled={resetMutation.isPending} className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
            {resetMutation.isPending ? <Loader2 className="animate-spin" /> : "تحديث كلمة المرور"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
