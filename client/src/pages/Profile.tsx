import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, MessageSquare, Trash2, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import ReputationBadge from "@/components/ReputationBadge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Profile() {
  const { user: authUser } = useAuth({ redirectOnUnauthenticated: true });
  const user = authUser as any;
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  useDocumentTitle("الملف الشخصي");

  const myFilesQuery = trpc.files.myFiles.useQuery(undefined, { enabled: !!user });
  const myCommentsQuery = trpc.comments.myComments.useQuery(undefined, { enabled: !!user });
  const trpcContext = trpc.useContext();

  const deleteFileMutation = trpc.files.delete.useMutation({
    onMutate: async ({ fileId }) => {
      await trpcContext.files.myFiles.cancel();
      const previousFiles = trpcContext.files.myFiles.getData();
      
      trpcContext.files.myFiles.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((f) => f.id !== fileId);
      });
      
      return { previousFiles };
    },
    onError: (err, newFile, context: any) => {
      toast.error(err.message || "فشل الحذف، يرجى المحاولة مرة أخرى");
      if (context?.previousFiles) {
        trpcContext.files.myFiles.setData(undefined, context.previousFiles);
      }
    },
    onSuccess: () => {
      toast.success("تم حذف الملف بنجاح");
    },
    onSettled: () => {
      myFilesQuery.refetch();
    }
  });

  if (!user) return null;

  return (
    <div className="min-h-screen transition-colors duration-500 pb-28 md:pb-20 relative" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      {/* Background Orbs */}
      <div 
        className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />
      <div 
        className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(194,24,91,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)', opacity: 0.15 }}
      />

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-[100px] md:pt-[120px] pb-12 relative z-10 w-full">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <Card className="lg:col-span-1 p-8 rounded-[3rem] backdrop-blur-3xl border text-center flex flex-col items-center shadow-[0_10px_30px_rgba(233,30,99,0.1)]"
                style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
            <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-6 border" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)', borderColor: 'var(--border-pink)' }}>
              <User size={48} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{user.fullName}</h2>
              {user.verificationStatus === 'VERIFIED' && (
                <span className="shrink-0" style={{ color: 'var(--accent-primary)' }} title="حساب موثق">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
              )}
            </div>
            <div className="mb-4">
              <ReputationBadge points={user.petals} />
            </div>
            {user.verificationStatus === 'PENDING' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border mb-4" style={{ backgroundColor: 'rgba(234,179,8,0.1)', color: 'rgb(202,138,4)', borderColor: 'rgba(234,179,8,0.2)' }}>
                <span>حسابك قيد المراجعة</span>
                <span className="animate-pulse">⏳</span>
              </div>
            )}
            {user.verificationStatus === 'REJECTED' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'rgb(220,38,38)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <span>تم رفض الحساب - تواصل مع الإدارة</span>
              </div>
            )}
            <p className="font-bold uppercase tracking-widest text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              {(user as any).isOAuth ? "حساب جوجل" : `رقم القيد: ${user.studentID}`}
            </p>
            <div className="w-full h-[1px] mb-6" style={{ backgroundColor: 'var(--border-pink)' }} />
            <div className="flex flex-col gap-3 w-full">
               <div className="flex justify-between items-center px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--glass-white)' }}>
                 <span className="text-xs font-black uppercase" style={{ color: 'var(--text-muted)' }}>الملفات</span>
                 <span className="font-black" style={{ color: 'var(--accent-primary)' }}>{myFilesQuery.data?.length || 0}</span>
               </div>
               <div className="flex justify-between items-center px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--glass-white)' }}>
                 <span className="text-xs font-black uppercase" style={{ color: 'var(--text-muted)' }}>التعليقات</span>
                 <span className="font-black" style={{ color: 'var(--accent-primary)' }}>{myCommentsQuery.data?.length || 0}</span>
               </div>
            </div>
          </Card>

          {/* Theme Preferences */}
          <Card className="p-8 md:p-10 backdrop-blur-3xl border rounded-[3rem] shadow-[0_10px_40px_rgba(233,30,99,0.1)] flex flex-col items-center" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
            <h2 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>تفضيلات الواجهة</h2>
            
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
                <div className="flex flex-col">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>نوع ومظهر الواجهة</span>
                  <span className="text-xs font-bold mt-1" style={{ color: 'var(--text-muted)' }}>يغير ألوان المنصة بالكامل وبين الوضع المظلم والمضئ</span>
                </div>
                <ThemeToggle />
              </div>

              {/* Theme Preview Strip */}
              <div className="flex justify-center">
                <div className="flex gap-2 p-2 rounded-full border shadow-sm" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: 'var(--bg-secondary)' }}></div>
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: 'var(--bg-cards)' }}></div>
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: 'var(--text-primary)' }}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Tabs */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Tabs defaultValue="files" className="space-y-8">
              <TabsList className="backdrop-blur-xl border p-2 rounded-[2rem] h-16 w-full flex" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <TabsTrigger value="files" className="flex-1 rounded-2xl h-full data-[state=active]:bg-[var(--glass-white)] data-[state=active]:shadow-lg font-black text-sm uppercase tracking-widest flex gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FileText size={18} />
                  ملفاتي
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex-1 rounded-2xl h-full data-[state=active]:bg-[var(--glass-white)] data-[state=active]:shadow-lg font-black text-sm uppercase tracking-widest flex gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MessageSquare size={18} />
                  تعليقاتي
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4">
                {myFilesQuery.isLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--accent-primary)' }} /></div>
                ) : myFilesQuery.data?.length === 0 ? (
                  <Card className="p-20 text-center border-dashed rounded-[3rem]" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
                    <p className="font-black italic" style={{ color: 'var(--text-muted)' }}>لم تقم برفع أي ملفات بعد</p>
                  </Card>
                ) : (
                  myFilesQuery.data?.map((file) => (
                    <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-6 rounded-[2rem] border flex justify-between items-center" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                        <div>
                          <h3 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{file.fileName}</h3>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{file.subject} • {file.year}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFileMutation.mutate({ fileId: file.id })}
                          className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[rgba(239,68,68,0.1)] text-red-500"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                {myCommentsQuery.isLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--accent-primary)' }} /></div>
                ) : myCommentsQuery.data?.length === 0 ? (
                  <Card className="p-20 text-center border-dashed rounded-[3rem]" style={{ backgroundColor: 'var(--glass-white)', borderColor: 'var(--border-pink)' }}>
                    <p className="font-black italic" style={{ color: 'var(--text-muted)' }}>لم تكتب أي تعليقات بعد</p>
                  </Card>
                ) : (
                  myCommentsQuery.data?.map((comment: any) => (
                    <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-6 rounded-[2rem] border" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                        <p className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>{comment.text}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: 'var(--accent-primary)' }}>على ملف:</span>
                          <span style={{ color: 'var(--text-primary)' }}>{comment.fileName}</span>
                          <span className="mx-2 opacity-30">•</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
