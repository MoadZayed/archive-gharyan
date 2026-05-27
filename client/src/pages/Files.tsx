import { useState, useMemo, useRef, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { PROFESSORS, COURSES } from "@/constants/academicData";
import { 
  Download, 
  Trash2, 
  Upload, 
  LogOut, 
  CheckCircle, 
  Loader2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Languages, 
  ArrowBigUp, 
  ArrowBigDown, 
  User, 
  ChevronDown, 
  Search, 
  X,
  Heart,
  Star,
  Bookmark,
  Sparkles,
  LayoutGrid,
  Flower,
  Box,
  Pencil,
  AlertTriangle,
  Trophy,
  Filter,
  Plus,
  PlusCircle,
  FileText,
  Flag,
  Megaphone
} from "lucide-react";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import DoorTransition from "@/components/DoorTransition";
import ReputationBadge from "@/components/ReputationBadge";
import Navbar from "@/components/Navbar";
import { Eye, Calendar, Bookmark as BookmarkIcon, Download as DownloadIcon, ChevronRight, ArrowRight, TrendingUp } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import FilePreviewModal from "@/components/FilePreviewModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";


export default function Files() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  
  useDocumentTitle("الأرشيف الأكاديمي");

  // Pull to Refresh Logic
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDrag = (_: any, info: any) => {
    if (window.scrollY === 0 && info.offset.y > 0) {
      setPullY(info.offset.y);
    }
  };

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.y > 100 && window.scrollY === 0) {
      setIsRefreshing(true);
      await filesQuery.refetch();
      setIsRefreshing(false);
    }
    setPullY(0);
  };

  const [searchInput, setSearchInput] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [searchQuery, setSearchQuery] = useState(searchInput);
  const [selectedType, setSelectedType] = useState<string>(() => new URLSearchParams(window.location.search).get("type") || "");
  const [selectedYear, setSelectedYear] = useState<string>(() => new URLSearchParams(window.location.search).get("year") || "");
  const [activeTab, setActiveTab] = useState<"current" | "all" | "favorites" | "my_uploads">(() => (new URLSearchParams(window.location.search).get("tab") as any) || "all");
  const [sortBy, setSortBy] = useState<string>(() => new URLSearchParams(window.location.search).get("sort") || "newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => (localStorage.getItem("filesViewMode") as any) || "grid");
  
  // URL sync effect
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedType) params.set("type", selectedType);
    if (selectedYear) params.set("year", selectedYear);
    if (activeTab !== "all") params.set("tab", activeTab);
    if (sortBy !== "newest") params.set("sort", sortBy);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, selectedType, selectedYear, activeTab, sortBy]);

  // View mode persistence
  useEffect(() => {
    localStorage.setItem("filesViewMode", viewMode);
  }, [viewMode]);
  
  // Security & Actions State
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [fileToEdit, setFileToEdit] = useState<any | null>(null);
  const [showDoor, setShowDoor] = useState(false);
  const [pendingDownloadUrl, setPendingDownloadUrl] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Announcements Logic
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
    } catch {
      return [];
    }
  });

  const { data: announcements } = trpc.announcements.getAll.useQuery(undefined, { enabled: !!user });

  const activeAnnouncements = useMemo(() => {
    return announcements?.filter(a => !dismissedAnnouncements.includes(a.id)) || [];
  }, [announcements, dismissedAnnouncements]);

  const dismissAnnouncement = (id: number) => {
    const next = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(next);
    localStorage.setItem("dismissed_announcements", JSON.stringify(next));
  };
  const [fileDetailsToShow, setFileDetailsToShow] = useState<any>(null);

  const trpcContext = trpc.useContext();
  const incrementViewsMutation = trpc.files.incrementViews.useMutation();

  const enrolledSubjectNames = useMemo(() => {
    if (!user?.enrolledCourses) return [];
    try {
      const courses = typeof user.enrolledCourses === 'string' 
        ? JSON.parse(user.enrolledCourses) 
        : user.enrolledCourses;
      if (!Array.isArray(courses)) return [];
      
      // Extract both code and name to match database subjects
      return courses.flatMap((c: any) => {
        if (typeof c === 'string') {
          const parts = c.split(" - ");
          return parts.length > 1 ? [parts[0].trim(), parts[1].trim()] : [c.trim()];
        }
        const name = c.name || c.title || "";
        return [name.trim()];
      }).filter(Boolean);
    } catch {
      return [];
    }
  }, [user?.enrolledCourses]);

  const observerTarget = useRef(null);

  const filesQuery = trpc.files.list.useQuery({ 
    search: searchQuery,
    fileType: selectedType || undefined,
    year: (selectedYear && !isNaN(parseInt(selectedYear))) ? parseInt(selectedYear) : undefined,
    subject: selectedSubject || undefined,
    subjects: activeTab === "current" ? (enrolledSubjectNames.length > 0 ? enrolledSubjectNames.join(",") : "_NONE_") : undefined,
    doctorName: selectedDoctor || undefined,
    limit: 12,
    offset: offset
  });

  // Effect to append files when offset changes or query succeeds
  useEffect(() => {
    if (filesQuery.data && Array.isArray(filesQuery.data)) {
      if (filesQuery.data.length < 12) {
        setCanLoadMore(false);
      } else {
        setCanLoadMore(true);
      }

      if (offset === 0) {
        setAllFiles(filesQuery.data);
      } else {
        setAllFiles(prev => {
          if (!Array.isArray(prev)) return filesQuery.data || [];
          const existingIds = new Set(prev.map(f => f?.id).filter(Boolean));
          const newFiles = filesQuery.data!.filter(f => f && !existingIds.has(f.id));
          return [...prev, ...newFiles];
        });
      }
    }
  }, [filesQuery.data, offset]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && canLoadMore && !filesQuery.isFetching) {
          setOffset(prev => prev + 12);
        }
      },
      { threshold: 1.0 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [canLoadMore, filesQuery.isFetching]);

  const favoritesQuery = trpc.files.getFavorites.useQuery(undefined, {
    enabled: activeTab === "favorites"
  });

  const myFilesQuery = trpc.files.myFiles.useQuery(undefined, {
    enabled: activeTab === "my_uploads"
  });



  const filteredFiles = useMemo(() => {
    let files: any[] = [];
    if (activeTab === "favorites") {
      files = favoritesQuery.data || [];
    } else if (activeTab === "my_uploads") {
      files = myFilesQuery.data || [];
      // STRICT frontend filter to ensure ONLY user contributions are shown
      files = files.filter(f => f && user?.studentDbId && f.uploadedByStudentID === user.studentDbId);
    } else {
      files = allFiles;
    }
    
    // Safety frontend filter for "current" tab in case backend didn't filter perfectly
    if (activeTab === "current" && enrolledSubjectNames.length > 0) {
      files = files.filter(f => 
        f && f.subject && enrolledSubjectNames.some(name => {
          if (!name) return false;
          const s = f.subject.toLowerCase().trim();
          const n = name.toLowerCase().trim();
          return s.includes(n) || n.includes(s);
        })
      );
    }
    
    // Sort logic
    if (sortBy === "oldest") {
      files.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "most_downloaded") {
      files.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sortBy === "alphabetical") {
      files.sort((a, b) => a.fileName.localeCompare(b.fileName, 'ar'));
    } else {
      // newest (default)
      files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return files;
  }, [allFiles, favoritesQuery.data, myFilesQuery.data, activeTab, enrolledSubjectNames, user?.studentDbId, sortBy]);

  // Mutations
  const deleteFileMutation = trpc.files.delete.useMutation({
    onMutate: async ({ fileId }) => {
      await trpcContext.files.list.cancel();
      await trpcContext.files.myFiles.cancel();
      
      const previousFiles = trpcContext.files.list.getData();
      
      setAllFiles(prev => prev.filter(f => f.id !== fileId));
      
      return { previousFiles };
    },
    onError: (err, newFile, context: any) => {
      toast.error("فشل حذف الملف، يرجى المحاولة مرة أخرى");
      if (context?.previousFiles) {
        trpcContext.files.list.setData(undefined, context.previousFiles);
      }
    },
    onSuccess: () => {
      setFileToDelete(null);
      toast.success("تم حذف الملف نهائياً بنجاح");
    },
    onSettled: () => {
      filesQuery.refetch();
      favoritesQuery.refetch();
      myFilesQuery.refetch();
    }
  });

  const toggleFavoriteMutation = trpc.files.toggleFavorite.useMutation({
    onMutate: async ({ fileId }) => {
      await trpcContext.files.list.cancel();
      await trpcContext.files.getFavorites.cancel();

      const previousFiles = trpcContext.files.list.getData();
      const previousFavorites = trpcContext.files.getFavorites.getData();

      setAllFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { ...f, isFavorite: !f.isFavorite };
        }
        return f;
      }));

      return { previousFiles, previousFavorites };
    },
    onError: (err, newFile, context: any) => {
      toast.error("تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت");
      if (context?.previousFiles) {
        trpcContext.files.list.setData(undefined, context.previousFiles);
      }
      if (context?.previousFavorites) {
        trpcContext.files.getFavorites.setData(undefined, context.previousFavorites);
      }
    },
    onSuccess: (data) => {
      toast.success(data.isFavorite ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة");
    },
    onSettled: () => {
      filesQuery.refetch();
      favoritesQuery.refetch();
    }
  });

  const reportFileMutation = trpc.files.report.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      filesQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const editFileMutation = trpc.files.edit.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات الملف بنجاح");
      setFileToEdit(null);
      filesQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setOffset(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const downloadMutation = trpc.files.download.useMutation({
    onSuccess: (data) => {
      try {
        if (data.url) {
          setShowDoor(true);
          setPendingDownloadUrl(data.url);
          
          // Wait for the door animation to "feel" right, then trigger download
          setTimeout(() => {
            try {
              const link = document.createElement('a');
              link.href = data.url;
              link.setAttribute('download', data.fileName || 'file');
              link.setAttribute('target', '_blank');
              link.setAttribute('rel', 'noopener noreferrer');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (clickErr) {
              console.error("Download trigger failed:", clickErr);
              window.open(data.url, '_blank');
            }

            setTimeout(() => {
              setShowDoor(false);
              setPendingDownloadUrl(null);
            }, 1000); // Keep doors open for a bit
          }, 1500);
        } else {
          toast.error("عذراً، لم نتمكن من الحصول على رابط الملف حالياً.");
        }
      } catch (err) {
        console.error("Download handling error:", err);
        toast.error("حدث خطأ أثناء محاولة بدء التنزيل");
      }
    },
    onError: (err) => {
      console.error("Download Mutation Error:", err);
      toast.error(err.message || "عذراً، الملف غير متوفر أو الرابط منتهي الصلاحية");
    }
  });



  const handleLogout = async () => {
    await logout().catch((err: any) => console.error("Logout failed:", err));
    navigate("/login", { replace: true });
  };

  const handleDownload = (fileId: number, fileName: string) => {
    const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:4001").replace(/\/+$/, "");
    const url = `${backendUrl}/api/files/download/${fileId}`;
    
    // Create a temporary link element to force download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("بدء التحميل...");
  };

  if (!user) return null;

  return (
    <motion.div 
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      className={`min-h-screen transition-colors duration-500 overflow-x-hidden pb-[80px] md:pb-0`}
      dir="rtl"
    >
      <AnimatePresence>
        {(pullY > 20 || isRefreshing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 80 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <div className={`p-3 rounded-full shadow-2xl bg-[var(--accent-primary)] text-white`}>
              <Loader2 className={`h-6 w-6 animate-spin`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DoorTransition isVisible={showDoor} />
      
      {/* Background Decoration (Orbs) */}
      <div 
        className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />
      <div 
        className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,91,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />

      <div className="w-full px-4 md:px-12 relative z-10 pb-[100px] md:pb-10">
        <div className="hidden md:block mt-6">
          <Navbar />
        </div>

        {/* Announcements Banner */}
        {activeAnnouncements.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {activeAnnouncements.map((ann) => (
              <div 
                key={ann.id} 
                className="flex items-start justify-between p-4 rounded-2xl text-white shadow-lg relative overflow-hidden"
                style={{ background: 'linear-gradient(to left, #ff4081, #e91e63)' }}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="h-6 w-6 shrink-0 opacity-80" />
                  <div>
                    {ann.title && <h3 className="font-bold text-lg">{ann.title}</h3>}
                    <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>
                </div>
                <button 
                  onClick={() => dismissAnnouncement(ann.id)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full md:pt-[100px] md:pb-[40px] mt-[24px] md:mt-0 gap-6">
          <div className="w-full flex flex-col items-center md:items-start text-center md:text-right gap-3">
            <h1 className="text-[32px] md:text-[56px] font-[900] tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to left, #ffffff, #ff4081)' }}>
              الأرشيف الأكاديمي
            </h1>
            <p className="text-[15px] md:text-[20px] font-medium" style={{ color: 'var(--text-muted)' }}>
              تصفح وشارك المصادر الأكاديمية مع زملائك في بيئة تعليمية متكاملة
            </p>
          </div>
          
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            <Button 
              onClick={() => navigate("/upload")}
              className="w-[calc(100%-32px)] md:w-[240px] h-[56px] rounded-[14px] font-bold text-[16px] flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(233,30,99,0.3)]"
              style={{ background: 'var(--button-gradient)', color: 'white', border: 'none' }}
            >
              <Upload size={22} />
              رفع ملف جديد
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="w-full mb-8 md:mb-12">
          <div className="relative w-full">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6" style={{ color: 'var(--text-muted)' }} />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في كافة ملفات المنصة..."
              className="w-full h-[56px] md:h-[64px] pr-14 pl-4 rounded-[16px] text-[16px] outline-none border transition-all text-right focus:ring-0 shadow-sm"
              style={{ 
                backgroundColor: 'var(--glass-white)', 
                borderColor: 'var(--border-pink)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(233,30,99,0.3)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-10 sticky top-[56px] md:top-[70px] z-30 py-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex flex-col gap-[20px] w-full">
            {/* Category Tabs */}
            <div className="flex items-center gap-[12px] w-full overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { id: "all", label: "الأرشيف", icon: <LayoutGrid size={18} /> },
                { id: "current", label: "موادي", icon: <Sparkles size={18} /> },
                { id: "my_uploads", label: "مساهماتي", icon: <Upload size={18} /> },
                { id: "favorites", label: "المفضلة", icon: <Star size={18} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setOffset(0); }}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[15px] font-bold whitespace-nowrap transition-all duration-300 border ${
                    activeTab === tab.id 
                      ? 'text-white border-transparent shadow-[0_4px_15px_rgba(233,30,99,0.3)]' 
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-pink)] hover:bg-[var(--glass-white)]'
                  }`}
                  style={activeTab === tab.id ? { background: 'var(--button-gradient)' } : {}}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] w-full">
              <select 
                value={selectedType} 
                onChange={e => { setSelectedType(e.target.value); setOffset(0); }}
                className="w-full h-[48px] md:h-[52px] rounded-[12px] px-4 text-[15px] outline-none appearance-none cursor-pointer font-medium"
                style={{ backgroundColor: 'var(--glass-white)', border: '1px solid var(--border-pink)', color: 'var(--text-primary)' }}
              >
                <option value="" className="bg-[#2d1020]">كافة الأنواع</option>
                <option value="exam_mid" className="bg-[#2d1020]">نصفي</option>
                <option value="exam_final" className="bg-[#2d1020]">نهائي</option>
                <option value="summary" className="bg-[#2d1020]">ملخص</option>
                <option value="curriculum" className="bg-[#2d1020]">منهج</option>
              </select>

              <select 
                value={selectedYear} 
                onChange={e => { setSelectedYear(e.target.value); setOffset(0); }}
                className="w-full h-[48px] md:h-[52px] rounded-[12px] px-4 text-[15px] outline-none appearance-none cursor-pointer font-medium"
                style={{ backgroundColor: 'var(--glass-white)', border: '1px solid var(--border-pink)', color: 'var(--text-primary)' }}
              >
                <option value="" className="bg-[#2d1020]">كافة السنين</option>
                {Array.from({ length: 6 }, (_, i) => 2020 + i).map(y => (
                  <option key={y} value={y} className="bg-[#2d1020]">{y}</option>
                ))}
              </select>

              {activeTab === "all" ? (
                <>
                  <select 
                    value={selectedSubject} 
                    onChange={e => { setSelectedSubject(e.target.value); setOffset(0); }}
                    className="w-full h-[48px] md:h-[52px] rounded-[12px] px-4 text-[15px] outline-none appearance-none cursor-pointer font-medium"
                    style={{ backgroundColor: 'var(--glass-white)', border: '1px solid var(--border-pink)', color: 'var(--text-primary)' }}
                  >
                    <option value="" className="bg-[#2d1020]">كافة المواد</option>
                    {COURSES.map(c => (
                      <option key={c.code} value={c.name} className="bg-[#2d1020]">{c.name}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedDoctor} 
                    onChange={e => { setSelectedDoctor(e.target.value); setOffset(0); }}
                    className="w-full h-[48px] md:h-[52px] rounded-[12px] px-4 text-[15px] outline-none appearance-none cursor-pointer font-medium"
                    style={{ backgroundColor: 'var(--glass-white)', border: '1px solid var(--border-pink)', color: 'var(--text-primary)' }}
                  >
                    <option value="" className="bg-[#2d1020]">كافة الدكاترة</option>
                    {PROFESSORS.map(p => (
                      <option key={p} value={p} className="bg-[#2d1020]">{p}</option>
                    ))}
                  </select>
                </>
              ) : (
                 <>
                   <div className="hidden lg:block w-full"></div>
                   <div className="hidden lg:block w-full"></div>
                 </>
              )}
            </div>

            {/* Sort & View Options */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 pt-2">
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-[40px] rounded-[10px] px-3 text-[14px] outline-none appearance-none cursor-pointer font-medium"
                  style={{ backgroundColor: 'var(--glass-white)', border: '1px solid var(--border-pink)', color: 'var(--text-primary)' }}
                >
                  <option value="newest" className="bg-[#2d1020]">الأحدث</option>
                  <option value="oldest" className="bg-[#2d1020]">الأقدم</option>
                  <option value="most_downloaded" className="bg-[#2d1020]">الأكثر تحميلاً</option>
                  <option value="alphabetical" className="bg-[#2d1020]">أبجدي (أ-ي)</option>
                </select>
                <div className="flex items-center rounded-lg border overflow-hidden h-[40px]" style={{ borderColor: 'var(--border-pink)' }}>
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={`px-3 h-full flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--glass-white)] text-[var(--text-muted)] hover:text-white'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`px-3 h-full flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--glass-white)] text-[var(--text-muted)] hover:text-white'}`}
                  >
                    <Menu size={16} />
                  </button>
                </div>
              </div>
              <div className="text-sm font-bold opacity-70" style={{ color: 'var(--text-muted)' }}>
                {filteredFiles.length} ملفات متوفرة
              </div>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        {(filesQuery.isLoading || favoritesQuery.isLoading || myFilesQuery.isLoading) ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'grid-cols-1'} gap-[16px] lg:gap-[24px]`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="gita-card min-h-[220px] p-6 flex flex-col justify-between animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-8 bg-white/10 rounded-full"></div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                    <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-4 my-6">
                  <div className="h-5 w-3/4 bg-white/10 rounded-full"></div>
                  <div className="h-3 w-1/2 bg-white/10 rounded-full"></div>
                </div>
                <div className="flex gap-3 mt-auto pt-3 border-t border-white/5">
                  <div className="h-11 w-11 bg-white/10 rounded-full"></div>
                  <div className="h-11 flex-1 bg-white/10 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]' : 'grid-cols-1'} gap-[16px] lg:gap-[24px]`}>
            {filteredFiles.map((file: any) => {
              const isOwner = file.uploadedByStudentID === user.studentDbId || user.isAdmin;
              
              return (
                <article
                  key={file.id}
                  className={`gita-card flex ${viewMode === 'grid' ? 'flex-col min-h-[200px]' : 'flex-row items-center min-h-[100px]'} justify-between p-5 lg:p-6 relative group transition-all duration-300 hover:-translate-y-2 cursor-pointer`}
                  style={{ direction: 'rtl', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                  onClick={() => {
                     setPreviewFile(file);
                     incrementViewsMutation.mutate({ fileId: file.id });
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 30px rgba(233,30,99,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'}
                >
                  {/* Top Section */}
                  <div className={`flex justify-between items-start ${viewMode === 'list' ? 'flex-col gap-2 w-1/4' : 'mb-4'}`}>
                    <div className="flex flex-col gap-2 items-start">
                      {/* File Type Badge */}
                      <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold" style={{ backgroundColor: 'rgba(233,30,99,0.15)', color: 'var(--accent-secondary)' }}>
                        <FileText size={14} />
                        <span>{file.fileType === 'exam_mid' ? 'نصفي' : file.fileType === 'exam_final' ? 'نهائي' : file.fileType === 'summary' ? 'ملخص' : file.fileType === 'curriculum' ? 'منهج' : 'ملف'}</span>
                      </div>
                      
                      {/* Status Badge (Owner Only) */}
                      {isOwner && (
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          {file.status === 'pending' && (
                            <div className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-bold flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> قيد المراجعة
                            </div>
                          )}
                          {file.status === 'approved' && (
                            <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold flex items-center gap-1 opacity-70">
                              <CheckCircle className="w-3 h-3" /> منشور
                            </div>
                          )}
                          {file.status === 'rejected' && (
                            <div className="group relative">
                              <div className="px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold flex items-center gap-1 cursor-help">
                                <X className="w-3 h-3" /> مرفوض
                              </div>
                              <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 p-2 bg-red-950/90 border border-red-500/50 rounded-lg text-xs text-white z-20 shadow-xl">
                                <strong>سبب الرفض:</strong> {file.rejectionReason || 'غير محدد'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Top Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteMutation.mutate({ fileId: file.id });
                        }}
                        className="w-[44px] h-[44px] flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                        style={{ color: file.isFavorite ? 'var(--accent-primary)' : 'var(--text-muted)', backgroundColor: 'var(--glass-white)' }}
                      >
                        <Heart size={18} className={file.isFavorite ? "fill-current" : ""} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-[44px] h-[44px] flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--glass-white)' }}>
                            <Menu size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" style={{ backgroundColor: 'rgba(61,21,48,0.95)', backdropFilter: 'blur(30px)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
                          <DropdownMenuItem onClick={() => setFileToEdit(file)} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--glass-white)] h-[44px]">
                            <Pencil size={16} /> تعديل
                          </DropdownMenuItem>
                          {isOwner ? (
                            <DropdownMenuItem onClick={() => setFileToDelete(file.id)} className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-[var(--glass-white)] h-[44px]">
                              <Trash2 size={16} /> حذف
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => {
                                if (window.confirm("هل أنت متأكد من الإبلاغ عن هذا الملف؟")) {
                                   reportFileMutation.mutate({ fileId: file.id });
                                }
                              }} 
                              className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:bg-[var(--glass-white)] h-[44px]"
                            >
                              <Flag size={16} /> إبلاغ
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Middle Section */}
                  <div className={`flex-1 flex flex-col justify-center ${viewMode === 'grid' ? 'my-2' : 'px-4'}`}>
                    <h3 className="font-bold text-[16px] md:text-[18px] leading-[1.6] line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {file.subject}
                    </h3>
                    <p className="text-[13px] font-medium mt-2 truncate opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      {file.fileName}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <Download size={12} />
                        <span>{file.downloads || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <Eye size={12} />
                        <span>{file.views || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className={`flex gap-2 ${viewMode === 'grid' ? 'mt-auto border-t pt-4' : ''}`} style={{ borderColor: 'var(--glass-white)' }}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: 'var(--glass-white)', color: 'var(--text-primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = `${window.location.origin}/files?q=${encodeURIComponent(file.fileName)}`;
                              navigator.clipboard.writeText(link);
                              toast.success("تم نسخ الرابط إلى الحافظة بنجاح");
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#3d1530] text-white border-none shadow-xl text-xs">نسخ الرابط</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: 'var(--glass-white)', color: 'var(--text-primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.id, file.fileName);
                            }}
                          >
                            <Download size={18} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#3d1530] text-white border-none shadow-xl text-xs">تحميل</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: 'var(--glass-white)', color: 'var(--text-primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementViewsMutation.mutate({ fileId: file.id });
                              setPreviewFile(file);
                            }}
                          >
                            <Eye size={18} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#3d1530] text-white border-none shadow-xl text-xs">معاينة</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                            style={{ backgroundColor: 'var(--glass-white)', color: 'var(--text-primary)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileDetailsToShow(file);
                            }}
                          >
                            <CheckCircle size={18} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#3d1530] text-white border-none shadow-xl text-xs">التفاصيل</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </article>
              );
            })}
            </div>
            
            {/* Infinite Scroll Target */}
            {activeTab === "all" || activeTab === "current" ? (
              <div ref={observerTarget} className="flex justify-center mt-12 pb-20 w-full">
                {filesQuery.isFetching ? (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                     <Loader2 className="animate-spin" />
                     <span className="font-bold text-sm">جاري تحميل المزيد...</span>
                  </div>
                ) : !canLoadMore && allFiles.length > 0 ? (
                  <div className="font-bold text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    تم تحميل جميع الملفات
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}

      <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={() => {
          if (previewFile) {
            handleDownload(previewFile.id, previewFile.fileName);
          }
        }}
      />

        <Footer />
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={fileToDelete !== null} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent className="backdrop-blur-3xl border rounded-[3rem] p-10 max-w-md" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }} dir="rtl">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>تأكيد الحذف النهائي</DialogTitle>
            <DialogDescription className="font-bold py-4">
              هل أنت متأكد من حذف هذا الملف نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيختفي الملف من الأرشيف تماماً.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button variant="ghost" onClick={() => setFileToDelete(null)} className="flex-1 h-14 rounded-2xl font-black">تراجع</Button>
            <Button 
              onClick={() => deleteFileMutation.mutate({ fileId: fileToDelete! })} 
              className="flex-[2] h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/20"
            >
              {deleteFileMutation.isPending ? <Loader2 className="animate-spin" /> : "نعم، حذف الملف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!fileToEdit} onOpenChange={(open) => !open && setFileToEdit(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2rem] border p-6 backdrop-blur-xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }} dir="rtl">
          <DialogHeader className="p-0">
            <DialogTitle className="text-2xl font-black mb-1 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Pencil className="h-6 w-6" />
              تعديل بيانات الملف
            </DialogTitle>
            <DialogDescription className="font-bold opacity-60 text-xs">
              قم بتحديث معلومات الملف لضمان دقة البيانات لزملائك.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground px-2 uppercase">اسم الملف</label>
              <Input 
                value={fileToEdit?.fileName || ""} 
                onChange={e => setFileToEdit({...fileToEdit, fileName: e.target.value})}
                className="h-11 rounded-xl font-bold bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground px-2 uppercase">المادة</label>
                <select 
                  value={fileToEdit?.subject || ""} 
                  onChange={e => setFileToEdit({...fileToEdit, subject: e.target.value})}
                  className="w-full h-11 bg-background/50 border border-border rounded-xl px-2 text-sm font-bold outline-none"
                >
                  <option value="" className="text-slate-900 bg-white">اختر المادة...</option>
                  {COURSES.map(c => (
                    <option key={c.code} value={`${c.code} - ${c.name}`} className="text-slate-900 bg-white">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground px-2 uppercase">اسم الدكتور</label>
                <select 
                  value={fileToEdit?.doctorName || ""} 
                  onChange={e => setFileToEdit({...fileToEdit, doctorName: e.target.value})}
                  className="w-full h-11 bg-background/50 border border-border rounded-xl px-2 text-sm font-bold outline-none"
                >
                  <option value="" className="text-slate-900 bg-white">اختر الدكتور...</option>
                  {PROFESSORS.map(d => (
                    <option key={d} value={d} className="text-slate-900 bg-white">{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground px-2 uppercase">السنة</label>
                <Input 
                  type="number"
                  value={fileToEdit?.year || ""} 
                  onChange={e => setFileToEdit({...fileToEdit, year: parseInt(e.target.value)})}
                  className="h-11 rounded-xl font-bold bg-background/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground px-2 uppercase">نوع الملف</label>
                <select 
                  value={fileToEdit?.fileType || ""} 
                  onChange={e => setFileToEdit({...fileToEdit, fileType: e.target.value})}
                  className="w-full h-11 bg-background/50 border border-border rounded-xl px-2 text-sm font-bold outline-none"
                >
                  <option value="exam_mid" className="text-slate-900 bg-white">نصفي</option>
                  <option value="exam_final" className="text-slate-900 bg-white">نهائي</option>
                  <option value="summary" className="text-slate-900 bg-white">ملخص</option>
                  <option value="curriculum" className="text-slate-900 bg-white">منهج</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <Button 
              onClick={() => editFileMutation.mutate({
                fileId: fileToEdit.id,
                fileName: fileToEdit.fileName,
                subject: fileToEdit.subject,
                doctorName: fileToEdit.doctorName,
                year: fileToEdit.year,
                fileType: fileToEdit.fileType
              })}
              disabled={editFileMutation.isPending}
              className="w-full h-12 text-white font-black text-lg rounded-xl shadow-[0_10px_30px_rgba(233,30,99,0.3)] transition-all active:scale-95 border-none"
              style={{ background: 'var(--button-gradient)', color: 'white' }}
            >
              {editFileMutation.isPending ? <Loader2 className="animate-spin" /> : "حفظ التعديلات ✨"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setFileToEdit(null)}
              className="w-full h-10 font-bold opacity-60 hover:opacity-100"
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Details Modal */}
      <Dialog open={fileDetailsToShow !== null} onOpenChange={(open) => !open && setFileDetailsToShow(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-6 border" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>تفاصيل الملف</DialogTitle>
            <DialogDescription className="font-bold">
              معلومات إضافية حول الملف المختار.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <div className="px-4 py-2 rounded-full text-xs font-black border" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
              السنة: {fileDetailsToShow?.academicYear || "2024"}
            </div>
            <div className="px-4 py-2 rounded-full text-xs font-black border" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
              التنزيلات: {fileDetailsToShow?.downloads || 0}
            </div>
            <div className="px-4 py-2 rounded-full text-xs font-black border" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
              المشاهدات: {fileDetailsToShow?.views || 0}
            </div>
            <div className="px-4 py-2 rounded-full text-xs font-black border" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
              المساهم: {fileDetailsToShow?.uploadedBy || "زميل مجهول"}
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setFileDetailsToShow(null)} className="w-full h-12 rounded-2xl font-black">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
