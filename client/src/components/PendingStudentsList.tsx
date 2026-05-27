import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, User, Calendar, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingStudentsList() {
  const utils = trpc.useUtils();
  
  const { data: allStudents, isLoading } = trpc.admin.getAllStudents.useQuery();
  
  const verifyMutation = trpc.admin.verifyStudent.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.admin.getAllStudents.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "فشل تحديث حالة الطالب");
    }
  });

  const pendingStudents = allStudents?.filter(s => s.verificationStatus === 'PENDING') || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-black text-muted-foreground animate-pulse">جاري تحميل الطلبات المعلقة...</p>
      </div>
    );
  }

  if (pendingStudents.length === 0) {
    return (
      <Card className="p-20 text-center bg-card/20 dark:bg-white/5 border-dashed rounded-[3rem] border-2 border-border/50 dark:border-white/5">
        <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary/20 dark:text-white/20">
          <Shield size={40} className="dark:text-white" />
        </div>
        <h3 className="text-2xl font-black mb-2 italic dark:text-white">لا توجد طلبات انتظار حالياً</h3>
        <p className="text-muted-foreground dark:text-slate-300 font-bold">كل شيء تحت السيطرة! جميع الطلاب المسجلين تم التعامل معهم.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <h3 className="text-xl font-black flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          طلبات بانتظار المراجعة
          <span className="text-xs bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full border border-yellow-500/20">
            {pendingStudents.length} طلب
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {pendingStudents.map((student, idx) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-6 md:p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-border/50 hover:border-primary/30 transition-all group shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-yellow-500/10 to-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
                      <User size={32} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black mb-1 group-hover:text-primary transition-colors dark:text-white">{student.fullName}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground dark:text-slate-400">
                          <Shield size={12} className="text-primary/40 dark:text-white/40" />
                          رقم القيد: <span className="text-foreground dark:text-white">{student.studentID}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <Calendar size={12} className="text-primary/40" />
                          تاريخ التسجيل: <span className="text-foreground">{new Date(student.createdAt).toLocaleDateString('ar-LY')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => verifyMutation.mutate({ studentDbId: student.id, status: 'VERIFIED' })}
                      disabled={verifyMutation.isPending}
                      className="h-14 px-8 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black flex gap-2 shadow-lg shadow-green-600/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                    >
                      {verifyMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                      اعتماد ✅
                    </Button>
                    <Button
                      onClick={() => {
                        if(window.confirm('هل أنت متأكد من رفض طلب هذا الطالب؟')) {
                          verifyMutation.mutate({ studentDbId: student.id, status: 'REJECTED' });
                        }
                      }}
                      disabled={verifyMutation.isPending}
                      variant="outline"
                      className="h-14 px-8 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 font-black flex gap-2 transition-all"
                    >
                      <XCircle size={18} />
                      رفض ❌
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
