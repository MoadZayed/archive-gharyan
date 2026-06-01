import {
  Dialog as ShadcnDialog,
  DialogContent as ShadcnDialogContent,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileWarning, Maximize2, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: number;
    fileName: string;
    fileUrl: string;
    mimeType: string;
  } | null;
  onDownload: () => void;
}

export default function FilePreviewModal({ isOpen, onClose, file, onDownload }: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);
  const downloadMutation = trpc.files.download.useMutation();

  const handleDownloadWrapper = async () => {
    if (!file) return;
    setDownloading(true);
    setDownloadErr(null);
    try {
      const res = await downloadMutation.mutateAsync({ fileId: file.id });
      if (!res.url) throw new Error("لا يوجد رابط متاح");
      
      const isIOS = /iP(hone|od|ad)/.test(navigator.platform) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
      if (isIOS) {
        window.open(res.url, "_blank", "noopener,noreferrer");
        // Fallback if blocked
        setTimeout(() => {
          if (document.hidden) return; 
          window.location.href = res.url;
        }, 300);
      } else {
        const a = document.createElement("a");
        a.href = res.url;
        a.rel = "noreferrer";
        a.download = res.fileName || file.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e: any) {
      setDownloadErr(e?.message ?? "فشل التحميل، حاول مرة أخرى");
    } finally {
      setDownloading(false);
    }
  };

  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType.toLowerCase().includes("pdf");
  const canPreview = isImage || isPdf;

  // ✅ Construct absolute URL (Fixed instructions point 2 & 3)
  const rawBackendUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
  const backendUrl = rawBackendUrl.replace(/\/+$/, "");
  const cleanFileUrl = file.fileUrl.startsWith('/') ? file.fileUrl : `/${file.fileUrl}`;
  const absoluteUrl = file.fileUrl.startsWith('http') 
    ? file.fileUrl 
    : `${backendUrl}${cleanFileUrl}`;

  return (
    <ShadcnDialog open={isOpen} onOpenChange={onClose}>
      <ShadcnDialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
        <ShadcnDialogHeader className="p-6 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="p-3 rounded-2xl shrink-0" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
                <Eye size={24} />
              </div>
              <ShadcnDialogTitle className="text-xl font-black truncate">
                {file.fileName}
              </ShadcnDialogTitle>
            </div>
            <Button 
              onClick={handleDownloadWrapper}
              disabled={downloading}
              className="shrink-0 rounded-xl font-bold flex gap-2 border-none text-white shadow-lg disabled:opacity-70"
              style={{ background: 'var(--button-gradient)' }}
            >
              {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              {downloading ? "جاري التجهيز..." : "تحميل الملف"}
            </Button>
          </div>
          {downloadErr && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-center">
              <p className="text-red-500 font-bold mb-3">{downloadErr}</p>
              <Button 
                variant="outline" 
                onClick={handleDownloadWrapper}
                disabled={downloading}
                className="text-red-500 border-red-500/30 hover:bg-red-500/20 font-bold disabled:opacity-70"
              >
                إعادة المحاولة
              </Button>
            </div>
          )}
          <p className="mt-2 text-xs font-bold opacity-70 text-[var(--text-muted)]">
            ملاحظة: رابط التحميل مؤقت وقد ينتهي. إذا فشل التحميل اضغط "تحميل" مرة أخرى.
          </p>
        </ShadcnDialogHeader>

        <div className="flex-1 bg-muted/30 relative overflow-auto flex items-center justify-center p-4">
          {isImage ? (
            <div className="relative transition-transform duration-200 ease-out" style={{ transform: `scale(${zoom})` }}>
              <img 
                src={absoluteUrl} 
                alt={file.fileName} 
                loading="lazy"
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            </div>
          ) : isPdf ? (
            <iframe 
              src={`${absoluteUrl}#toolbar=1&navpanes=0&scrollbar=1`} 
              className="w-full h-full rounded-lg border shadow-inner bg-white"
              title={file.fileName}
            />
          ) : (
            <div className="flex flex-col items-center text-center max-w-sm px-6">
              <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mb-6">
                <FileWarning size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black mb-2">المعاينة غير مدعومة</h3>
              <p className="text-muted-foreground font-bold mb-8">
                هذا النوع من الملفات يتطلب التنزيل المباشر ليتم عرضه على جهازك.
              </p>
              <Button onClick={handleDownloadWrapper} disabled={downloading} size="lg" className="w-full rounded-2xl h-14 font-black text-lg gap-3 disabled:opacity-70">
                {downloading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                {downloading ? "جاري تجهيز الرابط..." : "تحميل الملف"}
              </Button>
            </div>
          )}

          {isImage && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-background/80 backdrop-blur shadow-2xl rounded-2xl border border-border/50 z-10">
              <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="rounded-xl">
                <ZoomOut size={20} />
              </Button>
              <span className="w-12 text-center font-black text-sm">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.min(3, prev + 0.25))} className="rounded-xl">
                <ZoomIn size={20} />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="ghost" size="icon" onClick={() => setZoom(1)} title="إعادة التعيين" className="rounded-xl">
                <Maximize2 size={20} />
              </Button>
            </div>
          )}
        </div>
      </ShadcnDialogContent>
    </ShadcnDialog>
  );
}
