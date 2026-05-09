import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, AlertCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useGender } from "@/contexts/GenderContext";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 transition-colors duration-1000 ${
      isFemale ? 'bg-[#fff0f6]' : 'bg-[#020617]'
    }`} dir="rtl">
      
      {/* Background Orbs */}
      <div className={`fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-pink-400' : 'bg-blue-600'
      }`} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <div className="mb-12 flex justify-center">
          <Logo className="scale-150" />
        </div>

        <Card className={`backdrop-blur-3xl border shadow-2xl rounded-[3.5rem] p-12 mb-8 ${
          isFemale ? 'bg-white/70 border-pink-200' : 'bg-white/[0.02] border-white/10'
        }`}>
          <div className="flex justify-center mb-8">
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl ${
              isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white shadow-blue-500/20'
            }`}>
              <AlertCircle size={48} />
            </div>
          </div>

          <h1 className={`text-6xl font-black mb-4 tracking-tighter ${isFemale ? 'text-pink-900' : 'text-white'}`}>404</h1>
          <h2 className={`text-2xl font-black mb-6 ${isFemale ? 'text-pink-700' : 'text-blue-400'}`}>
            الصفحة غير موجودة!
          </h2>

          <p className={`font-bold text-lg mb-10 leading-relaxed ${isFemale ? 'text-pink-900/60' : 'text-slate-400'}`}>
            عذراً، يبدو أنك سلكت مساراً خاطئاً في الأرشيف. 
            ربما تم نقل الملف أو أن الرابط غير صحيح.
          </p>

          <Button
            onClick={() => setLocation("/")}
            className={`w-full h-16 rounded-2xl font-black text-xl gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95 ${
              isFemale ? 'bg-pink-500 text-white shadow-pink-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
            }`}
          >
            <Home size={24} />
            العودة للرئيسية
          </Button>
        </Card>

        <button 
          onClick={() => window.history.back()}
          className={`text-sm font-black flex items-center justify-center gap-2 mx-auto transition-all hover:gap-4 ${
            isFemale ? 'text-pink-400' : 'text-slate-500'
          }`}
        >
          <ArrowRight className="rotate-180" size={16} />
          الرجوع للخلف
        </button>
      </motion.div>
    </div>
  );
}
