import { motion, AnimatePresence } from "framer-motion";
import { Flower, Shield, Cpu, Sparkles } from "lucide-react";

interface DoorTransitionProps {
  isVisible: boolean;
}

export default function DoorTransition({ isVisible }: DoorTransitionProps) {

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex overflow-hidden pointer-events-none"
        >
          {/* Backdrop Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/20 backdrop-blur-md"
          />

          {/* Left Door */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 100, duration: 0.8 }}
            className="absolute left-0 top-0 bottom-0 w-1/2 shadow-2xl flex items-center justify-end border-r border-white/20"
            style={{ background: 'var(--button-gradient)' }}
          >
             <div className="mr-[-2rem] z-10 p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
             </div>
          </motion.div>

          {/* Right Door */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 100, duration: 0.8 }}
            className="absolute right-0 top-0 bottom-0 w-1/2 shadow-2xl flex items-center justify-start border-l border-white/20"
            style={{ background: 'var(--button-gradient)' }}
          >
             <div className="ml-[-2rem] z-10 p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <Shield className="w-12 h-12 text-white animate-pulse" />
             </div>
          </motion.div>

          {/* Centered Message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-10 rounded-[3rem] shadow-2xl text-center">
              <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">جارِ فتح الأرشيف...</h2>
              <p className="text-white/60 font-bold text-sm uppercase tracking-widest">Preparing your Magic Download</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
