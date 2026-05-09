import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useGender } from "@/contexts/GenderContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { genderTheme, toggleGender } = useGender();
  const [location, navigate] = useLocation();

  const isFemale = genderTheme === 'female';

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
    <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
      <div className="flex items-center gap-6">
        <Logo />
        <div className="hidden md:block">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isFemale ? 'bg-pink-500' : 'bg-green-500'}`} />
              <p className={`font-black ${isFemale ? 'text-pink-900/70' : 'text-muted-foreground'}`}>أهلاً بك، {user.fullName}</p>
              {user.verificationStatus === 'VERIFIED' && (
                <span className="text-blue-500 shrink-0" title="حساب موثق">
                  <CheckCircle2 size={16} fill="currentColor" className="text-white fill-blue-500" />
                </span>
              )}
            </div>
            {user.verificationStatus === 'PENDING' && (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full text-[9px] font-black w-fit border border-yellow-500/20">
                <span>قيد المراجعة</span>
                <span className="animate-pulse">⏳</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center md:justify-end gap-2 bg-card/40 backdrop-blur-3xl p-3 rounded-[2rem] border border-border/50 shadow-xl w-full md:w-auto">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-10 w-10">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button onClick={toggleGender} variant="ghost" size="icon" className={`rounded-xl h-10 w-10 ${isFemale ? 'bg-pink-500 text-white' : ''}`}>
          {isFemale ? <Flower size={18} /> : <Box size={18} />}
        </Button>
        <div className="hidden sm:block w-[1px] h-8 bg-border/50 mx-1 self-center" />
        
        <Button onClick={() => navigate("/leaderboard")} variant="outline" className={`rounded-xl border-border/50 flex gap-2 font-black px-3 h-10 text-[10px] ${isFemale ? 'bg-white/50 hover:bg-pink-100 text-pink-900' : ''}`}>
          <Trophy size={14} />
          لوحة الصدارة
        </Button>
        
        <Button onClick={() => navigate("/profile")} variant="outline" className="rounded-xl font-black px-3 h-10 text-[10px]">
          <UserIcon className="h-4 w-4" />
          بروفيلي
        </Button>
        
        {user.isAdmin && (
          <Button onClick={() => navigate("/admin")} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black px-3 h-10 text-[10px]">
            <ShieldCheck size={14} className="mr-1" />
            الإدارة
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button 
                  onClick={() => navigate("/upload")} 
                  disabled={!isVerified}
                  className={`rounded-xl font-black px-4 h-10 text-[10px] shadow-lg transition-all ${
                    isFemale ? 'bg-pink-500 text-white shadow-pink-500/20' : 'bg-primary text-primary-foreground shadow-primary/20'
                  }`}
                >
                  <Upload size={14} className="mr-2" />
                  رفع ملف
                </Button>
              </div>
            </TooltipTrigger>
            {!isVerified && (
              <TooltipContent className="font-black text-[10px] bg-yellow-500 text-white border-none shadow-xl">
                سيتم تفعيل هذه الميزة فور اعتماد حسابك من قبل الإدارة
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <Button onClick={handleLogout} variant="destructive" className="rounded-xl h-10 w-10">
          <LogOut size={18} />
        </Button>
      </div>
    </div>
  );
}
