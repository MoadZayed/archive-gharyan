import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useGender } from "@/contexts/GenderContext";
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

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { genderTheme } = useGender();
  const { theme } = useTheme();

  useDocumentTitle("لوحة الشرف");

  const isFemale = genderTheme === 'female';
  const leaderboardQuery = trpc.stats.getLeaderboard.useQuery();

  const topThree = useMemo(() => leaderboardQuery.data?.slice(0, 3) || [], [leaderboardQuery.data]);
  const others = useMemo(() => leaderboardQuery.data?.slice(3) || [], [leaderboardQuery.data]);

  const pointLabel = isFemale ? "بتلة علمية 🌸" : "أوسمة تقنية 🛡️";

  if (leaderboardQuery.isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isFemale ? 'bg-[#fff0f6]' : 'bg-[#020617]'}`}>
        <Loader2 className={`h-12 w-12 animate-spin ${isFemale ? 'text-pink-500' : 'text-blue-500'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 pb-20 ${isFemale ? 'bg-[#fff0f6]' : 'bg-[#020617]'}`} dir="rtl">
      {/* Background Orbs */}
      <div className={`fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${isFemale ? 'bg-pink-400' : 'bg-blue-600'}`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${isFemale ? 'bg-rose-400' : 'bg-purple-600'}`} />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 flex justify-between items-center relative z-10">
        <Button 
          variant="outline" 
          onClick={() => navigate("/files")} 
          className={`backdrop-blur-xl border-white/20 rounded-2xl flex items-center gap-2 font-black ${isFemale ? 'bg-white/40 text-pink-600 border-pink-100' : 'bg-white/5 text-white border-white/10'}`}
        >
          <ChevronRight />
          الأرشيف
        </Button>
        <div className="text-center">
          <h1 className={`text-5xl font-black mb-2 tracking-tighter ${isFemale ? 'text-pink-600' : 'text-white'}`}>لوحة الصدارة</h1>
          <p className={`font-black text-xs uppercase tracking-[0.3em] ${isFemale ? 'text-pink-400' : 'text-blue-400'}`}>أفضل مساهمي الأرشيف الأكاديمي</p>
        </div>
        <div className="w-24" /> {/* Spacer */}
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
              <Card className={`backdrop-blur-3xl border-2 rounded-[3rem] p-8 text-center relative ${isFemale ? 'bg-white/60 border-gray-200' : 'bg-white/5 border-gray-500/30'}`}>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-gray-400 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                  <Medal className="text-white" size={40} />
                </div>
                <h3 className={`text-xl font-black mb-1 mt-4 ${isFemale ? 'text-pink-900' : 'text-white'}`}>{topThree[1].fullName}</h3>
                <div className="flex justify-center mb-2">
                  <ReputationBadge points={topThree[1].petals} />
                </div>
                <p className={`text-2xl font-black ${isFemale ? 'text-pink-500' : 'text-blue-400'}`}>
                  {topThree[1].petals} <span className="text-xs">{pointLabel}</span>
                </p>
                <div className="mt-4 text-[10px] font-black opacity-50 uppercase tracking-widest">المراكز الفضية</div>
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
              <Card className={`backdrop-blur-3xl border-4 rounded-[4rem] p-12 text-center relative overflow-hidden ${isFemale ? 'bg-white/80 border-yellow-400 shadow-yellow-500/20 shadow-2xl' : 'bg-white/10 border-yellow-500/50 shadow-yellow-500/10 shadow-2xl'}`}>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"
                />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-24 bg-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                  <Crown className="text-white" size={48} />
                </div>
                <h3 className={`text-3xl font-black mb-2 mt-6 ${isFemale ? 'text-pink-900' : 'text-white'}`}>{topThree[0].fullName}</h3>
                <div className="flex justify-center mb-3">
                  <ReputationBadge points={topThree[0].petals} />
                </div>
                <p className={`text-4xl font-black ${isFemale ? 'text-pink-600' : 'text-yellow-400'}`}>
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
              <Card className={`backdrop-blur-3xl border-2 rounded-[3rem] p-8 text-center relative ${isFemale ? 'bg-white/60 border-orange-200' : 'bg-white/5 border-orange-500/30'}`}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                  <Star className="text-white" size={32} />
                </div>
                <h3 className={`text-lg font-black mb-1 mt-4 ${isFemale ? 'text-pink-900' : 'text-white'}`}>{topThree[2].fullName}</h3>
                <div className="flex justify-center mb-2">
                  <ReputationBadge points={topThree[2].petals} />
                </div>
                <p className={`text-xl font-black ${isFemale ? 'text-pink-500' : 'text-blue-400'}`}>
                  {topThree[2].petals} <span className="text-xs">{pointLabel}</span>
                </p>
                <div className="mt-4 text-[10px] font-black opacity-50 uppercase tracking-widest">المركز البرونزي</div>
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
              <Card className={`backdrop-blur-xl border p-6 rounded-[2rem] flex items-center justify-between transition-all hover:scale-[1.02] ${isFemale ? 'bg-white/40 border-pink-100' : 'bg-white/[0.03] border-white/10'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${isFemale ? 'bg-pink-100 text-pink-500' : 'bg-white/5 text-blue-400'}`}>
                    #{idx + 4}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-black text-lg ${isFemale ? 'text-pink-900' : 'text-white'}`}>{student.fullName}</h4>
                      <ReputationBadge points={student.petals} showLabel={false} />
                    </div>
                    <p className="text-[10px] font-bold opacity-40">{student.studentID}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`text-2xl font-black ${isFemale ? 'text-pink-500' : 'text-blue-400'}`}>{student.petals}</span>
                  <span className="text-[10px] font-black mr-2 opacity-50 uppercase tracking-widest">{isFemale ? "بتلة" : "وسام"}</span>
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
          className={`mt-32 p-12 rounded-[4rem] text-center border-2 border-dashed ${isFemale ? 'bg-pink-500/5 border-pink-200' : 'bg-blue-500/5 border-blue-500/20'}`}
        >
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ${isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'}`}>
             {isFemale ? <Flower size={40} /> : <Shield size={40} />}
          </div>
          <h2 className={`text-3xl font-black mb-4 ${isFemale ? 'text-pink-600' : 'text-white'}`}>هل تريد أن يخلد اسمك هنا؟</h2>
          <p className={`text-lg font-bold mb-10 max-w-xl mx-auto ${isFemale ? 'text-pink-900/60' : 'text-white/40'}`}>
            ساهم مع زملائك برفع أفضل ما لديك من ملخصات وامتحانات، واجمع المزيد من {isFemale ? "البتلات العلمية" : "الأوسمة التقنية"} لتتصدر القائمة!
          </p>
          <Button 
            onClick={() => navigate("/upload")}
            className={`h-20 px-12 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 ${isFemale ? 'bg-pink-500 text-white shadow-pink-500/30' : 'bg-blue-600 text-white shadow-blue-600/30'}`}
          >
            <Upload className="ml-3 h-6 w-6" />
            ابدأ المساهمة الآن
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
