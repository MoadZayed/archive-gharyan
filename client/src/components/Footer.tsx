import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  
  return (
    <footer className="relative z-50 w-full px-6 pb-28 md:pb-12 mt-auto" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-3xl border rounded-3xl md:rounded-full p-3 px-6 md:p-4 md:px-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 overflow-hidden relative group transition-all duration-500"
        style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* Author / Developer Info (Right in RTL -> order 1) */}
        <div className="flex items-center gap-4 order-1 md:order-1">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-500" style={{ background: 'var(--button-gradient)', color: 'white' }}>
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
          </div>
          <div className="text-right" dir="ltr">
            <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 transition-colors text-right" style={{ color: 'var(--text-muted)' }}>Digital Infrastructure by</p>
            <p className="text-xs md:text-sm font-black tracking-tighter leading-none transition-colors text-right" style={{ color: 'var(--accent-primary)' }}>MOAD.ZAYED</p>
          </div>
        </div>

        {/* Copyright (Center -> order 2) */}
        <div dir="ltr" className="text-[9px] font-black uppercase tracking-[0.2em] order-3 md:order-2 transition-colors text-center" style={{ color: 'var(--text-muted)' }}>
          All Rights Reserved - Copyright © 2026
        </div>

        {/* System Info (Left in RTL -> order 3) */}
        <button 
          dir="ltr"
          onClick={() => window.location.href = "/admin-login"}
          className="text-[9px] font-black uppercase tracking-[0.3em] order-2 md:order-3 transition-all opacity-40 hover:opacity-100 cursor-pointer text-left"
          style={{ color: 'var(--text-muted)' }}
        >
          Academic Archive Portal System v1.0 🛡️
        </button>
      </motion.div>
    </footer>
  );
}
