import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Database, Cpu, Cookie, UserCheck, Mail } from "lucide-react";
import Logo from "@/components/Logo";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen p-6 md:p-12 transition-colors duration-1000" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} dir="rtl">
      {/* Background Orbs */}
      <div 
        className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />
      <div 
        className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--accent-secondary)' }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <div className="flex justify-between items-center mb-12">
          <Logo />
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="rounded-2xl gap-2 font-black border-white/20 backdrop-blur-xl hover:bg-[rgba(233,30,99,0.1)] transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <ChevronRight />
            العودة للرئيسية
          </Button>
        </div>

        <Card className="backdrop-blur-3xl border shadow-2xl rounded-[3rem] overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}>
          <CardHeader className="p-10 text-center" style={{ backgroundColor: 'rgba(233,30,99,0.05)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(233,30,99,0.3)]" style={{ background: 'var(--button-gradient)', color: 'white' }}>
              <ShieldCheck size={32} />
            </div>
            <CardTitle className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>
              سياسة الخصوصية
            </CardTitle>
            <p className="mt-4 font-bold text-lg" style={{ color: 'var(--accent-primary)' }}>
              منصة الأرشيف الأكاديمي - كلية تقنية المعلومات غريان
            </p>
          </CardHeader>

          <CardContent className="p-10 md:p-16 space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>المقدمة</h3>
              </div>
              <p className="leading-relaxed font-bold" style={{ color: 'var(--text-muted)' }}>
                خصوصيتك وبياناتك الأكاديمية هي جوهر اهتمامنا. نحن نلتزم بحماية المعلومات الشخصية التي تشاركها معنا وتوفير بيئة تعليمية آمنة ومنظمة.
              </p>
            </section>

            <Separator style={{ backgroundColor: 'var(--glass-white)' }} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Database style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>جمع المعلومات</h3>
              </div>
              <p className="leading-relaxed font-bold" style={{ color: 'var(--text-muted)' }}>
                نحن نجمع فقط المعلومات الضرورية للأغراض الأكاديمية والتنظيمية داخل الكلية، والتي تشمل: (رقم القيد، الاسم الكامل، والبريد الإلكتروني). لا يتم استخدام هذه البيانات لأي أغراض تجارية أو تسويقية.
              </p>
            </section>

            <Separator style={{ backgroundColor: 'var(--glass-white)' }} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Cpu style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>الذكاء الاصطناعي والمعالجة</h3>
              </div>
              <div className="p-6 rounded-2xl border" style={{ backgroundColor: 'rgba(233,30,99,0.05)', borderColor: 'var(--border-pink)' }}>
                <p className="leading-relaxed font-bold" style={{ color: 'var(--text-muted)' }}>
                  يتم تحليل الملفات المرفوعة ومعالجة الصور بواسطة <strong>AI</strong> لتسهيل الأرشفة التلقائية واستخراج البيانات الوصفية. 
                  <br />
                  <span className="text-sm mt-2 block italic opacity-80">
                    "لا يتم تخزين ملفاتك في أي خادم خارجي للذكاء الاصطناعي بشكل دائم؛ المعالجة تتم لحظياً لغرض الفهرسة فقط."
                  </span>
                </p>
              </div>
            </section>

            <Separator style={{ backgroundColor: 'var(--glass-white)' }} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Cookie style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>ملفات الارتباط (Cookies)</h3>
              </div>
              <p className="leading-relaxed font-bold" style={{ color: 'var(--text-muted)' }}>
                نحن نستخدم تقنيات التأمين الحديثة (JWT) فقط للحفاظ على أمان جلستك والتعرف على هويتك داخل المنصة. لا نستخدم أي ملفات ارتباط تتبعية أو تسويقية تابعة لجهات خارجية.
              </p>
            </section>

            <Separator style={{ backgroundColor: 'var(--glass-white)' }} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>حماية البيانات وحقوقك</h3>
              </div>
              <p className="leading-relaxed font-bold" style={{ color: 'var(--text-muted)' }}>
                أنت تملك ملفاتك ومساهماتك بالكامل. تمنحك المنصة الصلاحية الكاملة لإدارة محتواك أو حذفه في أي وقت. يتم تشفير كافة البيانات المخزنة لضمان عدم الوصول غير المصرح به.
              </p>
            </section>

            <div className="p-8 rounded-[2rem] text-center border-2 border-dashed" style={{ backgroundColor: 'rgba(233,30,99,0.02)', borderColor: 'var(--border-pink)' }}>
              <div className="flex justify-center gap-2 mb-4">
                <Mail style={{ color: 'var(--accent-primary)' }} size={20} />
                <h4 className="font-black" style={{ color: 'var(--text-primary)' }}>تواصل معنا</h4>
              </div>
              <p className="font-bold" style={{ color: 'var(--text-muted)' }}>
                لأي استفسارات بخصوص الخصوصية، تواصل مع إدارة المنصة
                <br />
                (كلية تقنية المعلومات - غريان)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
             GITA Platform • 2026 • Enterprise Security Standards
           </p>
        </div>
      </motion.div>
    </div>
  );
}
