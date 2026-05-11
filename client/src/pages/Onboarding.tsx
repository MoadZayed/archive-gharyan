import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  BookOpen, 
  AlertCircle, 
  ChevronRight, 
  GraduationCap,
  Loader2,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

import { COURSES_BY_SEMESTER } from "@/lib/academicData";

export default function Onboarding() {
  const [location, navigate] = useLocation();
  const { user, refresh } = useAuth({ redirectOnUnauthenticated: true });
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

  const saveMutation = trpc.auth.completeOnboarding.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("تم تحديث موادك بنجاح!");
      if (location === "/onboarding") {
        navigate("/files", { replace: true });
      }
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
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden transition-colors duration-500 pb-20">
      {/* Background Decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col h-screen">
        <header className="text-center mb-12">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em] mb-6"
          >
            <GraduationCap className="h-4 w-4" />
            {isOnboarding ? "بداية فصل دراسي جديد" : "إدارة المواد الدراسية"}
          </motion.div>
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
          >
            {isOnboarding ? "أهلاً بك في " : "تعديل "}
            <span className="text-primary">{isOnboarding ? "GITA Archive" : "قائمة موادك"}</span>
          </motion.h1>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg font-bold max-w-2xl mx-auto"
          >
            {isOnboarding 
              ? "يرجى اختيار موادك لهذا الفصل (بحد أقصى 6 مواد) لتتمكن من الوصول للأرشيف الأكاديمي."
              : "يمكنك إضافة أو حذف المواد التي تدرسها في هذا الفصل الدراسي."}
          </motion.p>
        </header>

        <div className="flex flex-wrap justify-center gap-2 mb-10 overflow-x-auto pb-4 custom-scrollbar">
          {COURSES_BY_SEMESTER.map((group) => (
            <button
              key={group.semester}
              onClick={() => setActiveSemester(group.semester)}
              className={`px-6 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap border-2
                ${activeSemester === group.semester 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-card/40 border-border text-muted-foreground hover:border-primary/30"}
              `}
            >
              {group.semester}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-32">
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
                      className={`w-full h-32 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4 relative group
                        ${isSelected 
                          ? "bg-primary border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                          : isLimitReached 
                            ? "bg-muted/50 border-border opacity-40 grayscale cursor-not-allowed" 
                            : "bg-card/50 border-border hover:border-primary/50 hover:bg-card shadow-sm"}
                      `}
                    >
                      <div className={`p-2 rounded-xl transition-colors ${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}>
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1 text-center">
                        <span className={`text-[9px] font-black opacity-60 ${isSelected ? "text-white" : "text-primary"}`}>
                          {course.code}
                        </span>
                        <span className={`text-[11px] font-black leading-tight ${isSelected ? "text-white" : "text-foreground"}`}>
                          {course.name}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="absolute -top-2 -right-2 bg-white text-primary rounded-full p-1 shadow-lg border border-primary/20"
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
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 bg-card/40 backdrop-blur-3xl border border-border/50 p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">المواد المختارة</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-primary">{selectedCourses.length}</span>
                  <span className="text-muted-foreground font-bold text-lg">/ 6</span>
                </div>
              </div>
              
              {!isOnboarding && (
                <Button
                  variant="ghost"
                  onClick={() => setIsResetOpen(true)}
                  className="text-destructive font-black text-xs hover:bg-destructive/10 rounded-xl px-4 h-10 border border-destructive/20"
                >
                  إنهاء الفصل الدراسي
                </Button>
              )}
            </div>

            <Button
              onClick={() => setIsConfirmOpen(true)}
              disabled={selectedCourses.length === 0 || saveMutation.isPending}
              className="h-14 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg rounded-2xl shadow-xl shadow-primary/20 flex gap-3 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isOnboarding ? "اعتماد المواد" : "حفظ التغييرات"}
              {saveMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : <ChevronRight className="rotate-180 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xl bg-card/90 backdrop-blur-2xl border-border rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-center mb-4">هل أنت متأكد من اختيارك؟ 🎓</DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground leading-relaxed">
              بمجرد التأكيد، سيتم تحديث قائمة موادك الدراسية. يمكنك العودة لتعديلها في أي وقت من خلال صفحة "موادي الدراسية".
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary/5 rounded-[2rem] p-6 my-8 border border-primary/10">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen size={14} />
              قائمة موادك المختارة:
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map(course => (
                <span key={course} className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-black">
                  {course}
                </span>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 h-14 rounded-2xl font-black text-muted-foreground hover:bg-muted/50"
            >
              تعديل الاختيارات
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={saveMutation.isPending}
              className="flex-[2] h-14 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" /> : "نعم، تأكيد المواد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Semester Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md bg-card/90 backdrop-blur-2xl border-border rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-4 text-destructive">هل أتممت الفصل الدراسي؟ 🎓</DialogTitle>
            <DialogDescription className="text-center font-bold text-muted-foreground leading-relaxed">
              سيؤدي هذا الإجراء إلى تفريغ قائمة موادك الحالية وإعادتك لمرحلة اختيار المواد. لن يؤدي هذا لحذف ملفاتك المرفوعة مسبقاً.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={() => setIsResetOpen(false)}
              variant="outline"
              className="h-14 rounded-2xl font-black border-border hover:bg-muted/50"
            >
              تراجع
            </Button>
            <Button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              variant="destructive"
              className="h-14 rounded-2xl font-black text-lg shadow-xl shadow-destructive/20"
            >
              {resetMutation.isPending ? <Loader2 className="animate-spin" /> : "نعم، إنهاء الفصل الدراسي"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
