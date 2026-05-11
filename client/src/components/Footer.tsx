import { ShieldCheck } from "lucide-react";
import { useGender } from "@/contexts/GenderContext";
import { motion } from "framer-motion";

export default function Footer() {
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';
  
  return (
    <footer className="relative z-50 w-full max-w-7xl mx-auto px-6 pb-12 mt-auto" dir="ltr">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`backdrop-blur-3xl border rounded-full p-4 px-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group transition-all duration-500 ${
          isFemale 
            ? 'bg-pink-50/80 border-pink-200 shadow-pink-200/20' 
            : 'bg-white/5 dark:bg-slate-900/50 border-white/10 dark:border-slate-800 shadow-black/20'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* 2. Contrast Fix for Footer Text */}
        <button 
          onClick={() => window.location.href = "/admin-login"}
          className={`text-[9px] font-black uppercase tracking-[0.3em] order-2 md:order-1 transition-all opacity-40 hover:opacity-100 cursor-pointer ${
            isFemale ? 'text-pink-900/60' : 'text-slate-900 dark:text-slate-200'
          }`}
        >
          Academic Archive Portal System v1.0 🛡️
        </button>

        <div className={`text-[9px] font-black uppercase tracking-[0.2em] order-3 md:order-2 transition-colors ${
          isFemale ? 'text-pink-700' : 'text-slate-900 dark:text-slate-200'
        }`}>
          All Rights Reserved - Copyright © 2026
        </div>

        <div className="flex items-center gap-4 order-1 md:order-3">
          <div className="text-right">
            <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 transition-colors ${
              isFemale ? 'text-pink-900/60' : 'text-slate-900 dark:text-slate-200'
            }`}>Digital Infrastructure by</p>
            <p className={`text-sm font-black tracking-tighter leading-none transition-colors ${
              isFemale ? 'text-pink-600' : 'text-slate-900 dark:text-white font-bold'
            }`}>MOAD.ZAYED</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
            isFemale ? 'bg-pink-500 text-white shadow-pink-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
          }`}>
            <ShieldCheck size={20} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
