import { useLocation } from "wouter";
import { LayoutGrid, Upload, User, Trophy, Sparkles } from "lucide-react";
import { useGender } from "@/contexts/GenderContext";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { genderTheme } = useGender();
  const { user } = useAuth();
  
  if (!user || ["/", "/login", "/register", "/onboarding"].includes(location)) return null;

  const isFemale = genderTheme === 'female';

  const navItems = [
    { icon: LayoutGrid, label: "الأرشيف", path: "/files" },
    { icon: Trophy, label: "الصدارة", path: "/leaderboard" },
    { icon: Upload, label: "رفع", path: "/upload", center: true },
    { icon: Sparkles, label: "المواد", path: "/courses" },
    { icon: User, label: "حسابي", path: "/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
      <div className={`backdrop-blur-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-2 flex justify-around items-center relative ${
        isFemale ? 'bg-white/80 border-pink-100' : 'bg-black/60 border-white/10'
      }`}>
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          if (item.center) {
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center -mt-10 shadow-2xl transition-all ${
                  isFemale ? 'bg-pink-500 text-white shadow-pink-500/40' : 'bg-blue-600 text-white shadow-blue-500/40'
                }`}
              >
                <Icon size={28} strokeWidth={2.5} />
              </motion.button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 p-2 relative"
            >
              <Icon 
                size={22} 
                className={`transition-all duration-300 ${
                  isActive 
                    ? isFemale ? 'text-pink-600 scale-110' : 'text-blue-500 scale-110' 
                    : 'text-muted-foreground opacity-60'
                }`} 
              />
              <span className={`text-[9px] font-black uppercase tracking-tighter ${
                isActive 
                  ? isFemale ? 'text-pink-600' : 'text-blue-500' 
                  : 'text-muted-foreground opacity-40'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className={`absolute -bottom-1 w-1 h-1 rounded-full ${isFemale ? 'bg-pink-500' : 'bg-blue-500'}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
