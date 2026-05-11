import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Compass, AlertCircle } from "lucide-react";
import { useGender } from "@/contexts/GenderContext";

export default function NotFound() {
  const [, navigate] = useLocation();
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-1000 ${
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
        className="w-full max-w-md text-center relative z-10"
      >
        <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl ${
          isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white shadow-blue-500/20'
        }`}>
          <AlertCircle size={48} strokeWidth={2.5} />
        </div>

        <h1 className={`text-6xl font-black mb-6 tracking-tighter ${isFemale ? 'text-pink-600' : 'text-white'}`}>
          404
        </h1>

        <h2 className={`text-2xl font-black mb-4 ${isFemale ? 'text-pink-900' : 'text-white/80'}`}>
          أووه! ضعت في ممرات الكلية؟
        </h2>

        <p className={`text-sm font-bold leading-relaxed mb-12 ${isFemale ? 'text-pink-950/40' : 'text-white/40'}`}>
          الصفحة اللي تدور عليها مش موجودة، بس ولا يهمك.. ديما فيه طريق للعودة.
        </p>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => navigate("/")}
            className={`h-16 rounded-2xl font-black text-lg shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
              isFemale ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            <Home className="ml-2 h-5 w-5" />
            العودة للرئيسية
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className={`h-14 rounded-2xl font-black ${isFemale ? 'text-pink-400 hover:bg-pink-50' : 'text-white/30 hover:bg-white/5'}`}
          >
            <Compass className="ml-2 h-5 w-5" />
            ارجع للخلف
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
