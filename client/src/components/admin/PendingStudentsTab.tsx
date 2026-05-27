import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function PendingStudentsTab() {
  const { data: students, isLoading, refetch } = trpc.admin.getPendingStudents.useQuery();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = trpc.admin.approveStudent.useMutation({
    onSuccess: () => {
      toast.success("تم قبول الطالب بنجاح ✓");
      refetch();
    },
    onError: () => toast.error("حدث خطأ، يرجى المحاولة مرة أخرى")
  });

  const rejectMutation = trpc.admin.rejectStudent.useMutation({
    onSuccess: () => {
      toast.success("تم رفض طلب التسجيل");
      setRejectModalOpen(false);
      setRejectReason("");
      setSelectedStudent(null);
      refetch();
    },
    onError: () => toast.error("حدث خطأ، يرجى المحاولة مرة أخرى")
  });

  const handleReject = () => {
    if (rejectReason.trim().length < 10) {
      toast.error("يجب أن يكون سبب الرفض 10 أحرف على الأقل");
      return;
    }
    if (selectedStudent) {
      rejectMutation.mutate({ userId: selectedStudent, reason: rejectReason });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted/50" />)}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 rounded-3xl opacity-70">
        <ShieldAlert size={64} className="mb-4 text-muted-foreground" />
        <h3 className="text-xl font-bold text-muted-foreground">لا توجد طلبات تسجيل معلقة في الوقت الحالي</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student) => (
        <Card key={student.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <div className="flex-1 text-right w-full">
            <h3 className="font-bold text-lg">{student.fullName}</h3>
            <div className="text-sm text-muted-foreground flex gap-4 flex-wrap mt-1">
              {student.studentID && <span>رقم القيد: {student.studentID}</span>}
              <span>تاريخ الطلب: {new Date(student.createdAt).toLocaleDateString('ar-LY')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate({ userId: student.id })}
              className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white rounded-xl h-10"
            >
              {approveMutation.isPending && approveMutation.variables?.userId === student.id ? <Loader2 className="animate-spin ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
              قبول
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setSelectedStudent(student.id); setRejectModalOpen(true); }}
              className="flex-1 md:flex-none rounded-xl h-10"
            >
              <X className="ml-2 h-4 w-4" />
              رفض
            </Button>
          </div>
        </Card>
      ))}

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>رفض طلب التسجيل</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="اكتب سبب الرفض هنا..." 
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="min-h-[120px] rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)', color: 'var(--text-primary)' }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="rounded-xl">إلغاء</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending} className="rounded-xl">
              {rejectMutation.isPending ? <Loader2 className="animate-spin ml-2 h-4 w-4" /> : 'تأكيد الرفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
