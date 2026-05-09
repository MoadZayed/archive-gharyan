import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-violet-500/5 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Outer Spin Ring */}
          <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-[2rem] animate-spin" />
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck size={28} className="animate-pulse" />
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-black tracking-tight text-foreground"
          >
            جاري تحضير المنصة...
          </motion.h2>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.2
                }}
                className="w-1.5 h-1.5 bg-primary rounded-full"
              />
            ))}
          </div>
        </div>

        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">
          Academic Archive CMS
        </p>
      </div>
    </div>
  );
}
