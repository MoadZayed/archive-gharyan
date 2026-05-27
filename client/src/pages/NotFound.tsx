import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Compass, AlertCircle } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-1000" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      
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
        className="w-full max-w-md text-center relative z-10"
      >
        <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)', color: 'white' }}>
          <AlertCircle size={48} strokeWidth={2.5} />
        </div>

        <h1 className="text-6xl font-black mb-6 tracking-tighter" style={{ color: 'var(--accent-primary)' }}>
          404
        </h1>

        <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
          أووه! ضعت في ممرات الكلية؟
        </h2>

        <p className="text-sm font-bold leading-relaxed mb-12" style={{ color: 'var(--text-muted)' }}>
          الصفحة اللي تدور عليها مش موجودة، بس ولا يهمك.. ديما فيه طريق للعودة.
        </p>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => navigate("/")}
            className="h-16 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(233,30,99,0.3)] transition-all transform hover:scale-105 active:scale-95 border-none"
            style={{ background: 'var(--button-gradient)', color: 'white' }}
          >
            <Home className="ml-2 h-5 w-5" />
            العودة للرئيسية
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="h-14 rounded-2xl font-black hover:bg-[rgba(233,30,99,0.1)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <Compass className="ml-2 h-5 w-5" />
            ارجع للخلف
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
