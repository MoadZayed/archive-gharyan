import { MessageCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const phoneNumber = "218930959763"; 
  const message = encodeURIComponent("السلام عليكم، أحتاج إلى دعم فني بخصوص منصة GITA");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-40 flex flex-col items-end gap-2 group">
      {/* Minimize Toggle Button */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 rounded-full p-1.5 shadow-lg border border-primary/20 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors self-end mr-2"
        title={isMinimized ? "إظهار زر الدعم" : "إخفاء زر الدعم"}
      >
        {isMinimized ? <Eye size={12} className="text-emerald-500" /> : <EyeOff size={12} />}
      </button>

      <AnimatePresence>
        {showTooltip && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="bg-[var(--glass-white)] backdrop-blur-xl border border-[var(--border-pink)] p-3 rounded-2xl shadow-2xl text-[var(--text-primary)] text-[11px] font-black uppercase tracking-wider mb-2 max-w-[180px] text-center leading-relaxed"
          >
            للدعم الفني تواصل عبر واتساب اضغط هنا
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={isMinimized ? {} : { scale: 1.1, rotate: 5 }}
        whileTap={isMinimized ? {} : { scale: 0.9 }}
        className={`relative flex items-center justify-center w-12 h-12 bg-emerald-500 text-white rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-600 border-2 border-white/20 ${
          isMinimized ? "opacity-20 scale-75 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
        }`}
      >
        {/* Pulsing Ring - only when not minimized */}
        {!isMinimized && (
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
        )}
        
        <MessageCircle className="relative z-10 drop-shadow-md h-6 w-6" />
        
        {/* Label for mobile/always visible if preferred */}
        {!isMinimized && (
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap shadow-xl">
             واتساب الدعم الفني
          </div>
        )}
      </motion.a>
    </div>
  );
}
