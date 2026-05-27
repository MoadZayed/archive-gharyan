import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Info,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  ArrowRight,
  ChevronRight,
  Sun,
  Moon,
  Upload as UploadIcon,
  Sparkles,
  FileUp,
  Loader2
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
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import StarNotification from "@/components/StarNotification";

import { Progress } from "@/components/ui/progress";
import axios from "axios";
import imageCompression from 'browser-image-compression';
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Upload() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  useDocumentTitle("رفع ملف");

  const normalizeArabic = (text: string) => {
    return text
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[\u064B-\u065F]/g, "");
  };

  // Form States (for auto-fill and review)
  const [fileType, setFileType] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [semester, setSemester] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [lectureNumber, setLectureNumber] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileData, setUploadedFileData] = useState<{key: string, url: string, hash: string, size: number} | null>(null);
  
  // UI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [starData, setStarData] = useState<{ visible: boolean; count: number }>({ visible: false, count: 0 });

  const createIntentMutation = trpc.files.createUploadIntent.useMutation();

  const finalizeMutation = trpc.files.finalizeUpload.useMutation({
    onSuccess: (data) => {
      if (data.starGained) {
        setStarData({ visible: true, count: data.newStars });
        setTimeout(() => {
          navigate("/files", { replace: true });
        }, 4000);
      } else {
        toast.success("تم رفع الملف بنجاح! شكراً لمساهمتك");
        navigate("/files", { replace: true });
      }
    },
    onError: (err) => {
      setIsUploading(false);
      if (err.message === "DUPLICATE_FILE" || err.message.includes("موجود مسبقاً")) {
        toast.success("شكرًا لمبادرتك! 🌟 هذا الملف موجود بالفعل في الأرشيف وتم رفعه مسبقاً من قبل زميل آخر.");
        setShowReviewModal(false);
        setSelectedFile(null);
      } else {
        toast.error(err.message || "حدث خطأ أثناء الرفع");
      }
    },
  });

  const existingLecturesQuery = trpc.files.getExistingLectures.useQuery(
    { subject, doctorName, academicYear },
    { enabled: !!subject && !!doctorName && !!academicYear }
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fileType) newErrors.fileType = "يرجى اختيار نوع الملف";
    if (!subject.trim()) newErrors.subject = "اسم المادة مطلوب";
    if (!year || parseInt(year) < 2020 || parseInt(year) > new Date().getFullYear()) {
      newErrors.year = "السنة يجب أن تكون بين 2020 والسنة الحالية";
    }
    if (!semester) newErrors.semester = "يرجى اختيار الفصل الدراسي";
    if (!doctorName.trim()) newErrors.doctorName = "اسم الدكتور مطلوب";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Binary Upload with Progress via Presigned URL
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf", 
      "image/jpeg", 
      "image/png", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("عذراً، يسمح فقط بملفات PDF أو صور JPG/PNG أو مستندات Word (DOC/DOCX)");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 50MB)");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
    setIsUploading(true);
    
    try {
      let fileToUpload = file;

      // ✅ Image Optimization Logic
      if (file.type.startsWith("image/")) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (compressionErr) {
          console.error("Image compression failed, proceeding with original file:", compressionErr);
        }
      }

      // Compute Hash locally
      const arrayBuffer = await fileToUpload.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 1. Get Intent
      const intent = await createIntentMutation.mutateAsync({
        fileName: fileToUpload.name,
        mimeType: fileToUpload.type,
        fileHash,
        fileSize: fileToUpload.size
      });

      // 2. Upload to B2 directly via PUT
      await axios.put(intent.uploadUrl, fileToUpload, {
        headers: {
          'Content-Type': fileToUpload.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      setUploadedFileData({
        key: intent.fileKey,
        url: '', // Not needed, backend will construct it
        hash: fileHash,
        size: fileToUpload.size
      });

      setIsUploading(false);
      setShowReviewModal(true);
    } catch (err: any) {
      console.error("Upload Error:", err);
      if (err.message?.includes("موجود مسبقاً") || err.data?.code === "CONFLICT") {
         toast.success("هذا الملف موجود بالفعل في الأرشيف وتم رفعه مسبقاً.");
         setSelectedFile(null);
      } else {
         toast.error(err.message || "فشل رفع الملف");
      }
      setIsUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!validateForm() || !uploadedFileData) {
      if (!uploadedFileData) toast.error("يرجى انتظار اكتمال الرفع الأولي");
      else toast.error("يرجى إكمال الحقول الفارغة أو المصححة");
      return;
    }

    setIsUploading(true);
    const courseCode = subject.split(" - ")[0];

    finalizeMutation.mutate({
      fileName: selectedFile!.name,
      fileType,
      subject,
      courseCode,
      year: parseInt(year),
      semester,
      doctorName,
      description,
      academicYear,
      lectureNumber: lectureNumber ? parseInt(lectureNumber) : null,
      fileKey: uploadedFileData.key,
      fileHash: uploadedFileData.hash,
      fileSize: uploadedFileData.size,
      mimeType: selectedFile!.type,
    });
  };

  if (!user) return null;


  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden transition-colors duration-1000" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      {/* Enhanced Theme Lighting with Wave Effect */}
      <div 
        className="fixed top-[-15%] left-[-15%] w-[70%] h-[70%] rounded-full blur-[160px] pointer-events-none opacity-20 animate-wave"
        style={{ backgroundColor: 'var(--accent-primary)' }} 
      />
      <div 
        className="fixed bottom-[-15%] right-[-15%] w-[70%] h-[70%] rounded-full blur-[160px] pointer-events-none opacity-20 animate-wave animation-delay-2000"
        style={{ backgroundColor: 'var(--accent-secondary)' }}
      />
      
      {/* Additional Glow Accents */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[180px] pointer-events-none opacity-10"
        style={{ backgroundColor: 'var(--accent-tertiary)' }}
      />

      <div className="absolute top-8 left-8 z-50 flex gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate("/files")} 
          className="backdrop-blur-xl rounded-2xl w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-none shadow-[0_10px_30px_rgba(233,30,99,0.2)]"
          style={{ background: 'var(--button-gradient)', color: 'white' }}
        >
          <ArrowRight size={20} />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="backdrop-blur-3xl border shadow-[0_20px_50px_rgba(233,30,99,0.1)] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 text-center relative overflow-hidden transition-all duration-700" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          {/* Decorative Glass Inner Glow */}
          <div 
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
          <StarNotification 
            isVisible={starData.visible} 
            stars={starData.count} 
            onClose={() => setStarData(prev => ({ ...prev, visible: false }))} 
          />
          {isAnalyzing ? (
            <div className="py-20 flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_10px_30px_rgba(233,30,99,0.3)]"
                style={{ background: 'var(--button-gradient)', color: 'white' }}
              >
                <BrainCircuit size={48} />
              </motion.div>
              <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
                جاري التحليل بالذكاء الاصطناعي...
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                Gemini 1.5 Flash is extracting academic data
              </p>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAnalyzing(false);
                  setShowReviewModal(true);
                }}
                className="mt-8 font-bold hover:bg-[rgba(233,30,99,0.1)] rounded-2xl min-h-[44px]"
                style={{ color: 'var(--text-muted)' }}
              >
                تجاوز التحليل والتعبئة يدوياً
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-14">
                <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(233,30,99,0.3)] mb-8 transition-transform hover:scale-110" style={{ background: 'var(--button-gradient)', color: 'white' }}>
                  {isUploading ? <Loader2 className="animate-spin" size={44} /> : <UploadIcon size={44} strokeWidth={2.5} />}
                </div>
                <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                  {isUploading ? "جاري الرفع..." : "الرفع الذكي (AI)"}
                </h1>
                
                {isUploading && (
                  <div className="w-full max-w-xs mt-4 space-y-2">
                    <Progress value={uploadProgress} className="h-2" style={{ backgroundColor: 'var(--border-pink)' }} />
                    <p className="text-xs font-black" style={{ color: 'var(--accent-primary)' }}>
                      {uploadProgress}% اكتمل
                    </p>
                  </div>
                )}
                
                {!isUploading && (
                  <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>
                    بمجرد اختيار الملف، سنتولى مهمة تعبئة البيانات عنك
                  </p>
                )}
              </div>

              <div className="space-y-8">
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-10 md:p-16 cursor-pointer transition-all group relative overflow-hidden" style={{ backgroundColor: 'rgba(233,30,99,0.05)', borderColor: 'var(--border-pink)' }}>
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    capture="environment"
                    className="hidden" 
                  />
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
                      <Sparkles size={38} />
                    </div>
                    <p className="font-black text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                      اختر ملفك الآن
                    </p>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                      PDF, JPG, PNG
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* Glassy Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent 
          onPointerDownOutside={(e) => e.preventDefault()}
          className="backdrop-blur-3xl border rounded-[3rem] w-[95vw] md:w-full max-w-2xl p-6 md:p-10 overflow-y-auto max-h-[90vh]"
          style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}
          dir="rtl"
        >
          <DialogHeader className="items-center mb-8 md:mb-10 mt-6 md:mt-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)', color: 'white' }}>
              <CheckCircle2 size={32} />
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
              مراجعة بيانات الملف
            </DialogTitle>
            <DialogDescription className="font-bold text-center" style={{ color: 'var(--text-muted)' }}>
              يرجى التأكد من دقة البيانات التي استخرجها الذكاء الاصطناعي.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>نوع الملف</label>
                <select 
                  value={fileType} 
                  onChange={e => setFileType(e.target.value)}
                  className="w-full h-14 border rounded-[14px] px-6 font-bold outline-none"
                  style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                >
                  <option value="" disabled>اختر النوع...</option>
                  <option value="exam_mid">امتحان نصفي</option>
                  <option value="exam_final">امتحان نهائي</option>
                  <option value="summary">ملخص</option>
                  <option value="curriculum">منهج مادة</option>
                </select>
                {errors.fileType && <p className="text-red-500 text-[10px] font-black px-4">{errors.fileType}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>اسم المادة</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full h-14 justify-between border rounded-[14px] px-6 font-bold text-right",
                        !subject && "text-muted-foreground"
                      )}
                      style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                    >
                      {subject || "ابحث عن مادة..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
                    <Command 
                      className="bg-transparent"
                      filter={(value, search) => {
                        const normalizedValue = normalizeArabic(value.toLowerCase());
                        const normalizedSearch = normalizeArabic(search.toLowerCase());
                        return normalizedValue.includes(normalizedSearch) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="ابحث بكود أو اسم المادة..." className="h-12" />
                      <CommandList className="max-h-60 custom-scrollbar">
                        <CommandEmpty className="p-4 text-xs font-bold text-muted-foreground">لا توجد مادة بهذا الاسم.</CommandEmpty>
                        <CommandGroup>
                          {COURSES.map((c) => {
                            const val = `${c.code} - ${c.name}`;
                            return (
                              <CommandItem
                                key={c.code}
                                value={val}
                                onSelect={(currentValue) => setSubject(currentValue)}
                                className="font-bold text-sm cursor-pointer py-3"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-primary", subject === val ? "opacity-100" : "opacity-0")} />
                                {val}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.subject && <p className="text-red-500 text-[10px] font-black px-4">{errors.subject}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>السنة</label>
                <Input 
                  type="number"
                  value={year} 
                  onChange={e => setYear(e.target.value)}
                  className="h-14 border rounded-[14px] font-bold"
                  style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>الفصل</label>
                <div className="flex gap-4">
                  {['Spring', 'Fall'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      className="flex-1 h-14 rounded-[14px] font-black text-sm transition-all border"
                      style={{ 
                        backgroundColor: semester === s ? 'var(--accent-primary)' : 'var(--glass-white)', 
                        borderColor: semester === s ? 'var(--accent-primary)' : 'var(--border-pink)',
                        color: semester === s ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {s === 'Spring' ? 'ربيع' : 'خريف'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>اسم الدكتور</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full h-14 justify-between border rounded-[14px] px-6 font-bold text-right",
                      !doctorName && "text-muted-foreground"
                    )}
                    style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
                  >
                    {doctorName || "ابحث عن دكتور..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
                  <Command 
                    className="bg-transparent"
                    filter={(value, search) => {
                      const normalizedValue = normalizeArabic(value.toLowerCase());
                      const normalizedSearch = normalizeArabic(search.toLowerCase());
                      return normalizedValue.includes(normalizedSearch) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="ابحث عن دكتور..." className="h-12" />
                    <CommandList className="max-h-60 custom-scrollbar">
                      <CommandEmpty className="p-4 text-xs font-bold text-muted-foreground">لا يوجد دكتور بهذا الاسم.</CommandEmpty>
                      <CommandGroup>
                        {PROFESSORS.map((p) => (
                          <CommandItem
                            key={p}
                            value={p}
                            onSelect={(v) => setDoctorName(v)}
                            className="font-bold text-sm cursor-pointer py-3"
                          >
                            <Check className={cn("mr-2 h-4 w-4 text-primary", doctorName === p ? "opacity-100" : "opacity-0")} />
                            {p}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.doctorName && <p className="text-red-500 text-[10px] font-black px-4">{errors.doctorName}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>رقم الشيت / المحاضرة</label>
              <select 
                value={lectureNumber} 
                onChange={e => setLectureNumber(e.target.value)}
                className="w-full h-14 border rounded-[14px] px-6 font-bold outline-none"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              >
                <option value="">غير محدد</option>
                {Array.from({ length: 15 }, (_, i) => i + 1).map(num => {
                  const isUploaded = existingLecturesQuery.data?.includes(num);
                  return (
                    <option key={num} value={num} className={isUploaded ? "text-green-500 font-black" : ""}>
                      محاضرة {num} {isUploaded ? " (تم الرفع مسبقاً ✔️)" : ""}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] font-bold px-4" style={{ color: 'var(--text-muted)' }}>
                تلميح: المحاضرات المميزة بالأخضر تم رفعها مسبقاً من قبل زملائك.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>السنة الأكاديمية</label>
              <select 
                value={academicYear} 
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full h-14 border rounded-[14px] px-6 font-bold outline-none"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black px-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>ملخص الملف</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full p-6 h-32 border rounded-[14px] font-bold text-xs resize-none outline-none"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <DialogFooter className="mt-10 gap-4 sm:flex-col">
            <Button
              onClick={handleFinalSubmit}
              disabled={isUploading}
              className="w-full h-16 md:h-20 rounded-[2rem] font-black text-xl md:text-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-none"
              style={{ background: 'var(--button-gradient)', color: 'white' }}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : "اعتماد الرفع"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowReviewModal(false)}
              className="w-full h-12 md:h-14 font-black rounded-2xl hover:bg-[rgba(233,30,99,0.1)] hover:text-[var(--accent-primary)]"
              style={{ color: 'var(--text-muted)' }}
            >
              إلغاء وإعادة المحاولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
