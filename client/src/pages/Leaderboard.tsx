import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Crown, 
  Shield, 
  Flower, 
  Sparkles, 
  ChevronRight, 
  Upload, 
  Loader2,
  Medal,
  Star
} from "lucide-react";
import ReputationBadge from "@/components/ReputationBadge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { theme } = useTheme();

  useDocumentTitle("لوحة الشرف");
  const leaderboardQuery = trpc.stats.getLeaderboard.useQuery();

  const topThree = useMemo(() => leaderboardQuery.data?.slice(0, 3) || [], [leaderboardQuery.data]);
  const others = useMemo(() => leaderboardQuery.data?.slice(3) || [], [leaderboardQuery.data]);

  const pointLabel = "نجمة";

  if (leaderboardQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-1000 pb-28 md:pb-20 relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      <Navbar />

      {/* Background Orbs */}
      <div 
        className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />
      <div 
        className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,91,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />

      {/* Header */}
      <div className="w-full px-4 md:px-12 pt-[100px] md:pt-[120px] flex justify-between items-center relative z-10">
        <Button 
          variant="outline" 
          onClick={() => navigate("/files")} 
          className="backdrop-blur-xl rounded-[14px] flex items-center gap-2 font-black border min-h-[44px]"
          style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
        >
          <ChevronRight />
          الأرشيف
        </Button>
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter" style={{ color: 'var(--text-primary)' }}>لوحة الصدارة</h1>
          <p className="font-black text-[10px] md:text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--accent-secondary)' }}>أفضل مساهمي الأرشيف الأكاديمي</p>
        </div>
        <div className="w-[100px] hidden md:block" /> {/* Spacer */}
      </div>

      <main className="max-w-5xl mx-auto px-6 mt-20 relative z-10">
        {/* Podium Section */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-20 pt-20">
          {/* Second Place */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full md:w-64 order-2 md:order-1"
            >
              <Card className="backdrop-blur-xl border transition-all duration-300 rounded-[3rem] p-8 text-center relative shadow-[0_10px_30px_rgba(233,30,99,0.1)]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-gray-400 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                  <Medal className="text-white" size={40} />
                </div>
                <h3 
                  className="text-xl font-black mb-1 mt-4"
                  style={{ color: 'var(--text-primary)', textShadow: '1px 1px 0px #9CA3AF, 2px 2px 0px rgba(0,0,0,0.5)' }}
                >
                  {topThree[1].fullName}
                </h3>
                <div className="flex justify-center mb-2">
                  <ReputationBadge points={topThree[1].petals} />
                </div>
                <p className="text-2xl font-black" style={{ color: 'var(--accent-primary)' }}>
                  {topThree[1].petals} <span className="text-xs">{pointLabel}</span>
                </p>
                <div className="mt-4 text-[10px] font-black opacity-70 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>المراكز الفضية</div>
              </Card>
            </motion.div>
          )}

          {/* First Place */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full md:w-80 order-1 md:order-2 mb-10 md:mb-0"
            >
              <Card className="backdrop-blur-2xl border-4 transition-all duration-500 rounded-[4rem] p-12 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(255,215,0,0.2)]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'rgba(255,215,0,0.5)' }}>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"
                />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-24 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                  <Crown className="text-white" size={48} />
                </div>
                <h3 
                  className="text-3xl font-black mb-2 mt-6 text-[#FFD700]"
                  style={{ textShadow: '1px 1px 0px #B8860B, 2px 2px 0px #B8860B, 3px 3px 5px rgba(0,0,0,0.5)' }}
                >
                  {topThree[0].fullName}
                </h3>
                <div className="flex justify-center mb-3">
                  <ReputationBadge points={topThree[0].petals} />
                </div>
                <p className="text-4xl font-black" style={{ color: 'var(--accent-primary)' }}>
                  {topThree[0].petals} <span className="text-sm">{pointLabel}</span>
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <Sparkles className="text-yellow-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-500">القائد الذهبي</span>
                  <Sparkles className="text-yellow-500" />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Third Place */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full md:w-60 order-3"
            >
              <Card className="backdrop-blur-xl border transition-all duration-300 rounded-[3rem] p-8 text-center relative shadow-[0_10px_30px_rgba(233,30,99,0.1)]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                  <Star className="text-white" size={32} />
                </div>
                <h3 
                  className="text-lg font-black mb-1 mt-4 text-[#F59E0B]"
                  style={{ textShadow: '1px 1px 0px #B45309, 2px 2px 0px rgba(0,0,0,0.5)' }}
                >
                  {topThree[2].fullName}
                </h3>
                <div className="flex justify-center mb-2">
                  <ReputationBadge points={topThree[2].petals} />
                </div>
                <p className="text-xl font-black" style={{ color: 'var(--accent-primary)' }}>
                  {topThree[2].petals} <span className="text-xs">{pointLabel}</span>
                </p>
                <div className="mt-4 text-[10px] font-black opacity-70 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>المركز البرونزي</div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* List Section */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {others.map((student: any, idx: number) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
            >
              <Card className="backdrop-blur-xl border p-4 md:p-6 rounded-[2rem] flex items-center justify-between transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-lg md:text-xl" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
                    #{idx + 4}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base md:text-lg" style={{ color: 'var(--text-primary)' }}>{student.fullName}</h4>
                      <ReputationBadge points={student.petals} showLabel={false} />
                    </div>
                    <p className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{student.studentID}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xl md:text-2xl font-black" style={{ color: 'var(--accent-primary)' }}>{student.petals}</span>
                  <span className="text-[10px] font-black mr-1 md:mr-2 opacity-50 uppercase tracking-widest">نجمة</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-8 md:p-12 rounded-[4rem] text-center border-2 border-dashed"
          style={{ backgroundColor: 'rgba(233,30,99,0.05)', borderColor: 'var(--border-pink)' }}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)', color: 'white' }}>
             <Star size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>هل تريد أن يخلد اسمك هنا؟</h2>
          <p className="text-base md:text-lg font-bold mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            ساهم مع زملائك برفع أفضل ما لديك من ملخصات وامتحانات، واجمع المزيد من النجوم لتتصدر القائمة!
          </p>
          <Button 
            onClick={() => navigate("/upload")}
            className="h-[56px] md:h-20 px-8 md:px-12 rounded-full md:rounded-[2.5rem] font-black text-lg md:text-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 border-none"
            style={{ background: 'var(--button-gradient)', color: 'white' }}
          >
            <Upload className="ml-3 h-5 w-5 md:h-6 md:w-6" />
            ابدأ المساهمة الآن
          </Button>
        </motion.div>
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
