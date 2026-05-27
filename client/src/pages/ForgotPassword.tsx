import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { KeyRound, Mail, User, ShieldQuestion, Lock, ArrowRight, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [studentID, setStudentID] = useState("");
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const questionQuery = trpc.auth.getSecurityQuestion.useQuery(
    { studentID, email },
    { enabled: false, retry: false }
  );

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("تم استعادة حسابك بنجاح! يمكنك الآن تسجيل الدخول.");
      navigate("/login");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentID || !email) return toast.error("يرجى ملء كافة الحقول");
    
    const result = await questionQuery.refetch();
    if (result.data) {
      setSecurityQuestion(result.data.securityQuestion);
      setStep(2);
    } else if (result.error) {
      toast.error(result.error.message);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer) return toast.error("يرجى إدخال الإجابة");
    setStep(3);
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    resetMutation.mutate({
      studentID,
      securityAnswer,
      newPassword
    });
  };

  return (
    <div className="min-h-screen transition-all duration-1000 flex flex-col items-center justify-center p-6 pb-20 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      {/* Background Orbs */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />
      <div 
        className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--accent-secondary)' }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-10">
          <Logo className="scale-125" />
        </div>

        <Card className="backdrop-blur-3xl border shadow-[0_20px_50px_rgba(233,30,99,0.15)] rounded-[3rem] overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <CardHeader className="p-8 text-center pb-2">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)', color: 'white' }}>
              <KeyRound size={28} />
            </div>
            <CardTitle className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              استعادة الحساب
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="h-1.5 rounded-full transition-all duration-500" style={{ 
                  width: s === step ? '2rem' : '0.5rem',
                  backgroundColor: s === step ? 'var(--accent-primary)' : 'var(--glass-white)'
                }} />
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-8 pt-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleStep1} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني</label>
                    <div className="relative group">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                      <Input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="example@it.edu" 
                        className="h-14 pr-12 rounded-2xl font-bold border outline-none" 
                        style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>رقم القيد</label>
                    <div className="relative group">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                      <Input 
                        value={studentID} 
                        onChange={(e) => setStudentID(e.target.value)} 
                        placeholder="22100000" 
                        className="h-14 pr-12 rounded-2xl font-bold border outline-none" 
                        style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={questionQuery.isFetching} className="w-full h-14 rounded-2xl font-black text-lg gap-3 transition-all border-none shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)', color: 'white' }}>
                    {questionQuery.isFetching ? <Loader2 className="animate-spin" /> : <>التحقق من البيانات <ArrowRight className="rotate-180" /></>}
                  </Button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleStep2} 
                  className="space-y-6"
                >
                  <div className="p-6 rounded-[2rem] text-center border-2 border-dashed" style={{ backgroundColor: 'rgba(233,30,99,0.05)', borderColor: 'var(--border-pink)' }}>
                    <ShieldQuestion className="mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} size={32} />
                    <p className="text-[10px] font-black mb-1" style={{ color: 'var(--text-muted)' }}>سؤال الأمان الخاص بك</p>
                    <h4 className="text-lg font-black italic" style={{ color: 'var(--text-primary)' }}>"{securityQuestion}"</h4>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>إجابة سؤال الأمان</label>
                    <Input 
                      value={securityAnswer} 
                      onChange={(e) => setSecurityAnswer(e.target.value)} 
                      placeholder="اكتب الإجابة هنا..." 
                      className="h-14 rounded-2xl font-bold border outline-none" 
                      style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                      required 
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-[0_10px_30px_rgba(233,30,99,0.3)] border-none" style={{ background: 'var(--button-gradient)', color: 'white' }}>
                    التحقق من الإجابة <ArrowRight className="rotate-180" />
                  </Button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form 
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleStep3} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>كلمة المرور الجديدة</label>
                    <div className="relative group">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                      <Input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="h-14 pr-12 rounded-2xl font-bold border outline-none" 
                        style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={resetMutation.isPending} className="w-full h-14 rounded-2xl font-black text-lg gap-3 bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20">
                    {resetMutation.isPending ? <Loader2 className="animate-spin" /> : <>تعيين كلمة المرور <CheckCircle2 size={20} /></>}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t flex justify-center" style={{ borderColor: 'var(--glass-white)' }}>
              <button 
                onClick={() => navigate("/login")}
                className="text-sm font-bold flex items-center gap-2 hover:underline transition-all"
                style={{ color: 'var(--accent-primary)' }}
              >
                <ChevronRight className="h-4 w-4" />
                العودة لتسجيل الدخول
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <div className="mt-20 w-full">
        <Footer />
      </div>
    </div>
  );
}
