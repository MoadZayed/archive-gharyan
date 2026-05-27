import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, Users, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ModeratorManagementTab() {
  const { data: moderators, isLoading, refetch } = trpc.admin.getAllModerators.useQuery();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [selectedMod, setSelectedMod] = useState<any>(null);

  // Add Mod Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [perms, setPerms] = useState({
    can_approve_students: false,
    can_approve_files: false,
    can_view_files: false,
    can_delete_files: false,
    can_send_announcements: false
  });

  const addMutation = trpc.admin.createModerator.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء حساب المشرف بنجاح");
      setAddModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message || "حدث خطأ أثناء الإنشاء")
  });

  const editMutation = trpc.admin.updateModeratorPermissions.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث صلاحيات المشرف بنجاح");
      setEditModalOpen(false);
      refetch();
    },
    onError: () => toast.error("فشل التحديث")
  });

  const toggleMutation = trpc.admin.toggleModeratorActive.useMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? "تم تفعيل الحساب" : "تم تعطيل الحساب");
      refetch();
    }
  });

  const deleteMutation = trpc.admin.deleteModerator.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المشرف بنجاح");
      setDeleteModalOpen(false);
      refetch();
    }
  });

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setPerms({
      can_approve_students: false, can_approve_files: false,
      can_view_files: false, can_delete_files: false, can_send_announcements: false
    });
  };

  const handleAddSubmit = () => {
    if (!name || !email || !password) return toast.error("يرجى ملء جميع الحقول");
    if (password !== confirmPassword) return toast.error("كلمات المرور غير متطابقة");
    if (password.length < 8) return toast.error("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
    if (!Object.values(perms).some(v => v)) return toast.error("يجب اختيار صلاحية واحدة على الأقل");
    
    addMutation.mutate({ name, email, password, permissions: perms });
  };

  const handleEditSubmit = () => {
    if (selectedMod) {
      editMutation.mutate({ moderatorId: selectedMod.id, permissions: perms });
    }
  };

  const openEdit = (mod: any) => {
    setSelectedMod(mod);
    try {
      const parsed = mod.moderatorPermissions ? JSON.parse(mod.moderatorPermissions) : {};
      setPerms({
        can_approve_students: !!parsed.can_approve_students,
        can_approve_files: !!parsed.can_approve_files,
        can_view_files: !!parsed.can_view_files,
        can_delete_files: !!parsed.can_delete_files,
        can_send_announcements: !!parsed.can_send_announcements
      });
    } catch {
      resetForm();
    }
    setEditModalOpen(true);
  };

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary"/> إدارة المشرفين</h2>
        <Button onClick={() => { resetForm(); setAddModalOpen(true); }} className="rounded-xl font-bold bg-primary text-primary-foreground">
          <Plus className="ml-2 h-5 w-5" /> إضافة مشرف جديد
        </Button>
      </div>

      {!moderators || moderators.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 rounded-3xl opacity-70">
          <Users size={64} className="mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold text-muted-foreground">لا يوجد مشرفين حتى الآن</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moderators.map((mod) => {
            const isLocked = mod.isAccountLocked;
            let parsedPerms: any = {};
            try { parsedPerms = JSON.parse(mod.moderatorPermissions || "{}"); } catch {}

            return (
              <Card key={mod.id} className="p-5 flex flex-col gap-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
                <div className="flex justify-between items-start">
                  <div className="text-right">
                    <h3 className="font-bold text-lg">{mod.fullName}</h3>
                    <p className="text-sm text-muted-foreground" dir="ltr">{mod.email}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${!isLocked ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-500'}`}>
                    {!isLocked ? 'نشط' : 'معطل'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {parsedPerms.can_approve_students && <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold">تسجيل</span>}
                  {parsedPerms.can_approve_files && <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold">ملفات</span>}
                  {parsedPerms.can_view_files && <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold">تصفح</span>}
                  {parsedPerms.can_delete_files && <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-md text-[10px] font-bold">حذف</span>}
                  {parsedPerms.can_send_announcements && <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded-md text-[10px] font-bold">إعلانات</span>}
                </div>

                <div className="flex items-center gap-2 mt-4 border-t pt-4">
                  <Switch 
                    checked={!isLocked} 
                    onCheckedChange={(checked) => toggleMutation.mutate({ moderatorId: mod.id, isActive: checked })} 
                    disabled={toggleMutation.isPending}
                  />
                  <span className="text-xs font-bold ml-auto">تفعيل الحساب</span>
                  
                  <Button variant="outline" size="sm" onClick={() => openEdit(mod)} className="rounded-lg h-8">
                    <Edit className="h-4 w-4 ml-1"/> تعديل
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setSelectedMod(mod); setDeleteModalOpen(true); }} className="rounded-lg h-8">
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD MODERATOR MODAL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-[2rem]">
          <DialogHeader><DialogTitle>إضافة مشرف جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold mb-1 block">الاسم الكامل</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl text-right" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">البريد الإلكتروني</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl text-right" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">كلمة المرور</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl text-right" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">تأكيد كلمة المرور</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="rounded-xl text-right" dir="ltr" />
            </div>
            
            <div className="border rounded-xl p-4 mt-4 space-y-3 bg-muted/30">
              <h4 className="font-bold text-sm mb-2 border-b pb-2">الصلاحيات:</h4>
              <label className="flex items-center gap-3"><Checkbox checked={perms.can_approve_students} onCheckedChange={c => setPerms({...perms, can_approve_students: !!c})} /> <span className="text-sm">الموافقة على طلبات التسجيل</span></label>
              <label className="flex items-center gap-3"><Checkbox checked={perms.can_approve_files} onCheckedChange={c => setPerms({...perms, can_approve_files: !!c})} /> <span className="text-sm">الموافقة على الملفات المرفوعة</span></label>
              <label className="flex items-center gap-3"><Checkbox checked={perms.can_view_files} onCheckedChange={c => setPerms({...perms, can_view_files: !!c})} /> <span className="text-sm">عرض جميع الملفات على المنصة</span></label>
              <label className="flex items-center gap-3"><Checkbox checked={perms.can_delete_files} onCheckedChange={c => setPerms({...perms, can_delete_files: !!c})} /> <span className="text-sm text-red-500 font-bold">حذف الملفات المخالفة</span></label>
              <label className="flex items-center gap-3"><Checkbox checked={perms.can_send_announcements} onCheckedChange={c => setPerms({...perms, can_send_announcements: !!c})} /> <span className="text-sm">إرسال الإعلانات للطلاب</span></label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleAddSubmit} disabled={addMutation.isPending} className="rounded-xl">{addMutation.isPending ? <Loader2 className="animate-spin ml-2"/> : 'إنشاء حساب المشرف'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODERATOR MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-[2rem]">
          <DialogHeader><DialogTitle>تعديل صلاحيات {selectedMod?.fullName}</DialogTitle></DialogHeader>
          <div className="border rounded-xl p-4 py-6 space-y-4 bg-muted/30">
            <label className="flex items-center gap-3"><Checkbox checked={perms.can_approve_students} onCheckedChange={c => setPerms({...perms, can_approve_students: !!c})} /> <span className="text-sm">الموافقة على طلبات التسجيل</span></label>
            <label className="flex items-center gap-3"><Checkbox checked={perms.can_approve_files} onCheckedChange={c => setPerms({...perms, can_approve_files: !!c})} /> <span className="text-sm">الموافقة على الملفات المرفوعة</span></label>
            <label className="flex items-center gap-3"><Checkbox checked={perms.can_view_files} onCheckedChange={c => setPerms({...perms, can_view_files: !!c})} /> <span className="text-sm">عرض جميع الملفات على المنصة</span></label>
            <label className="flex items-center gap-3"><Checkbox checked={perms.can_delete_files} onCheckedChange={c => setPerms({...perms, can_delete_files: !!c})} /> <span className="text-sm text-red-500 font-bold">حذف الملفات المخالفة</span></label>
            <label className="flex items-center gap-3"><Checkbox checked={perms.can_send_announcements} onCheckedChange={c => setPerms({...perms, can_send_announcements: !!c})} /> <span className="text-sm">إرسال الإعلانات للطلاب</span></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="rounded-xl">إلغاء</Button>
            <Button onClick={handleEditSubmit} disabled={editMutation.isPending} className="rounded-xl">تحديث الصلاحيات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODERATOR MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent dir="rtl" className="max-w-sm rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-red-500">حذف المشرف</DialogTitle></DialogHeader>
          <p className="py-4 text-sm font-bold text-center">هل أنت متأكد من حذف حساب "{selectedMod?.fullName}"؟<br/><span className="text-muted-foreground mt-2 inline-block">لا يمكن التراجع عن هذا الإجراء.</span></p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="rounded-xl flex-1">إلغاء</Button>
            <Button variant="destructive" onClick={() => selectedMod && deleteMutation.mutate({ moderatorId: selectedMod.id })} disabled={deleteMutation.isPending} className="rounded-xl flex-1">حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
