import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, MessageSquare, Trash2, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
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

  const deleteFileMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الملف بنجاح");
      myFilesQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "فشل الحذف");
    }
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <Navbar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <Card className="lg:col-span-1 p-8 rounded-[3rem] backdrop-blur-3xl bg-card/40 border-border/50 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border border-primary/20">
              <User size={48} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-black">{user.fullName}</h2>
              {user.verificationStatus === 'VERIFIED' && (
                <span className="text-blue-500 shrink-0" title="حساب موثق">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </span>
              )}
            </div>
            {user.verificationStatus === 'PENDING' && (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full text-[10px] font-black border border-yellow-500/20 mb-4">
                <span>حسابك قيد المراجعة</span>
                <span className="animate-pulse">⏳</span>
              </div>
            )}
            {user.verificationStatus === 'REJECTED' && (
              <div className="flex items-center gap-1.5 bg-red-500/10 text-red-600 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/20 mb-4">
                <span>تم رفض الحساب - تواصل مع الإدارة</span>
              </div>
            )}
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mb-6">
              {(user as any).isOAuth ? "حساب جوجل" : `رقم القيد: ${user.studentID}`}
            </p>
            <div className="w-full h-[1px] bg-border/50 mb-6" />
            <div className="flex flex-col gap-3 w-full">
               <div className="flex justify-between items-center px-4 py-3 bg-background/50 rounded-2xl">
                 <span className="text-xs font-black text-muted-foreground uppercase">الملفات</span>
                 <span className="font-black text-primary">{myFilesQuery.data?.length || 0}</span>
               </div>
               <div className="flex justify-between items-center px-4 py-3 bg-background/50 rounded-2xl">
                 <span className="text-xs font-black text-muted-foreground uppercase">التعليقات</span>
                 <span className="font-black text-primary">{myCommentsQuery.data?.length || 0}</span>
               </div>
            </div>
          </Card>

          {/* Activity Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="files" className="space-y-8">
              <TabsList className="bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-[2rem] h-16 w-full flex">
                <TabsTrigger value="files" className="flex-1 rounded-2xl h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-sm uppercase tracking-widest flex gap-2">
                  <FileText size={18} />
                  ملفاتي
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex-1 rounded-2xl h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-sm uppercase tracking-widest flex gap-2">
                  <MessageSquare size={18} />
                  تعليقاتي
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4">
                {myFilesQuery.isLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : myFilesQuery.data?.length === 0 ? (
                  <Card className="p-20 text-center bg-card/20 border-dashed rounded-[3rem]">
                    <p className="text-muted-foreground font-black italic">لم تقم برفع أي ملفات بعد</p>
                  </Card>
                ) : (
                  myFilesQuery.data?.map((file) => (
                    <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-6 rounded-[2rem] bg-card/40 border-border/50 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-lg">{file.fileName}</h3>
                          <p className="text-muted-foreground text-xs font-bold">{file.subject} • {file.year}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFileMutation.mutate({ fileId: file.id })}
                          className="text-destructive hover:bg-destructive/10 rounded-xl"
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
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : myCommentsQuery.data?.length === 0 ? (
                  <Card className="p-20 text-center bg-card/20 border-dashed rounded-[3rem]">
                    <p className="text-muted-foreground font-black italic">لم تكتب أي تعليقات بعد</p>
                  </Card>
                ) : (
                  myCommentsQuery.data?.map((comment: any) => (
                    <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-6 rounded-[2rem] bg-card/40 border-border/50">
                        <p className="font-medium text-foreground mb-3">{comment.text}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <span className="text-primary">على ملف:</span>
                          <span className="text-foreground">{comment.fileName}</span>
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
