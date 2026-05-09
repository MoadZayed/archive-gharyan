import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const phoneNumber = "218944879547"; 
  const message = encodeURIComponent("السلام عليكم، أحتاج إلى دعم فني بخصوص منصة GITA");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-8 left-8 z-[9999] flex flex-col items-end gap-3 group">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            className="bg-white/90 backdrop-blur-xl border border-emerald-200 p-3 rounded-2xl shadow-2xl text-emerald-900 text-[11px] font-black uppercase tracking-wider mb-2 max-w-[180px] text-center leading-relaxed"
          >
            للدعم الفني تواصل عبر واتساب اضغط هنا 🟢
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex items-center justify-center w-16 h-16 bg-emerald-500 text-white rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-600 border-4 border-white/20"
      >
        {/* Pulsing Ring */}
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
        
        <MessageCircle size={32} className="relative z-10 drop-shadow-md" />
        
        {/* Label for mobile/always visible if preferred */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap shadow-xl">
           واتساب الدعم الفني
        </div>
      </motion.a>
    </div>
  );
}
