import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useGender } from "@/contexts/GenderContext";
import { KeyRound, Mail, User, ShieldQuestion, Lock, ArrowRight, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';

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
    <div className={`min-h-screen transition-all duration-1000 flex flex-col items-center justify-center p-6 pb-20 relative overflow-hidden ${
      isFemale ? 'bg-[#fff0f6]' : 'bg-[#020617]'
    }`} dir="rtl">
      {/* Background Orbs */}
      <div className={`fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-pink-400' : 'bg-blue-600'
      }`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-rose-400' : 'bg-purple-600'
      }`} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-10">
          <Logo className="scale-125" />
        </div>

        <Card className={`backdrop-blur-3xl border shadow-2xl rounded-[3rem] overflow-hidden ${
          isFemale ? 'bg-white/70 border-pink-200/50' : 'bg-white/[0.02] border-white/10'
        }`}>
          <CardHeader className="p-8 text-center pb-2">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              isFemale ? 'bg-pink-500 text-white shadow-pink-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
            }`}>
              <KeyRound size={28} />
            </div>
            <CardTitle className={`text-2xl font-black ${isFemale ? 'text-pink-900' : 'text-white'}`}>
              استعادة الحساب
            </CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
                  s === step ? (isFemale ? 'w-8 bg-pink-500' : 'w-8 bg-blue-500') : (isFemale ? 'w-2 bg-pink-200' : 'w-2 bg-white/10')
                }`} />
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
                    <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-slate-500'}`}>البريد الإلكتروني</label>
                    <div className="relative group">
                      <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-white/20'}`} />
                      <Input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="example@it.edu" 
                        className={`h-14 pr-12 rounded-2xl font-bold bg-background/50 ${isFemale ? 'border-pink-200 focus:border-pink-500' : 'border-white/10'}`} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-slate-500'}`}>رقم القيد</label>
                    <div className="relative group">
                      <User className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-white/20'}`} />
                      <Input 
                        value={studentID} 
                        onChange={(e) => setStudentID(e.target.value)} 
                        placeholder="22100000" 
                        className={`h-14 pr-12 rounded-2xl font-bold bg-background/50 ${isFemale ? 'border-pink-200 focus:border-pink-500' : 'border-white/10'}`} 
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={questionQuery.isFetching} className={`w-full h-14 rounded-2xl font-black text-lg gap-3 transition-all ${
                    isFemale ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
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
                  <div className={`p-6 rounded-[2rem] text-center border-2 border-dashed ${isFemale ? 'bg-pink-50 border-pink-200' : 'bg-white/5 border-white/10'}`}>
                    <ShieldQuestion className={`mx-auto mb-3 ${isFemale ? 'text-pink-500' : 'text-blue-500'}`} size={32} />
                    <p className={`text-[10px] font-black mb-1 ${isFemale ? 'text-pink-400' : 'text-slate-500'}`}>سؤال الأمان الخاص بك</p>
                    <h4 className={`text-lg font-black italic ${isFemale ? 'text-pink-900' : 'text-white'}`}>"{securityQuestion}"</h4>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-slate-500'}`}>إجابة سؤال الأمان</label>
                    <Input 
                      value={securityAnswer} 
                      onChange={(e) => setSecurityAnswer(e.target.value)} 
                      placeholder="اكتب الإجابة هنا..." 
                      className={`h-14 rounded-2xl font-bold bg-background/50 ${isFemale ? 'border-pink-200 focus:border-pink-500' : 'border-white/10'}`} 
                      required 
                    />
                  </div>

                  <Button type="submit" className={`w-full h-14 rounded-2xl font-black text-lg gap-3 ${
                    isFemale ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
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
                    <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-slate-500'}`}>كلمة المرور الجديدة</label>
                    <div className="relative group">
                      <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isFemale ? 'text-pink-300' : 'text-white/20'}`} />
                      <Input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className={`h-14 pr-12 rounded-2xl font-bold bg-background/50 ${isFemale ? 'border-pink-200 focus:border-pink-500' : 'border-white/10'}`} 
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

            <div className="mt-8 pt-6 border-t border-dashed border-white/10 flex justify-center">
              <button 
                onClick={() => navigate("/login")}
                className={`text-sm font-bold flex items-center gap-2 hover:underline transition-all ${isFemale ? 'text-pink-500' : 'text-blue-400'}`}
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
