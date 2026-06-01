import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles } from "lucide-react";

interface StarNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  stars: number;
}

export default function StarNotification({ isVisible, onClose, stars }: StarNotificationProps) {

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3, rotateX: 45 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed bottom-32 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] perspective-1000"
        >
          <div className="relative p-8 rounded-[2.5rem] backdrop-blur-2xl border-2 flex flex-col items-center gap-4 text-center min-w-[320px]" style={{ backgroundColor: 'var(--bg-cards)', borderColor: 'var(--border-pink)', boxShadow: '0 20px 50px rgba(233,30,99,0.3)' }}>
            {/* 3D Animated Star */}
            <motion.div
              animate={{ 
                rotateY: 360,
                scale: [1, 1.2, 1],
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl relative"
              style={{ background: 'var(--button-gradient)' }}
            >
              <Star className="text-white fill-white" size={48} />
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Sparkles className="text-white/50" size={80} />
              </motion.div>
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                تمت إضافة نجمة لك! 🌟
              </h3>
              <p className="text-sm font-bold max-w-[250px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                واصل رفع الملفات لمساعدة زملائك.
              </p>
            </div>

            <div className="mt-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
              رصيدك الحالي: {stars} نجوم
            </div>

            {/* Floating Particles Animation */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 100),
                  y: -Math.random() * 100,
                  scale: [0, 1, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="absolute"
              >
                <Star className="text-yellow-400 fill-yellow-400" size={12} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
