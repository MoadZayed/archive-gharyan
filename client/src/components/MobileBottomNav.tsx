import { useLocation } from "wouter";
import { LayoutGrid, Upload, User, Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  if (!user || ["/", "/login", "/register", "/onboarding"].includes(location)) return null;

  const navItems = [
    { icon: LayoutGrid, label: "الأرشيف", path: "/files" },
    { icon: Trophy, label: "الصدارة", path: "/leaderboard" },
    { icon: Upload, label: "رفع", path: "/upload", center: true },
    { icon: Sparkles, label: "المواد", path: "/courses" },
    { icon: User, label: "حسابي", path: "/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full flex justify-around items-center backdrop-blur-3xl z-[100] px-4 pt-2 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" style={{ backgroundColor: 'rgba(26,10,15,0.9)', borderColor: 'rgba(233, 30, 99, 0.2)', height: 'calc(64px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }} dir="rtl">
      {navItems.map((item) => {
        const isActive = location === item.path;
        const Icon = item.icon;

        if (item.center) {
          return (
            <div key={item.path} className="relative -mt-[40px]">
              <motion.button
                whileTap={{ scale: 0.9 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                onClick={() => navigate(item.path)}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(233,30,99,0.4)] relative"
                style={{ background: 'var(--button-gradient)', color: 'white' }}
              >
                <div className="absolute inset-0 rounded-full border border-white/20"></div>
                <Icon size={28} strokeWidth={2.5} />
              </motion.button>
            </div>
          );
        }

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 p-2 relative w-[60px]"
          >
            <Icon 
              size={22} 
              className="transition-all duration-300"
              style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} 
            />
            <span className="text-xs font-medium tracking-tight mt-1" style={{ color: isActive ? 'var(--accent-primary)' : '#9ca3af' }}>
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="activeTabMobile"
                className="absolute -top-1 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
