import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";


export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/files");
    }
  }, [user, navigate]);

  useDocumentTitle("الرئيسية");

  const statsQuery = trpc.stats.getPlatformStats.useQuery();
  const stats = statsQuery.data || { students: 0, files: 0, aiFeatures: 3 };

  return (
    <div className="min-h-screen transition-colors duration-1000 overflow-x-hidden relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      
      {/* CSS Fallback Background */}
      <div className="three-background-fallback" />

      {/* Floating Theme Toggle */}
      <ThemeToggle className="fixed top-4 left-4 z-50" />

      <header className="relative z-50 flex items-center justify-between px-4 md:px-12 py-8 w-full max-w-none mx-auto" dir="ltr">
        <div></div>
        <Logo style={{ color: 'var(--accent-primary)' }} />
      </header>

      <main className="relative z-10 max-w-none mx-auto px-4 md:px-12 pt-24 pb-32 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-[8rem] font-black leading-[1.2] md:leading-[1] tracking-tighter select-none pb-12" style={{ color: 'var(--text-primary)' }}>
            مش مجرد منصة قراية..<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'var(--button-gradient)' }}>
              هني مجتمعك الأكاديمي<br />اللي يجمعنا
            </span>
          </h1>

          <div className="py-20">
            <p className="text-lg md:text-3xl font-black transition-colors duration-1000 tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-sm" style={{ color: 'var(--accent-secondary)' }}>
              كلية تقنية المعلومات - غريان
            </p>
          </div>

          <div className="pt-16 flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/register")}
              className="relative group px-12 md:px-16 py-4 md:py-6 rounded-[2rem] font-black text-[18px] md:text-xl transition-all duration-500 overflow-hidden shadow-[0_10px_30px_rgba(233,30,99,0.3)] border-none w-full sm:w-auto min-h-[56px]"
              style={{ background: 'var(--button-gradient)' }}
            >
              <span className="relative z-10 text-white flex items-center justify-center gap-3">
                ادخل للمنصة من هنا <Sparkles size={24} />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className="px-10 md:px-12 py-4 md:py-6 rounded-[2rem] font-black text-[18px] md:text-xl transition-all duration-500 border-2 backdrop-blur-xl w-full sm:w-auto min-h-[56px]"
              style={{ borderColor: 'var(--border-pink)', color: 'var(--text-primary)', backgroundColor: 'var(--glass-white)' }}
            >
              لدي حساب بالفعل
            </motion.button>
          </div>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}