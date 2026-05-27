import { motion } from "framer-motion";
import { Flower, Hexagon, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Logo({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      onClick={() => navigate(user ? "/files" : "/")}
      className={`flex items-center gap-3 cursor-pointer select-none ${className}`}
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Hexagon className="w-10 h-10 text-pink-500 fill-pink-500/20 drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]" style={{ color: 'var(--accent-primary)', fill: 'rgba(233,30,99,0.2)' }} />
        </motion.div>
        
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
            style={{ color: 'var(--accent-secondary)' }}
          >
            <Sparkles size={12} />
          </motion.div>
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
          GITA
        </span>
        <span className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--accent-secondary)' }}>
          Academic Archive
        </span>
      </div>
    </motion.div>
  );
}
