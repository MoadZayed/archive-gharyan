import { BookOpen, Plus, Info, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { COURSES } from "@/constants/academicData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Courses() {
  useDocumentTitle("إدارة المواد الدراسية");
  const { user } = useAuth();

  const { data: enrolledCourses = [], isLoading, refetch } = trpc.students.getMyCourses.useQuery();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addCourseMutation = trpc.students.addCourse.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة المادة بنجاح");
      refetch();
    },
    onError: (err) => toast.error(err.message || "فشل إضافة المادة")
  });

  const removeCourseMutation = trpc.students.removeCourse.useMutation({
    onSuccess: () => {
      toast.success("تم إسقاط المادة بنجاح");
      refetch();
    },
    onError: (err) => toast.error(err.message || "فشل إسقاط المادة")
  });

  const handleAddCourse = (courseName: string) => {
    if (enrolledCourses.includes(courseName)) {
      toast.error("هذه المادة مضافة بالفعل");
      return;
    }
    if (enrolledCourses.length >= 6) {
      toast.error("لا يمكنك إضافة أكثر من 6 مواد في الفصل الواحد");
      return;
    }
    addCourseMutation.mutate({ courseId: courseName });
    setIsDialogOpen(false);
  };

  const handleRemoveCourse = (courseName: string) => {
    removeCourseMutation.mutate({ courseId: courseName });
  };

  const availableCourses = useMemo(() => {
    return COURSES.filter(c => !enrolledCourses.includes(c.name));
  }, [enrolledCourses]);

  if (!user || isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 p-4 md:p-12 max-w-7xl mx-auto pb-24 md:pb-12" dir="rtl">
      <Navbar />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-[100px] md:pt-[40px]">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <BookOpen className="h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
            إدارة المواد الدراسية
          </h1>
          <p className="mt-2 font-bold" style={{ color: 'var(--text-muted)' }}>
            هنا يمكنك إضافة، إسقاط، ومتابعة موادك الدراسية لهذا الفصل.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="rounded-[14px] min-h-[44px] h-[52px] px-6 font-black gap-2 shadow-[0_10px_30px_rgba(233,30,99,0.2)] flex-1 md:flex-none border-none"
            style={{ background: 'var(--button-gradient)', color: 'white' }}
          >
            <Plus size={18} />
            إضافة مادة
          </Button>
        </div>
      </div>

      {/* Section 5: My Saved Subjects */}
      <div className="border rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(233,30,99,0.05)]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
        <h2 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CheckCircle className="h-5 w-5 text-green-500" />
          موادي المحفوظة
          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>({enrolledCourses.length} / 6)</span>
        </h2>
        {enrolledCourses.length === 0 ? (
          <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>لم تقم بحفظ أي مواد بعد.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {enrolledCourses.map((course: string) => (
              <span key={course} className="px-4 py-2 border rounded-[14px] text-xs font-black" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}>
                {course}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>قائمة التعديل</h3>
        <div className="flex items-center gap-1">
          <span className="text-xl font-black" style={{ color: 'var(--accent-primary)' }}>{enrolledCourses.length}</span>
          <span className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>/ 6</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.length === 0 ? (
          <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center min-h-[200px] rounded-[3rem] col-span-full shadow-none" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
            <Info className="mb-4 h-10 w-10" style={{ color: 'var(--text-muted)' }} />
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>لا توجد مواد مسجلة حالياً</p>
            <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>ابدأ بإضافة موادك لبناء خطتك الدراسية</span>
          </Card>
        ) : (
          enrolledCourses.map((courseName: string) => {
            const courseData = COURSES.find(c => c.name === courseName);
            return (
              <motion.div
                key={courseName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 rounded-[2rem] border shadow-[0_10px_30px_rgba(233,30,99,0.1)] flex flex-col justify-between h-full transition-all" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
                        <BookOpen size={20} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCourse(courseName)}
                        className="text-red-500 hover:text-red-600 min-h-[44px] min-w-[44px] hover:bg-[rgba(239,68,68,0.1)] rounded-[14px]"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                    <h3 className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{courseName}</h3>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{courseData?.code || "COURSE"}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
      
      <div className="border p-6 rounded-[2rem] flex items-start gap-4" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
        <div className="p-3 rounded-[14px]" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-black mb-1" style={{ color: 'var(--text-primary)' }}>تنبيه النظام الذكي</h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            سيطلب منك النظام تأكيد استمراريتك في هذه المواد كل 60 يوماً لضمان دقة الأرشيف الأكاديمي. في حال عدم التفاعل، سيتم أرشفة بيانات الفصل تلقائياً.
          </p>
        </div>
      </div>

      {/* Dialog for adding courses */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-6 border" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">إضافة مادة جديدة</DialogTitle>
            <DialogDescription className="font-bold" style={{ color: 'var(--text-muted)' }}>
              اختر المادة التي تريد تسجيلها في هذا الفصل (بحد أقصى 6 مواد).
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto space-y-2 mt-4 p-2 custom-scrollbar">
            {availableCourses.length === 0 ? (
              <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>لا توجد مواد إضافية متاحة للاختيار</p>
            ) : (
              availableCourses.map((course) => (
                <div 
                  key={course.code}
                  onClick={() => handleAddCourse(course.name)}
                  className="p-4 rounded-[14px] border cursor-pointer transition-all flex justify-between items-center hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}
                >
                  <div>
                    <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{course.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{course.code}</p>
                  </div>
                  <Plus size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>
              ))
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="w-full min-h-[44px] h-[52px] rounded-[14px] font-black hover:bg-[rgba(233,30,99,0.1)] hover:text-[var(--accent-primary)]">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
