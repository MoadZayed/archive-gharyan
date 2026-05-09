import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      "app_name": "GITA - أرشيف تقنية المعلومات غريان",
      "login": "تسجيل الدخول",
      "register": "إنشاء حساب",
      "dont_have_account": "ليس لديك حساب؟",
      "student_id": "رقم القيد",
      "birth_date": "تاريخ الميلاد",
      "password": "كلمة المرور",
      "full_name": "الاسم الكامل",
      "welcome": "مرحباً",
      "logout": "تسجيل الخروج",
      "upload": "رفع ملف",
      "admin": "لوحة الإدارة",
      "search": "البحث",
      "search_placeholder": "ابحث باسم الملف أو المادة...",
      "file_type": "نوع الملف",
      "all_types": "جميع الأنواع",
      "exam": "أسئلة امتحانات",
      "summary": "ملخصات",
      "curriculum": "مناهج",
      "other": "أخرى",
      "year": "السنة",
      "all_years": "جميع السنوات",
      "reset_search": "إعادة ضبط البحث",
      "no_files": "لا توجد ملفات متوفرة حالياً",
      "review_pending": "قيد المراجعة",
      "download": "تحميل",
      "delete": "حذف",
      "approve": "اعتماد",
      "back": "رجوع",
      "subject": "المادة",
      "doctor": "الأستاذ",
      "semester": "الفصل الدراسي",
      "description": "الوصف",
      "upload_button": "مراجعة ورفع الملف",
      "confirm_data": "تأكيد البيانات",
      "confirm_desc": "يرجى التأكد من صحة البيانات المستخرجة.",
      "confirm_yes": "تأكيد ورفع",
      "confirm_no": "تعديل يدوي",
      "footer_desc": "تأسست المنصة لدعم طلاب كلية تقنية المعلومات بغريان وتوفير أرشيف أكاديمي شامل وآمن للجميع.",
      "tech_support": "الدعم الفني وتطوير المنصة",
      "support_desc": "لأي تعديلات، بلاغات عن أخطاء، أو اقتراحات، تواصل مباشرة مع المطور.",
      "contact_whatsapp": "تواصل عبر واتساب",
      "rights": "جميع الحقوق محفوظة",
      "made_with": "صُنع بـ",
      "for_students": "لطلاب غريان",
      "already_have_account": "لديك حساب بالفعل؟",
      "back_home": "الرجوع للرئيسية",
      "register_success": "تم إنشاء الحساب بنجاح!",
      "error_register": "فشل إنشاء الحساب، يرجى المحاولة لاحقاً"
    }
  },
  en: {
    translation: {
      "app_name": "GITA - Gharyan IT Archive",
      "login": "Login",
      "register": "Register",
      "dont_have_account": "Don't have an account?",
      "student_id": "Student ID",
      "birth_date": "Birth Date",
      "password": "Password",
      "full_name": "Full Name",
      "welcome": "Welcome",
      "logout": "Logout",
      "upload": "Upload",
      "admin": "Admin Panel",
      "search": "Search",
      "search_placeholder": "Search by filename or subject...",
      "file_type": "File Type",
      "all_types": "All Types",
      "exam": "Exams",
      "summary": "Summaries",
      "curriculum": "Curriculum",
      "other": "Other",
      "year": "Year",
      "all_years": "All Years",
      "reset_search": "Reset Search",
      "no_files": "No files available currently",
      "review_pending": "Pending Review",
      "download": "Download",
      "delete": "Delete",
      "approve": "Approve",
      "back": "Back",
      "subject": "Subject",
      "doctor": "Professor",
      "semester": "Semester",
      "description": "Description",
      "upload_button": "Review & Upload",
      "confirm_data": "Confirm Data",
      "confirm_desc": "Please ensure the extracted data is correct.",
      "confirm_yes": "Confirm & Upload",
      "confirm_no": "Edit Manually",
      "footer_desc": "Established to support Gharyan IT students with a comprehensive and secure academic archive.",
      "tech_support": "Technical Support & Dev",
      "support_desc": "For any requests, bugs, or suggestions, contact the developer directly.",
      "contact_whatsapp": "Contact via WhatsApp",
      "rights": "All Rights Reserved",
      "made_with": "Made with",
      "for_students": "for Gharyan Students",
      "already_have_account": "Already have an account?",
      "back_home": "Back Home",
      "register_success": "Account created successfully!",
      "error_register": "Failed to create account, please try again"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
