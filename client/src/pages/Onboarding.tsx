import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  BookOpen, 
  AlertCircle, 
  ChevronRight, 
  GraduationCap,
  Loader2,
  X,
  ArrowRight,
  LogOut
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { COURSES_BY_SEMESTER } from "@/lib/academicData";

export default function Onboarding() {
  const [location, navigate] = useLocation();
  const { user, refresh, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { gender, setGender, mode, setMode } = useTheme();
  
  const [selectedCourses, setSelectedCourses] = useState<string[]>(() => {
    if (!user?.enrolledCourses) return [];
    try {
      return typeof user.enrolledCourses === 'string' 
        ? JSON.parse(user.enrolledCourses) 
        : user.enrolledCourses;
    } catch {
      return [];
    }
  });
  const [activeSemester, setActiveSemester] = useState(COURSES_BY_SEMESTER[0].semester);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const saveMutation = trpc.students.completeOnboarding.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث موادك بنجاح! جاري توجيهك...");
      // Use window.location.href for a full reload to ensure global state (onboardingCompleted) is updated
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const resetMutation = trpc.auth.resetSemester.useMutation({
    onSuccess: async () => {
      await refresh();
      setSelectedCourses([]);
      setIsResetOpen(false);
      toast.success("تم تصفير الفصل الدراسي بنجاح. يمكنك الآن اختيار مواد جديدة.");
      navigate("/onboarding", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const toggleCourse = (course: string) => {
    // ... same as before
    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else {
      if (selectedCourses.length >= 6) {
        toast.error("لقد وصلت للحد الأقصى (6 مواد)");
        return;
      }
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleConfirmSave = () => {
    if (selectedCourses.length === 0) {
      toast.error("يرجى اختيار مادة واحدة على الأقل");
      return;
    }
    saveMutation.mutate({ enrolledCourses: JSON.stringify(selectedCourses) });
  };

  if (!user) return null;

  const isOnboarding = location === "/onboarding";

  return (
    <div className="min-h-screen font-sans relative overflow-hidden transition-colors duration-500 pb-20" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Background Decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.1 }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: 'var(--accent-secondary)', opacity: 0.1 }} />

      {/* Sticky Selected Courses Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md border-b py-3 px-6 shadow-sm" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--glass-white)', opacity: 0.95 }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Top Row: Logo and Buttons */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ color: 'var(--text-primary)' }} />
              <span className="font-black text-lg tracking-tight hidden sm:inline-block" style={{ color: 'var(--text-primary)' }}>GITA <span style={{ color: 'var(--accent-primary)' }}>Archive</span></span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/files")} 
                className="font-bold gap-2 transition-colors h-9"
                style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden xs:inline">العودة للملفات</span>
                <span className="xs:hidden">رجوع</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logout()} 
                className="font-bold gap-2 h-9"
                style={{ backgroundColor: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.2)', color: '#ff4081' }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xs:inline">خروج</span>
              </Button>
              
              <Button 
                onClick={handleConfirmSave} 
                disabled={saveMutation.isPending || selectedCourses.length === 0} 
                size="sm" 
                className="font-black gap-2 shadow-[0_10px_20px_rgba(233,30,99,0.3)] transition-all active:scale-95 border-none h-9 disabled:opacity-50"
                style={{ background: 'var(--button-gradient)', color: 'white' }}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                حفظ
              </Button>
            </div>
          </div>

          {/* Bottom Row: Badges */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar items-center py-1">
            {selectedCourses.length > 0 ? (
              selectedCourses.map(course => (
                <button 
                  key={course}
                  onClick={() => toggleCourse(course)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-colors whitespace-nowrap group border"
                  style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--text-primary)', borderColor: 'var(--border-pink)' }}
                >
                  {course}
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:text-[var(--accent-secondary)]" />
                </button>
              ))
            ) : (
              <span className="text-xs font-bold italic" style={{ color: 'var(--text-muted)' }}>لم يتم اختيار أي مواد بعد</span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col min-h-screen">
        <header className="text-center mb-12">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full border text-xs font-black uppercase tracking-[0.2em] mb-6"
            style={{ backgroundColor: 'rgba(233,30,99,0.1)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
          >
            <GraduationCap className="h-4 w-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            {isOnboarding ? "بداية فصل دراسي جديد" : "إدارة المواد الدراسية"}
          </motion.div>
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-6xl font-black mb-4 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {isOnboarding ? (
              <>
                <span style={{ color: 'var(--text-primary)' }}>GITA </span>
                <span style={{ color: 'var(--accent-primary)' }}>Archive</span>
              </>
            ) : (
              <span>قائمة موادك</span>
            )}
          </motion.h1>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold max-w-2xl mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            {isOnboarding 
              ? "يرجى اختيار موادك لهذا الفصل (بحد أقصى 6 مواد) لتتمكن من الوصول للأرشيف الأكاديمي."
              : "يمكنك إضافة أو حذف المواد التي تدرسها في هذا الفصل الدراسي."}
          </motion.p>
        </header>

        {isOnboarding && (
          <div className="flex flex-col items-center mb-10 w-full max-w-lg mx-auto p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
            <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-center" style={{ color: 'var(--text-primary)' }}>اختر تفضيلات الواجهة (بناءً على الجنس)</h3>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setGender('male')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border-2 ${gender === 'male' ? 'shadow-lg scale-105' : 'opacity-60'}`}
                style={{ 
                  backgroundColor: gender === 'male' ? 'var(--accent-primary)' : 'var(--glass-white)',
                  borderColor: gender === 'male' ? 'var(--accent-primary)' : 'var(--border-pink)',
                  color: gender === 'male' ? 'white' : 'var(--text-primary)'
                }}
              >
                <div className="font-bold text-lg mb-1">واجهة الطلاب</div>
                <div className="text-xs opacity-80">اللون الأزرق</div>
              </button>

              <button 
                onClick={() => setGender('female')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border-2 ${gender === 'female' ? 'shadow-lg scale-105' : 'opacity-60'}`}
                style={{ 
                  backgroundColor: gender === 'female' ? 'var(--accent-primary)' : 'var(--glass-white)',
                  borderColor: gender === 'female' ? 'var(--accent-primary)' : 'var(--border-pink)',
                  color: gender === 'female' ? 'white' : 'var(--text-primary)'
                }}
              >
                <div className="font-bold text-lg mb-1">واجهة الطالبات</div>
                <div className="text-xs opacity-80">اللون الوردي/البنفسجي</div>
              </button>
            </div>
            
            <div className="mt-6 w-full flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>تبديل الوضع (مظلم/مضئ):</span>
              <ThemeToggle />
            </div>
            <p className="text-[10px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>* معاينة مباشرة: ستتغير ألوان الشاشة بالكامل بناءً على اختيارك.</p>
          </div>
        )}

        <div className="flex flex-nowrap md:justify-center gap-2 mb-10 overflow-x-auto pb-4 custom-scrollbar px-4 md:px-0">
          {COURSES_BY_SEMESTER.map((group) => (
            <button
              key={group.semester}
              onClick={() => setActiveSemester(group.semester)}
              className="px-6 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap border-2"
              style={{
                backgroundColor: activeSemester === group.semester ? 'var(--accent-primary)' : 'var(--glass-white)',
                borderColor: activeSemester === group.semester ? 'var(--accent-primary)' : 'var(--border-pink)',
                color: activeSemester === group.semester ? 'white' : 'var(--text-primary)'
              }}
            >
              {group.semester}
            </button>
          ))}
        </div>

        <div className="pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSemester}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {COURSES_BY_SEMESTER.find(g => g.semester === activeSemester)?.courses.map((course, idx) => {
                const courseFull = `${course.code} - ${course.name}`;
                const isSelected = selectedCourses.includes(courseFull);
                const isLimitReached = selectedCourses.length >= 6 && !isSelected;

                return (
                  <motion.div
                    key={course.code}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <button
                      onClick={() => toggleCourse(courseFull)}
                      disabled={isLimitReached}
                      className="w-full h-32 rounded-[2rem] border transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4 relative group"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-primary)' : (isLimitReached ? 'rgba(0,0,0,0.5)' : 'var(--bg-cards)'),
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-pink)',
                        color: 'var(--text-primary)',
                        opacity: isLimitReached ? 0.4 : 1,
                        boxShadow: isSelected ? '0 10px 30px rgba(233,30,99,0.3)' : 'none'
                      }}
                    >
                      <div className="p-2 rounded-xl transition-colors" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(233,30,99,0.1)' }}>
                        <BookOpen className="h-5 w-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ color: isSelected ? 'white' : 'var(--text-primary)' }} />
                      </div>
                      <div className="flex flex-col gap-1 text-center">
                        <span className="text-[9px] font-black opacity-60" style={{ color: isSelected ? 'white' : 'var(--text-primary)' }}>
                          {course.code}
                        </span>
                        <span className="text-[11px] font-black leading-tight" style={{ color: isSelected ? 'white' : 'var(--text-primary)' }}>
                          {course.name}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg border"
                          style={{ color: 'var(--accent-primary)', borderColor: 'var(--border-pink)' }}
                        >
                          <CheckCircle size={14} />
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 backdrop-blur-3xl border p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(233,30,99,0.15)]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
            <div className="flex items-center justify-between w-full md:w-auto gap-6">
              <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-0">
                <span className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>المواد المختارة</span>
                <div className="flex items-center gap-1">
                  <span className="text-2xl md:text-3xl font-black" style={{ color: 'var(--accent-primary)' }}>{selectedCourses.length}</span>
                  <span className="font-bold text-base md:text-lg" style={{ color: 'var(--text-primary)' }}>/ 6</span>
                </div>
              </div>
              
              {!isOnboarding && (
                <Button
                  variant="ghost"
                  onClick={() => setIsResetOpen(true)}
                  className="font-black text-xs hover:bg-[rgba(255,0,0,0.1)] rounded-xl px-4 h-10 border"
                  style={{ color: '#ff4081', borderColor: 'rgba(233,30,99,0.2)' }}
                >
                  إنهاء الفصل الدراسي
                </Button>
              )}
            </div>

            <Button
              onClick={() => setIsConfirmOpen(true)}
              disabled={selectedCourses.length === 0 || saveMutation.isPending}
              className="h-12 md:h-14 px-6 md:px-12 w-full md:w-auto font-black text-base md:text-lg rounded-xl md:rounded-2xl shadow-[0_10px_30px_rgba(233,30,99,0.3)] flex gap-3 transition-all hover:scale-[1.02] active:scale-95 justify-center border-none disabled:opacity-50"
              style={{ background: 'var(--button-gradient)', color: 'white' }}
            >
              {isOnboarding ? "اعتماد المواد" : "حفظ التغييرات"}
              {saveMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : <ChevronRight className="rotate-180 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xl backdrop-blur-3xl border rounded-[2.5rem] p-10" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>هل أنت متأكد من اختيارك؟ 🎓</DialogTitle>
            <DialogDescription className="text-center font-bold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              بمجرد التأكيد، سيتم تحديث قائمة موادك الدراسية. يمكنك العودة لتعديلها في أي وقت من خلال صفحة "موادي الدراسية".
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[2rem] p-6 my-8 border" style={{ backgroundColor: 'rgba(233,30,99,0.05)', borderColor: 'var(--border-pink)' }}>
            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--accent-primary)' }}>
              <BookOpen size={14} />
              قائمة موادك المختارة:
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map(course => (
                <span key={course} className="px-4 py-2 border rounded-xl text-xs font-black" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
                  {course}
                </span>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-14 rounded-2xl font-black hover:bg-[rgba(233,30,99,0.1)]"
              style={{ color: 'var(--text-muted)' }}
            >
              تعديل الاختيارات
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saveMutation.isPending}
              className="flex-[2] h-14 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(233,30,99,0.3)] border-none"
              style={{ background: 'var(--button-gradient)', color: 'white' }}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" /> : "نعم، تأكيد المواد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Semester Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md backdrop-blur-3xl border rounded-[2.5rem] p-10" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-4" style={{ color: '#ff4081' }}>هل أتممت الفصل الدراسي؟ 🎓</DialogTitle>
            <DialogDescription className="text-center font-bold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              سيؤدي هذا الإجراء إلى تفريغ قائمة موادك الحالية وإعادتك لمرحلة اختيار المواد. لن يؤدي هذا لحذف ملفاتك المرفوعة مسبقاً.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-row-reverse gap-3 mt-6 justify-center">
            <Button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="h-10 rounded-xl font-black text-sm px-6 shadow-lg border-none hover:opacity-90 transition-opacity"
              style={{ background: 'var(--button-gradient)', color: 'white' }}
            >
              {resetMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "نعم"}
            </Button>
            <Button
              onClick={() => setIsResetOpen(false)}
              variant="outline"
              className="h-10 rounded-xl font-black text-sm px-6 hover:bg-[rgba(233,30,99,0.1)] transition-colors border"
              style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
            >
              لا
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
