import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGender } from "@/contexts/GenderContext";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Database, Cpu, Cookie, UserCheck, Mail } from "lucide-react";
import Logo from "@/components/Logo";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-1000 ${
      isFemale ? 'bg-[#fff0f6]' : 'bg-[#020617]'
    }`} dir="rtl">
      {/* Background Orbs */}
      <div className={`fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-pink-400' : 'bg-blue-600'
      }`} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none opacity-20 ${
        isFemale ? 'bg-rose-400' : 'bg-purple-600'
      }`} />

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
            className={`rounded-2xl gap-2 font-black border-white/20 backdrop-blur-xl ${
              isFemale ? 'bg-white/40 text-pink-600' : 'bg-white/5 text-white'
            }`}
          >
            <ChevronRight />
            العودة للرئيسية
          </Button>
        </div>

        <Card className={`backdrop-blur-3xl border shadow-2xl rounded-[3rem] overflow-hidden ${
          isFemale ? 'bg-white/70 border-pink-200/50' : 'bg-white/[0.02] border-white/10'
        }`}>
          <CardHeader className={`p-10 text-center ${isFemale ? 'bg-pink-500/5' : 'bg-blue-500/5'}`}>
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 ${
              isFemale ? 'bg-pink-500 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            }`}>
              <ShieldCheck size={32} />
            </div>
            <CardTitle className={`text-4xl font-black ${isFemale ? 'text-pink-900' : 'text-white'}`}>
              سياسة الخصوصية
            </CardTitle>
            <p className={`mt-4 font-bold text-lg ${isFemale ? 'text-pink-600' : 'text-blue-400'}`}>
              منصة الأرشيف الأكاديمي - كلية تقنية المعلومات غريان
            </p>
          </CardHeader>

          <CardContent className="p-10 md:p-16 space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className={isFemale ? 'text-pink-500' : 'text-blue-500'} />
                <h3 className={`text-xl font-black ${isFemale ? 'text-pink-800' : 'text-white'}`}>المقدمة</h3>
              </div>
              <p className={`leading-relaxed font-bold ${isFemale ? 'text-pink-900/70' : 'text-slate-400'}`}>
                خصوصيتك وبياناتك الأكاديمية هي جوهر اهتمامنا. نحن نلتزم بحماية المعلومات الشخصية التي تشاركها معنا وتوفير بيئة تعليمية آمنة ومنظمة.
              </p>
            </section>

            <Separator className={isFemale ? 'bg-pink-200/50' : 'bg-white/5'} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Database className={isFemale ? 'text-pink-500' : 'text-blue-500'} />
                <h3 className={`text-xl font-black ${isFemale ? 'text-pink-800' : 'text-white'}`}>جمع المعلومات</h3>
              </div>
              <p className={`leading-relaxed font-bold ${isFemale ? 'text-pink-900/70' : 'text-slate-400'}`}>
                نحن نجمع فقط المعلومات الضرورية للأغراض الأكاديمية والتنظيمية داخل الكلية، والتي تشمل: (رقم القيد، الاسم الكامل، والبريد الإلكتروني). لا يتم استخدام هذه البيانات لأي أغراض تجارية أو تسويقية.
              </p>
            </section>

            <Separator className={isFemale ? 'bg-pink-200/50' : 'bg-white/5'} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Cpu className={isFemale ? 'text-pink-500' : 'text-blue-500'} />
                <h3 className={`text-xl font-black ${isFemale ? 'text-pink-800' : 'text-white'}`}>الذكاء الاصطناعي والمعالجة</h3>
              </div>
              <div className={`p-6 rounded-2xl border ${isFemale ? 'bg-pink-50 border-pink-100' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <p className={`leading-relaxed font-bold ${isFemale ? 'text-pink-900/70' : 'text-slate-400'}`}>
                  يتم تحليل الملفات المرفوعة ومعالجة الصور بواسطة <strong>AI</strong> لتسهيل الأرشفة التلقائية واستخراج البيانات الوصفية. 
                  <br />
                  <span className="text-sm mt-2 block italic">
                    "لا يتم تخزين ملفاتك في أي خادم خارجي للذكاء الاصطناعي بشكل دائم؛ المعالجة تتم لحظياً لغرض الفهرسة فقط."
                  </span>
                </p>
              </div>
            </section>

            <Separator className={isFemale ? 'bg-pink-200/50' : 'bg-white/5'} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Cookie className={isFemale ? 'text-pink-500' : 'text-blue-500'} />
                <h3 className={`text-xl font-black ${isFemale ? 'text-pink-800' : 'text-white'}`}>ملفات الارتباط (Cookies)</h3>
              </div>
              <p className={`leading-relaxed font-bold ${isFemale ? 'text-pink-900/70' : 'text-slate-400'}`}>
                نحن نستخدم تقنيات التأمين الحديثة (JWT) فقط للحفاظ على أمان جلستك والتعرف على هويتك داخل المنصة. لا نستخدم أي ملفات ارتباط تتبعية أو تسويقية تابعة لجهات خارجية.
              </p>
            </section>

            <Separator className={isFemale ? 'bg-pink-200/50' : 'bg-white/5'} />

            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className={isFemale ? 'text-pink-500' : 'text-blue-500'} />
                <h3 className={`text-xl font-black ${isFemale ? 'text-pink-800' : 'text-white'}`}>حماية البيانات وحقوقك</h3>
              </div>
              <p className={`leading-relaxed font-bold ${isFemale ? 'text-pink-900/70' : 'text-slate-400'}`}>
                أنت تملك ملفاتك ومساهماتك بالكامل. تمنحك المنصة الصلاحية الكاملة لإدارة محتواك أو حذفه في أي وقت. يتم تشفير كافة البيانات المخزنة لضمان عدم الوصول غير المصرح به.
              </p>
            </section>

            <div className={`p-8 rounded-[2rem] text-center border-2 border-dashed ${isFemale ? 'border-pink-200 bg-pink-50/30' : 'border-white/5 bg-white/[0.01]'}`}>
              <div className="flex justify-center gap-2 mb-4">
                <Mail className={isFemale ? 'text-pink-400' : 'text-blue-400'} size={20} />
                <h4 className={`font-black ${isFemale ? 'text-pink-800' : 'text-white'}`}>تواصل معنا</h4>
              </div>
              <p className={`font-bold ${isFemale ? 'text-pink-600' : 'text-slate-400'}`}>
                لأي استفسارات بخصوص الخصوصية، تواصل مع إدارة المنصة
                <br />
                (كلية تقنية المعلومات - غريان)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
           <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isFemale ? 'text-pink-400' : 'text-slate-600'}`}>
             GITA Platform • 2026 • Enterprise Security Standards
           </p>
        </div>
      </motion.div>
    </div>
  );
}
