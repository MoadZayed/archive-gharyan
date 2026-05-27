import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CheckCircle,
  Trash2,
  LogOut,
  Loader2,
  ShieldCheck,
  FileText,
  Users,
  MessageSquare,
  Sun,
  Moon,
  Languages,
  LayoutDashboard,
  Search,
  RefreshCcw,
  Calendar,
  UserMinus,
  AlertTriangle,
  ChevronDown,
  Database,
  CloudUpload,
  Files,
  X,
  Check,
  ChevronsUpDown,
  Plus,
  Eye,
  Undo,
  RotateCcw,
  Bomb,
  Cpu
} from "lucide-react";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COURSES, PROFESSORS } from "@/lib/academicData";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  PieChart as PieChartIcon, 
  ArrowUpRight,
  HardDrive,
  Clock
} from "lucide-react";
import PendingStudentsList from "@/components/PendingStudentsList";
import PendingStudentsTab from "@/components/admin/PendingStudentsTab";
import PendingFilesTab from "@/components/admin/PendingFilesTab";
import ModeratorManagementTab from "@/components/admin/ModeratorManagementTab";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  useDocumentTitle("لوحة الإدارة");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"analytics" | "files" | "students" | "seeding" | "pendingStudents" | "pendingFiles" | "moderators">("analytics");
  const [fileFilter, setFileFilter] = useState<"all" | "active" | "trash">("active");
  const [isResetAllOpen, setIsResetAllOpen] = useState(false);

  const SUBJECTS = COURSES.map(c => `${c.code} - ${c.name}`);
  const DOCTORS = PROFESSORS;

  // Seeding States
  const [seedFiles, setSeedFiles] = useState<File[]>([]);
  const [seedMetadata, setSeedMetadata] = useState({
    fileType: "exam_mid",
    subject: "",
    year: new Date().getFullYear(),
    semester: "Spring",
    doctorName: ""
  });

  // Queries
  const statsQuery = trpc.admin.getDashboardStats.useQuery();
  const systemStatsQuery = trpc.admin.getSystemStats.useQuery();
  const allFilesQuery = trpc.admin.getAllFiles.useQuery();
  const allStudentsQuery = trpc.admin.getAllStudents.useQuery();

  // Mutations
  const approveFileMutation = trpc.files.approve.useMutation({
    onSuccess: () => {
      allFilesQuery.refetch();
      statsQuery.refetch();
      toast.success("تم اعتماد الملف ونشره بنجاح");
    },
  });

  const deleteFileMutation = trpc.admin.deleteFileAdmin.useMutation({
    onSuccess: () => {
      allFilesQuery.refetch();
      statsQuery.refetch();
      toast.success("تم حذف الملف نهائياً");
    },
  });

  const restoreFileMutation = trpc.admin.restoreFile.useMutation({
    onSuccess: () => {
      allFilesQuery.refetch();
      toast.success("تم تبرئة الملف وتصفير البلاغات بنجاح");
    },
    onError: (err) => toast.error(err.message)
  });

  const restoreDeletedMutation = trpc.admin.restoreDeletedFile.useMutation({
    onSuccess: () => {
      allFilesQuery.refetch();
      toast.success("تم استعادة الملف من سلة المهملات بنجاح");
    },
    onError: (err) => toast.error(err.message)
  });

  const hardDeleteMutation = trpc.admin.hardDeleteFile.useMutation({
    onSuccess: () => {
      allFilesQuery.refetch();
      statsQuery.refetch();
      toast.success("تم إعدام الملف نهائياً من السيرفر");
    },
    onError: (err) => toast.error(err.message)
  });

  const resetAllMutation = trpc.admin.resetAllStudentsCourses.useMutation({
    onSuccess: () => {
      allStudentsQuery.refetch();
      setIsResetAllOpen(false);
      toast.success("تم تصفير مواد جميع الطلاب بنجاح! سيبدأ الجميع فصلاً جديداً.");
    },
  });

  const resetSingleMutation = trpc.admin.resetSingleStudentCourses.useMutation({
    onSuccess: () => {
      allStudentsQuery.refetch();
      toast.success("تم تصفير مواد الطالب بنجاح");
    },
  });

  const bulkUploadMutation = trpc.admin.bulkUploadFiles.useMutation({
    onSuccess: (data) => {
      toast.success(`تم رفع ${data.count} ملف بنجاح!`);
      setSeedFiles([]);
      allFilesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => {
      console.error("❌ [Bulk Upload Error]:", err);
      toast.error(err.message || "فشل الرفع المكثف");
    }
  });

  const deleteStudentMutation = trpc.admin.deleteStudent.useMutation({
    onSuccess: () => {
      allStudentsQuery.refetch();
      statsQuery.refetch();
      toast.success("تم حذف الطالب وكافة بياناته نهائياً");
    },
    onError: (err) => {
      toast.error(err.message || "فشل حذف الطالب");
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/admin-login"; // Force refresh to clear admin session
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("فشل تسجيل الخروج، يرجى تحديث الصفحة");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleBulkUpload = async () => {
    try {
      if (seedFiles.length === 0) return toast.error("يرجى اختيار ملفات أولاً");
      if (!seedMetadata.subject || !seedMetadata.doctorName) return toast.error("يرجى إكمال البيانات الأكاديمية");

      const filesToUpload = await Promise.all(seedFiles.map(async (file) => ({
        fileName: file.name,
        fileContent: await fileToBase64(file),
        mimeType: file.type
      })));

      bulkUploadMutation.mutate({
        files: filesToUpload,
        metadata: seedMetadata
      });
    } catch (error) {
      console.error("Bulk upload preparation failed:", error);
      toast.error("حدث خطأ أثناء تحضير الملفات للرفع");
    }
  };

  const filteredFiles = allFilesQuery.data?.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.uploadedBy ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (fileFilter === "active") return matchesSearch && !file.deletedAt;
    if (fileFilter === "trash") return matchesSearch && file.deletedAt;
    return matchesSearch;
  }) || [];

  const filteredStudents = allStudentsQuery.data?.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentID?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteStudent = (studentId: number, studentName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب "${studentName}" نهائياً؟\nسيتم حذف كافة ملفاته وتعليقاته وتصويتاته أيضاً. لا يمكن التراجع عن هذا الإجراء.`)) {
      deleteStudentMutation.mutate({ studentDbId: studentId });
    }
  };

  if (user && !user.isAdmin) {
    navigate("/files", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen font-sans transition-colors duration-500 pb-20" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Background Orbs */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none opacity-10"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />
      <div 
        className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none opacity-10"
        style={{ backgroundColor: 'var(--accent-secondary)' }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl border-b px-6 py-4" style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--border-pink)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)' }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">لوحة تحكم الإدارة</h1>
              <p className="text-[10px] font-black text-primary dark:text-slate-300 uppercase tracking-[0.2em]">Academic Archive CMS</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')} className="bg-card/50 border-border rounded-xl">
              <Languages className="h-5 w-5 dark:text-white" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} className="bg-card/50 border-border rounded-xl">
              {theme === "dark" ? <Sun className="h-5 w-5 dark:text-white" /> : <Moon className="h-5 w-5 dark:text-white" />}
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-destructive dark:text-red-400 font-bold flex items-center gap-2 hover:bg-destructive/10 rounded-xl px-4">
              <LogOut className="h-4 w-4 dark:text-red-400" />
              خروج
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Semester Management Header */}
        <section className="mb-12 backdrop-blur-3xl border p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-pink)' }}>
          <div className="flex items-center gap-6 text-center md:text-right">
            <div className="p-5 rounded-[2rem] bg-primary/10 text-primary border border-primary/20">
              <Calendar className="h-8 w-8 dark:text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">إدارة الفصول الدراسية</h2>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">قم ببدء فصل دراسي جديد لجميع الطلاب وتصفير اختياراتهم الحالية.</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsResetAllOpen(true)}
            className="h-14 px-10 rounded-2xl font-black flex gap-3 shadow-xl btn-rgb"
          >
            <RefreshCcw className="h-5 w-5" />
            بدء فصل دراسي جديد للكل
          </Button>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 mb-12">
          {[
            { label: "إجمالي الطلاب", value: statsQuery.data?.students || 0, icon: <Users size={16} className="md:w-6 md:h-6" />, color: "var(--button-gradient)" },
            { label: "إجمالي الملفات", value: statsQuery.data?.files || 0, icon: <FileText size={16} className="md:w-6 md:h-6" />, color: "var(--button-gradient)" },
            { label: "إجمالي التعليقات", value: statsQuery.data?.comments || 0, icon: <MessageSquare size={16} className="md:w-6 md:h-6" />, color: "var(--button-gradient)" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="relative overflow-hidden backdrop-blur-xl p-3 md:p-8 rounded-xl md:rounded-[2.5rem] shadow-xl group" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 opacity-10 rounded-bl-[2rem] md:rounded-bl-[5rem] transition-all group-hover:scale-110" style={{ background: stat.color }} />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-2">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-xl md:text-5xl font-black tracking-tight dark:text-white">{stat.value}</h3>
                  </div>
                  <div className="p-2 md:p-4 rounded-lg md:rounded-2xl text-white shadow-lg" style={{ background: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4 mb-8">
          {[
            { id: "analytics", label: "التحليلات", icon: <Activity size={18} /> },
            { id: "pendingStudents", label: "طلبات التسجيل", icon: <UserMinus size={18} /> },
            { id: "pendingFiles", label: "مراجعة الملفات", icon: <FileText size={18} /> },
            { id: "files", label: "إدارة الملفات", icon: <Files size={18} /> },
            { id: "students", label: "إدارة الطلاب", icon: <Users size={18} /> },
            { id: "moderators", label: "إدارة المشرفين", icon: <ShieldCheck size={18} /> },
            { id: "seeding", label: "الرفع المكثف (Seeding)", icon: <Database size={18} /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center md:justify-start gap-2 md:gap-3 transition-all ${activeTab === tab.id ? "btn-rgb shadow-lg scale-105 text-white" : "hover:opacity-80 border"}`}
              style={activeTab === tab.id ? {} : { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-pink)', color: 'var(--text-muted)' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Data Sections */}
        <AnimatePresence mode="wait">
          {activeTab === "analytics" ? (
            <motion.div key="analytics" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {[
                  { 
                    label: "حجم التخزين المستهلك", 
                    value: `${( (systemStatsQuery.data?.totalStorageBytes || 0) / (1024 * 1024) ).toFixed(2)} MB`, 
                    icon: <HardDrive />, 
                    trend: "سعة مستقرة",
                    color: "text-blue-500 dark:text-white bg-blue-500/10" 
                  },
                  { 
                    label: "معدل النمو الأسبوعي", 
                    value: `${systemStatsQuery.data?.dailyUploads.reduce((a, b) => a + b.count, 0) || 0} ملف`, 
                    icon: <TrendingUp />, 
                    trend: "+12% عن الأسبوع الماضي",
                    color: "text-green-500 dark:text-white bg-green-500/10" 
                  },
                  { 
                    label: "أنشط مادة", 
                    value: systemStatsQuery.data?.topSubjects[0]?.subject.split('-')[1]?.trim() || "---", 
                    icon: <Activity />, 
                    trend: `${systemStatsQuery.data?.topSubjects[0]?.count || 0} مساهمة`,
                    color: "text-[var(--accent-primary)] bg-[rgba(233,30,99,0.1)]" 
                  },
                  { 
                    label: "كفاءة التوزيع", 
                    value: "84%", 
                    icon: <PieChartIcon />, 
                    trend: "تغطية شاملة للمواد",
                    color: "text-amber-500 dark:text-white bg-amber-500/10" 
                  },
                ].map((item, i) => (
                  <Card key={i} className="p-4 md:p-6 backdrop-blur-2xl rounded-xl md:rounded-[2rem] shadow-lg" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 md:py-1 rounded-full">
                        <ArrowUpRight size={10} className="md:w-3 md:h-3" />
                        {item.trend}
                      </div>
                    </div>
                    <p className="text-[8px] md:text-[10px] font-black text-muted-foreground dark:text-white uppercase mb-1">{item.label}</p>
                    <h4 className="text-lg md:text-2xl font-black truncate dark:text-white" title={item.value}>{item.value}</h4>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Activity Chart */}
                <Card className="p-8 backdrop-blur-3xl rounded-[3rem] shadow-2xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black mb-1 dark:text-white">نشاط الرفع (آخر 7 أيام)</h3>
                      <p className="text-xs font-bold text-muted-foreground">عدد الملفات المرفوعة يومياً خلال الأسبوع الحالي.</p>
                    </div>
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                      <Activity size={24} />
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={systemStatsQuery.data?.dailyUploads || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 800, fill: '#888' }}
                          dy={10}
                          tickFormatter={(val) => new Date(val).toLocaleDateString('ar-LY', { weekday: 'short' })}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#888' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 900 }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                          {(systemStatsQuery.data?.dailyUploads || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === (systemStatsQuery.data?.dailyUploads.length || 0) - 1 ? '#8b5cf6' : '#3b82f6'} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Top Subjects Activity */}
                <Card className="p-8 backdrop-blur-3xl rounded-[3rem] shadow-2xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black mb-1 dark:text-white">المواد الأكثر تفاعلاً</h3>
                      <p className="text-xs font-bold text-muted-foreground dark:text-slate-400">توزيع الملفات المرفوعة بناءً على المادة الدراسية.</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 dark:text-white rounded-2xl">
                      <PieChartIcon size={24} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {systemStatsQuery.data?.topSubjects.map((sub, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-black">
                          <span className="truncate max-w-[200px] dark:text-white">{sub.subject}</span>
                          <span className="text-primary dark:text-white">{sub.count} ملف</span>
                        </div>
                        <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(sub.count / (systemStatsQuery.data?.totalFiles || 1)) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ 
                              background: i === 0 ? 'var(--button-gradient)' : 
                                          i === 1 ? 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' :
                                          'var(--glass-white)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {(!systemStatsQuery.data?.topSubjects || systemStatsQuery.data.topSubjects.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Activity className="opacity-10 mb-4" size={64} />
                        <p className="font-bold">لا توجد بيانات كافية بعد</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          ) : activeTab === "seeding" ? (
            <motion.div key="seeding" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Metadata Form */}
                <Card className="lg:col-span-1 backdrop-blur-3xl p-8 rounded-[3rem] h-fit" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                    <Database className="text-primary" size={20} />
                    البيانات الأكاديمية الموحدة
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground dark:text-slate-300 px-4 uppercase">نوع الملف</label>
                      <select 
                        value={seedMetadata.fileType} 
                        onChange={e => setSeedMetadata({...seedMetadata, fileType: e.target.value})}
                        className="w-full h-12 bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 rounded-xl px-4 font-bold outline-none dark:text-white"
                      >
                        <option value="exam_mid" className="dark:bg-slate-800">امتحان نصفي</option>
                        <option value="exam_final" className="dark:bg-slate-800">امتحان نهائي</option>
                        <option value="summary" className="dark:bg-slate-800">ملخص</option>
                        <option value="curriculum" className="dark:bg-slate-800">منهج مادة</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground dark:text-slate-300 px-4 uppercase">اسم المادة</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full h-12 justify-between bg-background/50 dark:bg-white/5 border-border dark:border-white/10 rounded-xl font-bold text-right dark:text-white",
                              !seedMetadata.subject && "text-muted-foreground dark:text-slate-400"
                            )}
                          >
                            {seedMetadata.subject || "اختر أو اكتب مادة..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border rounded-xl shadow-2xl">
                          <Command className="bg-transparent">
                            <CommandInput 
                              placeholder="ابحث عن مادة..." 
                              onValueChange={(v) => {
                                // Support free solo: if not found, allow current input
                                if (!SUBJECTS.some(s => s.includes(v))) {
                                   // We handle the manual entry via the input itself if needed, 
                                   // but shadcn command handles filtering.
                                }
                              }}
                            />
                            <CommandList>
                              <CommandEmpty className="p-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-primary font-black text-xs"
                                  onClick={() => setSeedMetadata({...seedMetadata, subject: (document.querySelector('[cmdk-input]') as HTMLInputElement)?.value || ""})}
                                >
                                  <Plus className="mr-2 h-3 w-3" />
                                  إضافة كاسم جديد
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                {SUBJECTS.map((s) => (
                                  <CommandItem
                                    key={s}
                                    value={s}
                                    onSelect={(currentValue) => {
                                      setSeedMetadata({...seedMetadata, subject: currentValue});
                                    }}
                                    className="font-bold text-sm cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 text-primary",
                                        seedMetadata.subject === s ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {s}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground dark:text-slate-300 px-4 uppercase">السنة</label>
                        <Input 
                          type="number"
                          value={seedMetadata.year} 
                          onChange={e => setSeedMetadata({...seedMetadata, year: parseInt(e.target.value)})}
                          className="h-12 bg-background/50 dark:bg-white/5 border-border dark:border-white/10 rounded-xl font-bold dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground dark:text-slate-300 px-4 uppercase">الفصل</label>
                        <select 
                          value={seedMetadata.semester} 
                          onChange={e => setSeedMetadata({...seedMetadata, semester: e.target.value})}
                          className="w-full h-12 bg-background/50 dark:bg-white/5 border border-border dark:border-white/10 rounded-xl px-4 font-bold outline-none dark:text-white"
                        >
                          <option value="Spring" className="dark:bg-slate-800">ربيع</option>
                          <option value="Fall" className="dark:bg-slate-800">خريف</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground dark:text-slate-300 px-4 uppercase">اسم الدكتور</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full h-12 justify-between bg-background/50 dark:bg-white/5 border-border dark:border-white/10 rounded-xl font-bold text-right dark:text-white",
                              !seedMetadata.doctorName && "text-muted-foreground dark:text-slate-400"
                            )}
                          >
                            {seedMetadata.doctorName || "اختر أو اكتب دكتور..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border rounded-xl shadow-2xl">
                          <Command className="bg-transparent">
                            <CommandInput placeholder="ابحث عن دكتور..." />
                            <CommandList>
                              <CommandEmpty className="p-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-primary font-black text-xs"
                                  onClick={() => setSeedMetadata({...seedMetadata, doctorName: (document.querySelector('[cmdk-input]') as HTMLInputElement)?.value || ""})}
                                >
                                  <Plus className="mr-2 h-3 w-3" />
                                  إضافة كاسم جديد
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                {DOCTORS.map((d) => (
                                  <CommandItem
                                    key={d}
                                    value={d}
                                    onSelect={(currentValue) => {
                                      setSeedMetadata({...seedMetadata, doctorName: currentValue});
                                    }}
                                    className="font-bold text-sm cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 text-primary",
                                        seedMetadata.doctorName === d ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {d}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </Card>

                {/* Multiple File Upload Area */}
                <Card className="lg:col-span-2 backdrop-blur-3xl p-8 rounded-[3rem]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                    <Files className="text-primary" size={20} />
                    اختيار الملفات المكثف
                  </h3>
                  
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-[2.5rem] p-16 cursor-pointer hover:bg-primary/5 transition-all group mb-8">
                    <input 
                      type="file" 
                      multiple 
                      onChange={e => {
                        if (e.target.files) setSeedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }} 
                      className="hidden" 
                    />
                    <CloudUpload className="h-16 w-16 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-xl dark:text-white">اسحب الملفات هنا أو انقر للاختيار</span>
                    <span className="text-xs text-muted-foreground dark:text-slate-400 mt-2 font-bold uppercase tracking-widest">يدعم الرفع المتعدد (PDF, JPG, PNG)</span>
                  </label>

                  {seedFiles.length > 0 && (
                    <div className="space-y-3 mb-10">
                      <p className="text-[10px] font-black text-primary px-4 uppercase tracking-[0.2em] mb-4">قائمة الملفات ({seedFiles.length})</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                        {seedFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-background/50 dark:bg-white/5 border border-border rounded-2xl group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="text-primary flex-shrink-0" size={18} />
                              <span className="text-xs font-bold truncate dark:text-white">{f.name}</span>
                            </div>
                            <button onClick={() => setSeedFiles(seedFiles.filter((_, i) => i !== idx))} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleBulkUpload}
                    disabled={seedFiles.length === 0 || bulkUploadMutation.isPending}
                    className="w-full h-18 font-black text-xl rounded-2xl shadow-xl btn-rgb"
                  >
                    {bulkUploadMutation.isPending ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin" />
                        جاري رفع {seedFiles.length} ملف...
                      </div>
                    ) : (
                      "رفع كافة الملفات دفعة واحدة 🚀"
                    )}
                  </Button>
                </Card>
              </div>
            </motion.div>
          ) : activeTab === "pendingStudents" ? (
            <motion.div key="pendingStudents" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <PendingStudentsTab />
            </motion.div>
          ) : activeTab === "pendingFiles" ? (
            <motion.div key="pendingFiles" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <PendingFilesTab />
            </motion.div>
          ) : activeTab === "moderators" ? (
            <motion.div key="moderators" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <ModeratorManagementTab />
            </motion.div>
          ) : (
            <motion.div key="data-table" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <div className="p-8 border-b border-border dark:border-white/5 bg-card/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-black dark:text-white">{activeTab === "files" ? "إدارة المحتوى" : "بيانات الطلاب"}</h2>
                  </div>
                  <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث..." 
                      className="w-full bg-background/50 border border-border h-12 pl-12 pr-6 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                    />
                  </div>
                  {activeTab === "files" && (
                    <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                      <button 
                        onClick={() => setFileFilter("active")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${fileFilter === "active" ? "btn-rgb shadow-lg scale-105" : "text-muted-foreground hover:bg-white/5"}`}
                      >النشطة</button>
                      <button 
                        onClick={() => setFileFilter("trash")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${fileFilter === "trash" ? "btn-rgb shadow-lg scale-105" : "text-muted-foreground hover:bg-white/5"}`}
                      >سلة المهملات</button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {activeTab === "files" ? (
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">الملف</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">المادة / الأستاذ</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">بواسطة</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">الإبلاغات</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">الحالة</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <AnimatePresence>
                          {filteredFiles.map((file) => (
                            <motion.tr key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-primary/5 transition-colors group">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border shadow-sm group-hover:scale-110 transition-transform">
                                    <FileText className="h-5 w-5 text-primary dark:text-white" />
                                  </div>
                                  <div>
                                    <p className="font-black text-sm line-clamp-1 text-slate-900 dark:text-white">{file.fileName}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">{file.fileType}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{file.subject}</p>
                                <p className="text-[10px] font-black text-primary dark:text-primary-foreground uppercase">السنة: {file.year}</p>
                              </td>
                              <td className="px-8 py-6">
                                <p className="font-black text-sm text-slate-900 dark:text-white">{file.uploadedBy || "إدارة المنصة"}</p>
                                <p className="text-[10px] font-bold text-muted-foreground dark:text-slate-400 tracking-tighter">ID: {file.studentID || "SYSTEM"}</p>
                              </td>
                              <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                                  file.reportsCount >= 10 ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
                                  file.reportsCount > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  <AlertTriangle className="h-3 w-3" />
                                  {file.reportsCount} بلاغات {file.reportsCount >= 10 ? '(محجور)' : ''}
                                </div>
                                {file.deletedAt && (
                                  <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black w-fit">
                                    <Trash2 className="h-3 w-3" />
                                    محذوف
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6">
                                {file.deletedAt ? (
                                  <div className="text-[10px] font-bold text-muted-foreground">
                                    حذف في: {new Date(file.deletedAt).toLocaleDateString("ar-LY")}
                                  </div>
                                ) : file.reportsCount >= 10 ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                                    تحت المراجعة القصوى
                                  </div>
                                ) : file.isApproved ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-[10px] font-black">
                                    <CheckCircle className="h-3 w-3" />
                                    مقبول ومنشور
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    قيد المراجعة
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      const rawBackendUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
                                      const backendUrl = rawBackendUrl.replace(/\/+$/, "");
                                      const cleanUrl = file.fileUrl.startsWith('/') ? file.fileUrl : `/${file.fileUrl}`;
                                      const absoluteUrl = file.fileUrl.startsWith('http') ? file.fileUrl : `${backendUrl}${cleanUrl}`;
                                      window.open(absoluteUrl, '_blank');
                                    }} 
                                    className="h-8 border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg px-3"
                                    title="معاينة الملف"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {file.reportsCount > 0 && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => restoreFileMutation.mutate({ fileId: file.id })} 
                                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3"
                                      title="تبرئة واستعادة"
                                    >
                                      <Undo className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {file.deletedAt ? (
                                    <>
                                      <Button 
                                        size="sm" 
                                        onClick={() => restoreDeletedMutation.mutate({ fileId: file.id })} 
                                        className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3"
                                        title="استعادة من المحذوفات"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => {
                                          if (window.confirm("تحذير: هذا الحذف نهائي ولا يمكن التراجع عنه. هل أنت متأكد من إعدام الملف؟")) {
                                            hardDeleteMutation.mutate({ fileId: file.id });
                                          }
                                        }} 
                                        className="h-8 border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg px-3"
                                        title="إعدام نهائي"
                                      >
                                        <Bomb className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      {!file.isApproved && (
                                        <Button size="sm" onClick={() => approveFileMutation.mutate({ fileId: file.id })} className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 text-[10px] font-black">موافقة</Button>
                                      )}
                                      
                                      <Button size="sm" variant="outline" onClick={() => deleteFileMutation.mutate({ fileId: file.id })} className="h-8 border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-lg px-3">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground dark:text-white uppercase tracking-widest">الطالب</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground dark:text-white uppercase tracking-widest">رقم القيد / الهوية</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground dark:text-white uppercase tracking-widest">المواد المسجلة</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground dark:text-white uppercase tracking-widest">آخر تحديث</th>
                          <th className="px-8 py-5 text-[10px] font-black text-muted-foreground dark:text-white uppercase tracking-widest">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredStudents.map((student) => {
                          const courses = student.enrolledCourses ? JSON.parse(student.enrolledCourses as string) : [];
                          return (
                            <tr key={student.id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-8 py-6 font-black text-sm dark:text-white">{student.fullName}</td>
                              <td className="px-8 py-6">
                                <p className="font-bold text-sm dark:text-white">{student.studentID}</p>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {courses.length > 0 ? courses.map((c: string) => (
                                    <span key={c} className="px-2 py-0.5 bg-primary/10 text-primary dark:text-white text-[9px] font-black rounded-md">{c}</span>
                                  )) : <span className="text-muted-foreground dark:text-white text-[10px]">لم يختار مواداً</span>}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-xs font-bold text-muted-foreground dark:text-white">
                                {student.coursesUpdatedAt ? new Date(student.coursesUpdatedAt).toLocaleDateString("ar-LY") : "---"}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDeleteStudent(student.id, student.fullName)}
                                    className="h-8 border-destructive/20 text-destructive hover:bg-destructive hover:text-white flex gap-2 rounded-lg text-[10px] font-black"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    حذف الطالب
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => resetSingleMutation.mutate({ id: student.id })}
                                    disabled={courses.length === 0}
                                    className="h-8 border-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white flex gap-2 rounded-lg text-[10px] font-black"
                                  >
                                    <UserMinus className="h-3 w-3" />
                                    تصفير المواد
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Reset All Confirm Modal */}
      <Dialog open={isResetAllOpen} onOpenChange={setIsResetAllOpen}>
        <DialogContent className="max-w-md bg-card/90 backdrop-blur-2xl border-border rounded-[2.5rem] p-10 outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-4 flex items-center justify-center gap-3 text-destructive">
              <AlertTriangle className="h-8 w-8" />
              تنبيه هام جداً
            </DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground leading-relaxed">
              أنت على وشك مسح جميع المواد المسجلة لكل الطلاب في المنصة. سيتم إجبار الجميع على إعادة اختيار موادهم عند تسجيل الدخول التالي.
              <br /><br />
              <span className="text-destructive font-black">هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟</span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsResetAllOpen(false)} className="flex-1 h-14 rounded-2xl font-black">إلغاء</Button>
            <Button 
              onClick={() => resetAllMutation.mutate()} 
              disabled={resetAllMutation.isPending}
              className="flex-[2] h-14 bg-destructive text-white rounded-2xl font-black text-lg shadow-xl shadow-destructive/20"
            >
              {resetAllMutation.isPending ? <Loader2 className="animate-spin" /> : "نعم، تصفير للكل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
