import { useState, useMemo, useRef, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Cloud, Stars } from "@react-three/drei";
import * as THREE from "three";
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
  Flag
} from "lucide-react";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import { useGender } from "@/contexts/GenderContext";
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
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// 3D Butterfly for Dashboard
function DashboardButterfly({ color, delay }: { color: string, delay: number }) {
  const ref = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + delay;
    if (ref.current) {
      ref.current.position.x = Math.sin(t * 0.5) * 8;
      ref.current.position.y = Math.cos(t * 0.3) * 5;
      ref.current.position.z = Math.sin(t * 0.2) * 4;
      ref.current.rotation.z = Math.sin(t * 2) * 0.2;
    }
    if (leftWing.current && rightWing.current) {
      const flap = Math.sin(t * 15) * 1;
      leftWing.current.rotation.y = flap;
      rightWing.current.rotation.y = -flap;
    }
  });

  return (
    <group ref={ref}>
      <mesh><cylinderGeometry args={[0.01, 0.01, 0.1, 6]} /><meshBasicMaterial color="#333" /></mesh>
      <mesh ref={leftWing} position={[-0.06, 0, 0]}><planeGeometry args={[0.12, 0.16]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} /></mesh>
      <mesh ref={rightWing} position={[0.06, 0, 0]}><planeGeometry args={[0.12, 0.16]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} /></mesh>
    </group>
  );
}

function PinkGarden3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 10] }} dpr={[1, 2]} frameloop="demand">
          <ambientLight intensity={1} />
          <Cloud opacity={0.2} speed={0.2} position={[-5, 5, -5]} color="#fff5f8" />
          {Array.from({ length: 8 }).map((_, i) => (
            <DashboardButterfly key={i} color={i % 2 === 0 ? "#ff80ab" : "#f48fb1"} delay={i * 30} />
          ))}
          <Stars radius={100} depth={50} count={500} factor={4} saturation={1} fade speed={1} />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default function Files() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { theme, toggleTheme } = useTheme();
  const { genderTheme, toggleGender } = useGender();
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

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"current" | "favorites">("current");
  
  // Security & Actions State
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [showDoor, setShowDoor] = useState(false);
  const [pendingDownloadUrl, setPendingDownloadUrl] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Mutations
  const incrementViewsMutation = trpc.files.incrementViews.useMutation();

  // Queries
  const filesQuery = trpc.files.list.useQuery({ 
    search: searchQuery,
    fileType: selectedType || undefined,
    year: selectedYear ? parseInt(selectedYear) : undefined,
    subject: selectedSubject || undefined,
    doctorName: selectedDoctor || undefined,
    limit: 20,
    offset: offset
  });

  // Effect to append files when offset changes or query succeeds
  useEffect(() => {
    if (filesQuery.data) {
      if (filesQuery.data.length < 20) {
        setCanLoadMore(false);
      } else {
        setCanLoadMore(true);
      }

      if (offset === 0) {
        setAllFiles(filesQuery.data);
      } else {
        setAllFiles(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const newFiles = filesQuery.data!.filter(f => !existingIds.has(f.id));
          return [...prev, ...newFiles];
        });
      }
    }
  }, [filesQuery.data, offset]);

  const favoritesQuery = trpc.files.getFavorites.useQuery(undefined, {
    enabled: activeTab === "favorites"
  });

  const displayFiles = activeTab === "favorites" ? favoritesQuery.data : allFiles;

  // Mutations
  const deleteFileMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      filesQuery.refetch();
      favoritesQuery.refetch();
      setFileToDelete(null);
      toast.success("تم حذف الملف نهائياً بنجاح");
    },
    onError: (err) => toast.error(err.message)
  });

  const toggleFavoriteMutation = trpc.files.toggleFavorite.useMutation({
    onSuccess: (data) => {
      filesQuery.refetch();
      favoritesQuery.refetch();
      toast.success(data.isFavorite ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة");
    }
  });

  const reportFileMutation = trpc.files.report.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      filesQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setOffset(0);
    }, 500);

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

  const filteredFiles = useMemo(() => {
    return activeTab === "favorites" ? (favoritesQuery.data || []) : allFiles;
  }, [allFiles, favoritesQuery.data, activeTab]);

  const handleLogout = async () => {
    await logout().catch(err => console.error("Logout failed:", err));
    navigate("/login", { replace: true });
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (!user || (user.verificationStatus !== "VERIFIED" && !user.isAdmin)) return;
    
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
    const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${backendUrl}${fileUrl}`;
    
    try {
      const link = document.createElement("a");
      link.href = absoluteUrl;
      link.setAttribute("download", fileName);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(absoluteUrl, "_blank");
    }
  };

  if (!user) return null;

  const isFemale = genderTheme === 'female';

  return (
    <motion.div 
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={`min-h-screen transition-colors duration-500 overflow-x-hidden bg-background text-foreground`}
    >
      <AnimatePresence>
        {(pullY > 20 || isRefreshing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 80 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <div className={`p-3 rounded-full shadow-2xl ${isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'}`}>
              <Loader2 className={`h-6 w-6 animate-spin`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DoorTransition isVisible={showDoor} />
      {isFemale && <PinkGarden3D />}

      <div className={`fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-pink-400' : 'bg-blue-600'
      }`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-rose-400' : 'bg-purple-600'
      }`} />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <Navbar />

        {/* Global Search and Tabs */}
        <div className="mb-12">
          <div className="relative group max-w-3xl mx-auto mb-10">
            <Search className={`absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 ${isFemale ? 'text-pink-500' : 'text-muted-foreground'}`} />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في كافة ملفات المنصة..."
              className={`w-full h-20 pr-16 pl-8 bg-card/60 backdrop-blur-3xl rounded-[2.5rem] text-xl font-black shadow-2xl transition-all text-right ${
                isFemale ? 'border-pink-200 focus:ring-pink-500/20 text-pink-900 placeholder:text-pink-300' : ''
              }`}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <select 
              value={selectedType} 
              onChange={e => { setSelectedType(e.target.value); setOffset(0); }}
              className={`h-12 bg-card/40 border rounded-xl px-4 font-bold text-xs outline-none ${isFemale ? 'border-pink-200 text-pink-900' : 'border-border/50'}`}
            >
              <option value="">كافة الأنواع</option>
              <option value="exam_mid">نصفي</option>
              <option value="exam_final">نهائي</option>
              <option value="summary">ملخص</option>
              <option value="curriculum">منهج</option>
            </select>

            <select 
              value={selectedYear} 
              onChange={e => { setSelectedYear(e.target.value); setOffset(0); }}
              className={`h-12 bg-card/40 border rounded-xl px-4 font-bold text-xs outline-none ${isFemale ? 'border-pink-200 text-pink-900' : 'border-border/50'}`}
            >
              <option value="">كافة السنين</option>
              {Array.from({ length: 6 }, (_, i) => 2020 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <Input 
              placeholder="اسم المادة..." 
              value={selectedSubject}
              onChange={e => { setSelectedSubject(e.target.value); setOffset(0); }}
              className={`w-full sm:w-40 h-12 bg-card/40 border rounded-xl px-4 font-bold text-xs ${isFemale ? 'border-pink-200 text-pink-900 placeholder:text-pink-300' : 'border-border/50'}`}
            />

            <Input 
              placeholder="اسم الدكتور..." 
              value={selectedDoctor}
              onChange={e => { setSelectedDoctor(e.target.value); setOffset(0); }}
              className={`w-full sm:w-40 h-12 bg-card/40 border rounded-xl px-4 font-bold text-xs ${isFemale ? 'border-pink-200 text-pink-900 placeholder:text-pink-300' : 'border-border/50'}`}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {[{ id: "current", label: "ملفات فصلي الحالي" }, { id: "favorites", label: "المفضلة" }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setOffset(0); }}
                className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all w-full sm:w-auto ${
                  activeTab === tab.id 
                    ? isFemale ? "bg-pink-600 text-white shadow-xl" : "bg-primary text-white shadow-xl"
                    : "bg-card/50 text-muted-foreground border border-border/50"
                }`}
              >
                {tab.id === "current" ? <Sparkles size={16} /> : <Star size={16} />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Files Grid */}
        {(filesQuery.isLoading || favoritesQuery.isLoading) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="winzo-card h-[350px] p-8 flex flex-col justify-between animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 bg-muted/20 rounded-2xl"></div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-muted/20 rounded-xl"></div>
                    <div className="w-10 h-10 bg-muted/20 rounded-xl"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 w-3/4 bg-muted/20 rounded-full"></div>
                  <div className="h-4 w-1/2 bg-muted/20 rounded-full"></div>
                </div>
                <div className="flex gap-3 mt-8">
                  <div className="h-14 flex-1 bg-muted/20 rounded-2xl"></div>
                  <div className="h-14 flex-1 bg-muted/20 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {filteredFiles.map((file: any) => {
              // SECURITY: Check if user is owner or admin
              const isOwner = file.uploadedByStudentID === user.studentDbId || user.isAdmin;
              
              return (
                <Card
                  key={file.id}
                  className={`winzo-card p-8 group relative overflow-hidden ${
                      isFemale ? 'border-pink-500/20 hover:border-pink-500/40' : 'border-border/50 hover:border-primary/40'
                  }`}
                >
                  <article>
                    <div className="absolute top-8 right-8 flex gap-2 z-20">
                      {isOwner ? (
                        <>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            className={`p-3 rounded-xl backdrop-blur-xl border border-white/10 shadow-lg ${isFemale ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                            onClick={() => toast.info("ميزة التعديل ستتوفر قريباً ✨")}
                            aria-label={`تعديل ملف: ${file.fileName}`}
                          >
                            <Pencil size={18} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            className="p-3 rounded-xl backdrop-blur-xl border border-red-500/10 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white shadow-lg transition-all"
                            onClick={() => setFileToDelete(file.id)}
                            aria-label={`حذف ملف: ${file.fileName}`}
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </>
                      ) : (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          className={`p-3 rounded-xl backdrop-blur-xl border border-amber-500/10 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white shadow-lg transition-all`}
                          onClick={() => {
                            if (window.confirm("هل أنت متأكد من الإبلاغ عن هذا الملف لوجود محتوى غير لائق أو خاطئ؟")) {
                               reportFileMutation.mutate({ fileId: file.id });
                            }
                          }}
                          aria-label={`الإبلاغ عن ملف: ${file.fileName}`}
                        >
                          <Flag size={18} />
                        </motion.button>
                      )}
                    </div>

                    <div className="absolute top-8 left-8 z-20">
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        onClick={() => toggleFavoriteMutation.mutate({ fileId: file.id })}
                        className={`p-4 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl transition-all ${
                            file.isFavorite ? "bg-red-500 text-white" : isFemale ? "bg-pink-100 text-pink-400" : "bg-card/50"
                        }`}
                        aria-label={file.isFavorite ? `إزالة ${file.fileName} من المفضلة` : `إضافة ${file.fileName} للمفضلة`}
                        aria-pressed={file.isFavorite}
                      >
                        <Heart className={`h-6 w-6 ${file.isFavorite ? "fill-current" : ""}`} />
                      </motion.button>
                    </div>

                  <div className="mt-8 mb-8">
                    <div className="mb-4">
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border uppercase ${
                          isFemale ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {file.fileType}
                      </span>
                    </div>
                    <h3 className={`font-black text-2xl mb-2 tracking-tight line-clamp-2 h-[3.5rem] ${isFemale ? 'text-pink-900' : 'text-foreground'}`} title={file.fileName}>
                      {file.fileName}
                    </h3>
                    <p className={`text-xs font-medium mb-4 line-clamp-3 h-[3rem] ${isFemale ? 'text-pink-900/60' : 'text-muted-foreground'}`}>
                      {file.description || "لا يوجد وصف لهذا الملف."}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${
                          isFemale ? 'bg-pink-50 text-pink-800 border-pink-100' : 'bg-primary/5 text-primary border-primary/10'
                      }`}>
                        <Eye size={14} className="opacity-60" />
                        <span className="text-[10px] font-black">{file.views || 0}</span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${
                          isFemale ? 'bg-pink-50 text-pink-800 border-pink-100' : 'bg-primary/5 text-primary border-primary/10'
                      }`}>
                        <DownloadIcon size={14} className="opacity-60" />
                        <span className="text-[10px] font-black">{file.downloads || 0}</span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${
                          isFemale ? 'bg-pink-50 text-pink-800 border-pink-100' : 'bg-primary/5 text-primary border-primary/10'
                      }`}>
                        <Calendar size={14} className="opacity-60" />
                        <span className="text-[10px] font-black">{file.year}</span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${
                          isFemale ? 'bg-pink-50 text-pink-800 border-pink-100' : 'bg-primary/5 text-primary border-primary/10'
                      }`}>
                        <Bookmark size={14} className="opacity-60" />
                        <span className="text-[10px] font-black">{file.subject}</span>
                      </div>
                    </div>
                  </div>

                    <div className="flex gap-3">
                      <a
                        href={(() => {
                          const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
                          return file.fileUrl.startsWith('http') 
                            ? file.fileUrl.replace(/^http:\/\/localhost:\d+/, backendUrl)
                            : `${backendUrl}${file.fileUrl}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          incrementViewsMutation.mutate({ fileId: file.id });
                        }}
                        className={`flex-1 h-14 rounded-2xl font-black text-sm gap-2 border-2 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center no-underline ${
                          isFemale ? 'border-pink-200 text-pink-600 hover:bg-pink-50' : 'border-primary/20 text-primary hover:bg-primary/5'
                        }`}
                      >
                        <Eye size={20} strokeWidth={2.5} />
                        معاينة
                      </a>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1">
                              <a
                                href={(() => {
                                  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
                                  return file.fileUrl.startsWith('http') 
                                    ? file.fileUrl.replace(/^http:\/\/localhost:\d+/, backendUrl)
                                    : `${backendUrl}${file.fileUrl}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.fileName}
                                onClick={(e) => {
                                  if (user.verificationStatus !== 'VERIFIED' && !user.isAdmin) {
                                    e.preventDefault();
                                    return;
                                  }
                                  downloadMutation.mutate({ fileId: file.id });
                                }}
                                className={`w-full h-14 rounded-2xl font-black text-sm gap-2 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center no-underline ${
                                  user.verificationStatus !== 'VERIFIED' && !user.isAdmin ? 'opacity-50 pointer-events-none' : ''
                                } ${
                                  isFemale ? 'bg-pink-600 text-white shadow-pink-500/20' : 'bg-primary text-primary-foreground shadow-primary/20'
                                }`}
                              >
                                <Download size={20} strokeWidth={2.5} />
                                تنزيل
                              </a>
                            </div>
                          </TooltipTrigger>
                          {user.verificationStatus !== 'VERIFIED' && !user.isAdmin && (
                            <TooltipContent className="font-black text-[10px] bg-yellow-500 text-white border-none shadow-xl">
                              سيتم تفعيل هذه الميزة فور اعتماد حسابك من قبل الإدارة
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                  <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isFemale ? 'bg-pink-100 text-pink-600' : 'bg-primary/10 text-primary'}`}>
                        {file.uploadedBy?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-tighter opacity-40 mb-0.5`}>المساهم</p>
                        <p className={`text-xs font-black truncate max-w-[120px] ${isFemale ? 'text-pink-900' : 'text-foreground'}`}>
                          {file.uploadedBy || "زميل مجهول"}
                        </p>
                      </div>
                    </div>
                    <ReputationBadge points={file.uploaderPetals || 0} />
                  </div>

                  <div className="mt-8">
                    <CommentSection fileID={file.id} />
                  </div>
                  </article>
                </Card>
              );
            })}
          </div>
          
          {/* Load More Button */}
          {activeTab === "current" && canLoadMore && allFiles.length >= 20 && (
            <div className="flex justify-center mt-12 pb-20">
              <Button
                onClick={() => setOffset(prev => prev + 20)}
                disabled={filesQuery.isFetching}
                variant="outline"
                className={`h-16 px-12 rounded-2xl font-black text-lg gap-3 border-2 ${
                  isFemale ? 'border-pink-200 text-pink-600 hover:bg-pink-50' : 'border-primary/20 text-primary hover:bg-primary/5'
                }`}
              >
                {filesQuery.isFetching ? <Loader2 className="animate-spin" /> : <ChevronDown size={24} />}
                تحميل المزيد من الملفات
              </Button>
            </div>
          )}
        </>
      )}

      <FilePreviewModal 
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={() => {
          if (previewFile) {
            handleDownload(previewFile.fileUrl, previewFile.fileName);
          }
        }}
      />

        <Footer />
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={fileToDelete !== null} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent className={`backdrop-blur-3xl border rounded-[3rem] p-10 max-w-md ${isFemale ? 'bg-white/95 border-pink-200' : 'bg-black/95 border-white/10'}`} dir="rtl">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className={`text-2xl font-black ${isFemale ? 'text-pink-600' : 'text-white'}`}>تأكيد الحذف النهائي</DialogTitle>
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
    </motion.div>
  );
}
