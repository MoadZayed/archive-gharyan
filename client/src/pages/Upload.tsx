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
import { useGender } from "@/contexts/GenderContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { Progress } from "@/components/ui/progress";
import axios from "axios";
import imageCompression from 'browser-image-compression';
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Upload() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { genderTheme } = useGender();

  useDocumentTitle("رفع ملف");

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

  // 1. Smart Analysis Mutation (Still uses base64 for small payload to AI)
  const analyzeMutation = trpc.files.analyzeDocument.useMutation({
    onSuccess: (data) => {
      setDescription(data.summary || "");
      setIsAnalyzing(false);
      setShowReviewModal(true);
      toast.success(data.summary ? "تم تحليل الصورة بنجاح، يرجى إكمال البيانات يدوياً" : "يرجى إكمال بيانات الملف يدوياً");
    },
    onError: (err) => {
      setIsAnalyzing(false);
      toast.error(err.message || "فشل التحليل، يمكنك إدخال البيانات يدوياً");
      setShowReviewModal(true);
    }
  });

  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("تم رفع الملف بنجاح! شكراً لمساهمتك");
      navigate("/files", { replace: true });
    },
    onError: (err) => {
      setIsUploading(false);
      if (err.message === "DUPLICATE_FILE") {
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

  // 2. Binary Upload with Progress
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

      // ✅ Image Optimization Logic (CTO Recommendation)
      if (file.type.startsWith("image/")) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        try {
          fileToUpload = await imageCompression(file, options);
          console.log(`Image optimized: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (compressionErr) {
          console.error("Image compression failed, proceeding with original file:", compressionErr);
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const response = await axios.post("/api/upload-binary", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      const data = response.data;
      setUploadedFileData({
        key: data.key,
        url: data.url,
        hash: data.fileHash,
        size: data.size
      });

      setIsUploading(false);
      
      // AI Strategy: Only analyze images
      if (file.type.startsWith("image/")) {
        setIsAnalyzing(true);
        // Small base64 for AI analysis ONLY
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          analyzeMutation.mutate({ fileData: base64, mimeType: file.type });
        };
      } else {
        setShowReviewModal(true);
      }
    } catch (err) {
      toast.error("فشل رفع الملف إلى السيرفر");
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

    uploadMutation.mutate({
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
      fileUrl: uploadedFileData.url,
      fileHash: uploadedFileData.hash,
      fileSize: uploadedFileData.size,
      mimeType: selectedFile!.type,
    });
  };

  if (!user) return null;

  const isFemale = genderTheme === 'female';

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000 ${
      isFemale ? 'bg-[#fff0f6]' : 'bg-[#020617]'
    }`} dir="rtl">
      {/* Background Orbs */}
      <div className={`fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-pink-400' : 'bg-blue-600'
      }`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-rose-400' : 'bg-purple-600'
      }`} />

      <div className="absolute top-8 left-8 z-50 flex gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate("/files")} 
          className={`backdrop-blur-xl border-white/20 rounded-2xl w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
            isFemale ? 'bg-white/40 text-pink-600 border-pink-100 shadow-pink-500/10' : 'bg-white/5 text-white border-white/10 shadow-blue-500/10'
          }`}
        >
          <ArrowRight size={20} />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleTheme} 
          className={`backdrop-blur-xl border-white/20 rounded-2xl w-12 h-12 ${
            isFemale ? 'bg-white/40 text-pink-500' : 'bg-white/5 text-white'
          }`}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className={`backdrop-blur-3xl border shadow-2xl rounded-[3.5rem] p-10 md:p-16 text-center ${
          isFemale 
            ? 'bg-white/60 border-pink-200/50' 
            : 'bg-white/[0.02] border-white/10 shadow-black/50'
        }`}>
          {isAnalyzing ? (
            <div className="py-20 flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-10 ${
                  isFemale ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-blue-600 text-white'
                }`}
              >
                <BrainCircuit size={48} />
              </motion.div>
              <h2 className={`text-2xl font-black mb-4 ${isFemale ? 'text-pink-600' : 'text-white'}`}>
                جاري التحليل بالذكاء الاصطناعي...
              </h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-blue-400'}`}>
                Gemini 1.5 Flash is extracting academic data
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-14">
                <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 ${
                  isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {isUploading ? <Loader2 className="animate-spin" size={44} /> : <UploadIcon size={44} strokeWidth={2.5} />}
                </div>
                <h1 className={`text-4xl font-black mb-4 tracking-tighter glow-text-bright ${isFemale ? 'text-pink-600' : 'text-white'}`}>
                  {isUploading ? "جاري الرفع..." : "الرفع الذكي (AI)"}
                </h1>
                
                {isUploading && (
                  <div className="w-full max-w-xs mt-4 space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className={`text-xs font-black ${isFemale ? 'text-pink-400' : 'text-blue-400'}`}>
                      {uploadProgress}% اكتمل
                    </p>
                  </div>
                )}
                
                {!isUploading && (
                  <p className={`font-black text-sm ${isFemale ? 'text-pink-400' : 'text-white/40'}`}>
                    بمجرد اختيار الملف، سنتولى مهمة تعبئة البيانات عنك
                  </p>
                )}
              </div>

              <div className="space-y-8">
                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-16 cursor-pointer transition-all group relative overflow-hidden ${
                  isFemale ? 'border-pink-200 bg-pink-50/20 hover:border-pink-400' : 'border-white/10 bg-white/[0.02] hover:border-blue-500/40'
                }`}>
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    capture="environment"
                    className="hidden" 
                  />
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                      isFemale ? 'bg-pink-100 text-pink-500' : 'bg-white/5 text-white/40'
                    }`}>
                      <Sparkles size={38} />
                    </div>
                    <p className={`font-black text-xl mb-2 glow-text ${isFemale ? 'text-pink-600' : 'text-white'}`}>
                      اختر ملفك الآن
                    </p>
                    <p className={`text-xs font-bold ${isFemale ? 'text-pink-300' : 'text-white/20'}`}>
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
          className={`backdrop-blur-3xl border rounded-[3.5rem] max-w-2xl p-10 overflow-y-auto max-h-[90vh] ${
            isFemale ? 'bg-white/95 border-pink-200 shadow-pink-500/10' : 'bg-black/95 border-white/10'
          }`} dir="rtl"
        >
          <DialogHeader className="items-center mb-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white shadow-lg'
            }`}>
              <CheckCircle2 size={32} />
            </div>
            <DialogTitle className={`text-3xl font-black glow-text-bright ${isFemale ? 'text-pink-600' : 'text-white'}`}>
              مراجعة بيانات الملف
            </DialogTitle>
            <DialogDescription className="font-bold text-center">
              يرجى التأكد من دقة البيانات التي استخرجها الذكاء الاصطناعي.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>نوع الملف</label>
                <select 
                  value={fileType} 
                  onChange={e => setFileType(e.target.value)}
                  className={`w-full h-14 bg-white/5 border rounded-2xl px-6 font-bold outline-none ${
                    isFemale ? 'text-pink-900 border-pink-100' : 'text-white border-white/10'
                  }`}
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
                <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>اسم المادة</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full h-14 justify-between bg-white/5 border rounded-2xl px-6 font-bold text-right",
                        !subject && "text-muted-foreground",
                        isFemale ? "text-pink-900 border-pink-100" : "text-white border-white/10 glow-text"
                      )}
                    >
                      {subject || "ابحث عن مادة..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
                    <Command className="bg-transparent">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>السنة</label>
                <Input 
                  type="number"
                  value={year} 
                  onChange={e => setYear(e.target.value)}
                  className={`h-14 bg-white/5 border rounded-2xl font-bold ${
                    isFemale ? 'text-pink-900 border-pink-100' : 'text-white border-white/10'
                  }`}
                />
              </div>

              <div className="space-y-3">
                <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>الفصل</label>
                <div className="flex gap-4">
                  {['Spring', 'Fall'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      className={`flex-1 h-14 rounded-2xl font-black text-sm transition-all border ${
                        semester === s
                          ? isFemale ? 'bg-pink-500 text-white border-pink-400' : 'bg-blue-600 text-white border-blue-500'
                          : isFemale ? 'bg-pink-50 text-pink-400 border-pink-100' : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {s === 'Spring' ? 'ربيع' : 'خريف'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>اسم الدكتور</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full h-14 justify-between bg-white/5 border rounded-2xl px-6 font-bold text-right",
                      !doctorName && "text-muted-foreground",
                      isFemale ? "text-pink-900 border-pink-100" : "text-white border-white/10"
                    )}
                  >
                    {doctorName || "ابحث عن دكتور..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
                  <Command className="bg-transparent">
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
              <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>رقم الشيت / المحاضرة</label>
              <select 
                value={lectureNumber} 
                onChange={e => setLectureNumber(e.target.value)}
                className={`w-full h-14 bg-white/5 border rounded-2xl px-6 font-bold outline-none ${
                  isFemale ? 'text-pink-900 border-pink-100' : 'text-white border-white/10'
                }`}
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
              <p className={`text-[10px] font-bold px-4 ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>
                تلميح: المحاضرات المميزة بالأخضر تم رفعها مسبقاً من قبل زملائك.
              </p>
            </div>

            <div className="space-y-3">
              <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>السنة الأكاديمية</label>
              <select 
                value={academicYear} 
                onChange={e => setAcademicYear(e.target.value)}
                className={`w-full h-14 bg-white/5 border rounded-2xl px-6 font-bold outline-none ${
                  isFemale ? 'text-pink-900 border-pink-100' : 'text-white border-white/10'
                }`}
              >
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className={`text-[10px] font-black px-4 uppercase tracking-widest ${isFemale ? 'text-pink-400' : 'text-muted-foreground'}`}>ملخص الملف</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className={`w-full p-6 h-32 bg-white/5 border rounded-2xl font-bold text-xs resize-none outline-none ${
                  isFemale ? 'text-pink-900 border-pink-100' : 'text-white/60 border-white/10'
                }`}
              />
            </div>
          </div>

          <DialogFooter className="mt-12 gap-6 sm:flex-col">
            <Button
              onClick={handleFinalSubmit}
              disabled={isUploading}
              className={`w-full h-20 rounded-[2rem] font-black text-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 glow-text-bright ${
                isFemale ? 'bg-pink-500 text-white shadow-pink-500/30' : 'bg-blue-600 text-white shadow-blue-500/20'
              }`}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : "اعتماد الرفع"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowReviewModal(false)}
              className={`w-full h-14 font-black rounded-2xl ${isFemale ? 'text-pink-400 hover:bg-pink-50' : 'text-white/30'}`}
            >
              إلغاء وإعادة المحاولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
