import { BookOpen, Plus, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Courses() {
  useDocumentTitle("إدارة المواد الدراسية");
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BookOpen className="text-primary h-8 w-8" />
            إدارة المواد الدراسية
          </h1>
          <p className="text-muted-foreground mt-2 font-bold">
            هنا يمكنك إضافة، إسقاط، ومتابعة موادك الدراسية لهذا الفصل.
          </p>
        </div>
        <Button className="rounded-2xl h-12 px-6 font-black gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} />
          إضافة مادة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for Courses - Will be fetched from userCourses table */}
        <Card className="p-8 border-dashed border-2 bg-transparent flex flex-col items-center justify-center text-center opacity-40 min-h-[200px] rounded-[2rem]">
          <Info className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-bold">لا توجد مواد مسجلة حالياً</p>
          <span className="text-xs mt-1">ابدأ بإضافة موادك لبناء خطتك الدراسية</span>
        </Card>
      </div>
      
      <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-black mb-1">تنبيه النظام الذكي</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            سيطلب منك النظام تأكيد استمراريتك في هذه المواد كل 60 يوماً لضمان دقة الأرشيف الأكاديمي. في حال عدم التفاعل، سيتم أرشفة بيانات الفصل تلقائياً.
          </p>
        </div>
      </div>
    </div>
  );
}
