import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Users, 
  FileText, 
  Files as FilesIcon, 
  Megaphone, 
  LogOut, 
  ShieldCheck, 
  LayoutDashboard, 
  Loader2, 
  Send 
} from "lucide-react";
import PendingStudentsTab from "@/components/admin/PendingStudentsTab";
import PendingFilesTab from "@/components/admin/PendingFilesTab";
import { Textarea } from "@/components/ui/textarea";

export default function ModeratorPanel() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementAudience, setAnnouncementAudience] = useState<"all" | "students" | "moderators">("all");

  const { data: pendingStudentsCount } = trpc.admin.getPendingStudents.useQuery();
  const { data: pendingFilesCount } = trpc.admin.getPendingFiles.useQuery();
  const { data: announcements, refetch: refetchAnnouncements } = trpc.announcements.getAll.useQuery();

  const createAnnouncementMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الإعلان بنجاح");
      setAnnouncementContent("");
      refetchAnnouncements();
    },
    onError: () => toast.error("حدث خطأ أثناء إرسال الإعلان")
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "student") {
      navigate("/");
    }
    if (user.isAdmin) {
      navigate("/admin");
    }
  }, [user, navigate]);

  if (!user || user.role === "student" || user.isAdmin) return null;

  let perms: any = {};
  try {
    perms = JSON.parse(user.moderatorPermissions || "{}");
  } catch (e) {
    perms = {};
  }

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      toast.error("فشل تسجيل الخروج");
    }
  };

  const handleSendAnnouncement = () => {
    if (announcementContent.trim().length < 5) return toast.error("الإعلان قصير جداً");
    createAnnouncementMutation.mutate({ content: announcementContent, targetAudience: announcementAudience });
  };

  const hasNoPerms = !perms.can_approve_students && !perms.can_approve_files && !perms.can_view_files && !perms.can_send_announcements && !perms.can_delete_files;

  if (hasNoPerms) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" dir="rtl">
          <ShieldCheck className="h-24 w-24 text-muted-foreground mb-6 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">لا توجد صلاحيات مخصصة لحسابك</h1>
          <p className="text-muted-foreground mb-8">يرجى التواصل مع مسؤول النظام لتفعيل صلاحياتك</p>
          <Button onClick={handleLogout} variant="outline" className="gap-2 rounded-xl border-destructive text-destructive">
            <LogOut size={16} /> تسجيل الخروج
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-20" dir="rtl">
        {/* Header */}
        <div className="bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">لوحة المشرفين</h1>
              <p className="text-xs text-muted-foreground">مرحباً، {user.fullName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 rounded-xl px-4 gap-2 font-bold">
            <LogOut size={16} />
            خروج
          </Button>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
            <Button 
              variant={activeTab === "dashboard" ? "default" : "ghost"} 
              className={`justify-start gap-3 rounded-xl h-12 font-bold ${activeTab === "dashboard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={18} /> نظرة عامة
            </Button>

            {perms.can_approve_students && (
              <Button 
                variant={activeTab === "students" ? "default" : "ghost"} 
                className={`justify-start gap-3 rounded-xl h-12 font-bold ${activeTab === "students" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveTab("students")}
              >
                <Users size={18} /> طلبات التسجيل 
                {pendingStudentsCount?.length ? <span className="ml-auto bg-primary-foreground text-primary px-2 rounded-full text-[10px]">{pendingStudentsCount.length}</span> : null}
              </Button>
            )}

            {perms.can_approve_files && (
              <Button 
                variant={activeTab === "files" ? "default" : "ghost"} 
                className={`justify-start gap-3 rounded-xl h-12 font-bold ${activeTab === "files" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveTab("files")}
              >
                <FileText size={18} /> مراجعة الملفات
                {pendingFilesCount?.length ? <span className="ml-auto bg-primary-foreground text-primary px-2 rounded-full text-[10px]">{pendingFilesCount.length}</span> : null}
              </Button>
            )}

            {perms.can_send_announcements && (
              <Button 
                variant={activeTab === "announcements" ? "default" : "ghost"} 
                className={`justify-start gap-3 rounded-xl h-12 font-bold ${activeTab === "announcements" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => setActiveTab("announcements")}
              >
                <Megaphone size={18} /> الإعلانات
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black mb-4">نظرة عامة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {perms.can_approve_students && (
                    <Card className="p-6 rounded-2xl border bg-card flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">طلبات التسجيل المعلقة</p>
                        <h3 className="text-3xl font-black">{pendingStudentsCount?.length || 0}</h3>
                      </div>
                      <div className="p-4 bg-primary/10 text-primary rounded-2xl"><Users size={24} /></div>
                    </Card>
                  )}
                  {perms.can_approve_files && (
                    <Card className="p-6 rounded-2xl border bg-card flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-muted-foreground mb-1">الملفات المعلقة</p>
                        <h3 className="text-3xl font-black">{pendingFilesCount?.length || 0}</h3>
                      </div>
                      <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl"><FileText size={24} /></div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeTab === "students" && perms.can_approve_students && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black mb-4">طلبات التسجيل</h2>
                <PendingStudentsTab />
              </div>
            )}

            {activeTab === "files" && perms.can_approve_files && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black mb-4">مراجعة الملفات</h2>
                <PendingFilesTab />
              </div>
            )}

            {activeTab === "announcements" && perms.can_send_announcements && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><Megaphone className="text-primary"/> إرسال إعلان جديد</h2>
                  <Card className="p-6 rounded-2xl border bg-card/50 space-y-4">
                    <Textarea 
                      placeholder="اكتب إعلانك هنا ليظهر للطلاب..."
                      value={announcementContent}
                      onChange={e => setAnnouncementContent(e.target.value)}
                      className="min-h-[120px] rounded-xl bg-background"
                    />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 bg-background p-1.5 rounded-xl border w-fit">
                        <button onClick={() => setAnnouncementAudience("all")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${announcementAudience === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>الكل</button>
                        <button onClick={() => setAnnouncementAudience("students")} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${announcementAudience === "students" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>الطلاب فقط</button>
                      </div>
                      <Button onClick={handleSendAnnouncement} disabled={createAnnouncementMutation.isPending} className="rounded-xl h-12 px-8 font-bold">
                        {createAnnouncementMutation.isPending ? <Loader2 className="animate-spin ml-2"/> : <Send className="ml-2 h-4 w-4"/>}
                        إرسال الإعلان
                      </Button>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="text-xl font-black mb-4">الإعلانات السابقة</h3>
                  <div className="space-y-3">
                    {!announcements || announcements.length === 0 ? (
                      <p className="text-muted-foreground text-sm">لا توجد إعلانات سابقة</p>
                    ) : (
                      announcements.map(ann => (
                        <Card key={ann.id} className="p-4 rounded-2xl border bg-card">
                          <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground font-bold">
                            <span>{new Date(ann.createdAt).toLocaleDateString("ar-LY")}</span>
                            <span className="px-2 py-0.5 bg-muted rounded-full">موجه إلى: {ann.targetAudience === "all" ? "الكل" : "الطلاب"}</span>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
