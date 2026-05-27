import { FolderOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
}

export default function EmptyState({ 
  title = "لا توجد ملفات في هذا القسم بعد", 
  description = "كن أول من يساهم في بناء هذا الأرشيف وساعد زملائك!", 
  actionText = "رفع ملف الآن" 
}: EmptyStateProps) {
  const [, navigate] = useLocation();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 px-6 text-center"
    >
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-700" style={{ backgroundColor: 'rgba(233,30,99,0.1)', color: 'var(--accent-primary)' }}>
          <FolderOpen size={64} strokeWidth={1.5} />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-2 -right-2 p-3 rounded-2xl shadow-xl"
          style={{ background: 'var(--button-gradient)', color: 'white' }}
        >
          <Sparkles size={20} />
        </motion.div>
      </div>

      <h3 className="text-2xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm font-bold max-w-sm mb-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>

      <Button 
        onClick={() => navigate("/upload")}
        className={`h-14 px-10 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 flex gap-3 btn-rgb`}
      >
        <Plus size={24} strokeWidth={3} />
        {actionText}
      </Button>
    </motion.div>
  );
}
