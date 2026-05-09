import { FolderOpen, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGender } from "@/contexts/GenderContext";

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
  const { genderTheme } = useGender();
  const isFemale = genderTheme === 'female';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 px-6 text-center"
    >
      <div className="relative mb-8">
        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 ${
          isFemale ? 'bg-pink-100/50 text-pink-300' : 'bg-muted/50 text-muted-foreground/30'
        }`}>
          <FolderOpen size={64} strokeWidth={1.5} />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`absolute -top-2 -right-2 p-3 rounded-2xl shadow-xl ${
            isFemale ? 'bg-pink-500 text-white' : 'bg-primary text-primary-foreground'
          }`}
        >
          <Sparkles size={20} />
        </motion.div>
      </div>

      <h3 className={`text-2xl font-black mb-4 ${isFemale ? 'text-pink-900' : 'text-foreground'}`}>
        {title}
      </h3>
      <p className={`text-sm font-bold max-w-sm mb-10 leading-relaxed ${isFemale ? 'text-pink-900/40' : 'text-muted-foreground'}`}>
        {description}
      </p>

      <Button 
        onClick={() => navigate("/upload")}
        className={`h-14 px-10 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 flex gap-3 ${
          isFemale ? 'bg-pink-600 text-white shadow-pink-500/20' : 'bg-primary text-primary-foreground shadow-primary/20'
        }`}
      >
        <Plus size={24} strokeWidth={3} />
        {actionText}
      </Button>
    </motion.div>
  );
}
