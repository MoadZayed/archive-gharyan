import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Logo from "@/components/Logo";
import { 
  Sun, 
  Moon, 
  Flower, 
  Box, 
  Trophy, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut,
  Upload,
  CheckCircle2,
  BookOpen,
  Star
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("فشل تسجيل الخروج");
    }
  };

  if (!user) return null;

  const isVerified = user.verificationStatus === 'VERIFIED' || user.isAdmin;

  return (
    <header className="gita-nav fixed top-0 left-0 right-0 h-[56px] md:h-[70px] z-50 flex items-center justify-between px-4 md:px-12 w-full transition-all duration-300" dir="rtl">
      {/* Right Side: Logo */}
      <div className="flex items-center gap-3">
        <div className="h-[36px] w-[36px] md:h-[48px] md:w-[48px] rounded-[12px] md:rounded-[16px] flex items-center justify-center border shadow-[0_0_15px_rgba(233,30,99,0.2)]" style={{ borderColor: 'var(--border-pink)', backgroundColor: 'var(--glass-white)' }}>
           <Logo />
        </div>
        <span className="font-bold text-[16px] md:text-[18px] hidden sm:block" style={{ color: 'var(--text-primary)' }}>أرشيف <span style={{ color: 'var(--accent-primary)' }}>GITA</span></span>
      </div>

      {/* Center: Navigation Links (Desktop/Tablet) */}
      <nav className="hidden md:flex items-center gap-[24px] lg:gap-[32px]">
        {[
          { path: "/", label: "الأرشيف الرئيسي" },
          { path: "/leaderboard", label: "لوحة الصدارة" },
          { path: "/my-subjects", label: "موادي" },
        ].map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="text-[15px] font-medium transition-all relative group"
            style={{ color: location === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          >
            {link.label}
            <span className={`absolute -bottom-2 left-0 right-0 h-[2px] transition-all duration-300 ${location === link.path ? 'bg-[var(--accent-primary)] opacity-100' : 'bg-transparent opacity-0 group-hover:bg-[var(--text-muted)] group-hover:opacity-50'}`} />
          </button>
        ))}
      </nav>

      {/* Left Side: Upload Button & Menu */}
      <div className="flex items-center gap-4">
        {/* Desktop Theme Toggle */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        {isVerified ? (
          <Button 
            onClick={() => navigate("/upload")}
            className="hidden md:flex h-[40px] px-6 rounded-full font-bold text-[14px] items-center gap-2 transition-transform hover:scale-105 gita-btn-primary border-none shadow-[0_0_15px_rgba(233,30,99,0.3)]"
            style={{ background: 'var(--button-gradient)', color: 'white' }}
          >
            <Upload size={16} />
            رفع ملف
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:inline-block">
                  <Button disabled className="h-[40px] px-6 rounded-full font-bold text-[14px] items-center gap-2 opacity-50 bg-[#3d1530] text-white">
                    <Upload size={16} />
                    رفع ملف
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-yellow-500 text-white font-bold text-xs border-none">
                في انتظار الاعتماد
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border shadow-[0_0_10px_rgba(255,255,255,0.05)]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[14px] font-bold text-white">{user.petals || 0}</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
             <button className="md:hidden h-[40px] w-[40px] rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-[0_0_10px_rgba(255,255,255,0.05)]" style={{ backgroundColor: 'var(--glass-white)', color: 'var(--text-primary)' }}>
               <Menu size={20} />
             </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r shadow-2xl z-[100]" style={{ backgroundColor: 'rgba(26,10,15,0.95)', backdropFilter: 'blur(30px)', borderColor: 'var(--border-pink)' }}>
            <SheetHeader className="mb-8">
              <SheetTitle className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>القائمة الجانبية</SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col gap-3 h-full">
              <div className="p-4 rounded-3xl border mb-4" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--glass-white)' }}>
                <div className="flex items-center gap-4 mb-4">
                   <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'var(--button-gradient)', color: 'white' }}>
                     <UserIcon size={24} />
                   </div>
                  <div>
                    <p className="font-black text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{user.fullName}</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{user.studentID}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-black" style={{ color: 'var(--text-secondary)' }}>رصيدك الحالي:</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{user.petals || 0} نجمة</span>
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-pink)' }}>
                <ThemeToggle className="w-full justify-between" />
              </div>

              <div className="space-y-2 mt-2">
                <Button onClick={() => navigate("/leaderboard")} variant="ghost" className="w-full h-14 justify-start rounded-2xl font-black gap-4 px-6 hover:bg-white/10" style={{ color: 'var(--text-primary)' }}>
                  <Trophy size={20} className="text-yellow-500" />
                  لوحة الصدارة
                </Button>
                <Button onClick={() => navigate("/my-subjects")} variant="ghost" className="w-full h-14 justify-start rounded-2xl font-black gap-4 px-6 hover:bg-white/10" style={{ color: 'var(--text-primary)' }}>
                  <BookOpen size={20} className="text-blue-500" />
                  موادي الدراسية
                </Button>
                <Button onClick={() => navigate("/profile")} variant="ghost" className="w-full h-14 justify-start rounded-2xl font-black gap-4 px-6 hover:bg-white/10" style={{ color: 'var(--text-primary)' }}>
                  <UserIcon size={20} className="text-indigo-500" />
                  بروفيلي الشخصي
                </Button>
                
                {user.isAdmin && (
                  <Button onClick={() => navigate("/admin")} className="w-full h-14 justify-start rounded-2xl font-black gap-4 px-6 bg-violet-600/20 text-violet-400 hover:bg-violet-600/30">
                    <ShieldCheck size={20} />
                    لوحة الإدارة
                  </Button>
                )}
              </div>

              <div className="mt-auto pb-10">
                <Button onClick={handleLogout} variant="destructive" className="w-full h-14 rounded-2xl font-black gap-4 shadow-lg shadow-red-500/20">
                  <LogOut size={20} />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
