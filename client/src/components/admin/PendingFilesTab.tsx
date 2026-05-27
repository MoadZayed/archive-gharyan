import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, X, Eye, FileBox } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import FilePreviewModal from "@/components/FilePreviewModal";

export default function PendingFilesTab() {
  const { data: files, isLoading, refetch } = trpc.admin.getPendingFiles.useQuery();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ id: number; fileName: string; fileUrl: string; mimeType: string } | null>(null);

  const approveMutation = trpc.admin.approveFile.useMutation({
    onSuccess: () => {
      toast.success("تم قبول الملف ونشره للطلاب ✓");
      refetch();
    },
    onError: () => toast.error("حدث خطأ، يرجى المحاولة مرة أخرى")
  });

  const rejectMutation = trpc.admin.rejectFile.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الملف");
      setRejectModalOpen(false);
      setRejectReason("");
      setSelectedFile(null);
      refetch();
    },
    onError: () => toast.error("حدث خطأ، يرجى المحاولة مرة أخرى")
  });

  const handleReject = () => {
    if (rejectReason.trim().length < 5) {
      toast.error("يجب توضيح سبب الرفض");
      return;
    }
    if (selectedFile) {
      rejectMutation.mutate({ fileId: selectedFile, reason: rejectReason });
    }
  };

  const handlePreview = (file: any) => {
    setPreviewFile({ id: file.id, fileName: file.fileName, fileUrl: file.fileUrl, mimeType: file.mimeType });
    setPreviewModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl bg-muted/50" />)}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 rounded-3xl opacity-70">
        <FileBox size={64} className="mb-4 text-muted-foreground" />
        <h3 className="text-xl font-bold text-muted-foreground">لا توجد ملفات بانتظار المراجعة</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="p-5 flex flex-col justify-between gap-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <div className="text-right">
            <h3 className="font-bold text-lg text-primary truncate" title={file.fileName}>{file.fileName}</h3>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              {file.subject} {file.courseCode && `(${file.courseCode})`}
            </p>
            <div className="text-xs text-muted-foreground flex gap-3 mt-2 flex-wrap">
              <span>تاريخ الرفع: {new Date(file.createdAt).toLocaleDateString('ar-LY')}</span>
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-bold">
                {file.fileType}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => handlePreview(file)}
              className="flex-1 rounded-xl h-10 border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Eye className="ml-2 h-4 w-4" />
              معاينة
            </Button>
            <Button
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate({ fileId: file.id })}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10"
            >
              {approveMutation.isPending && approveMutation.variables?.fileId === file.id ? <Loader2 className="animate-spin ml-1 h-4 w-4" /> : <Check className="ml-1 h-4 w-4" />}
              قبول
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setSelectedFile(file.id); setRejectModalOpen(true); }}
              className="flex-1 rounded-xl h-10"
            >
              <X className="ml-1 h-4 w-4" />
              رفض
            </Button>
          </div>
        </Card>
      ))}

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>رفض الملف</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="اكتب سبب الرفض ليتم عرضه للطالب..." 
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

      <FilePreviewModal 
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        file={previewFile}
        onDownload={() => {}}
      />
    </div>
  );
}
