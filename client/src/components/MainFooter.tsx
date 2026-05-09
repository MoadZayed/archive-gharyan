import { MessageCircle } from "lucide-react";
import { useGender } from "@/contexts/GenderContext";

export default function MainFooter() {
  const { genderTheme } = useGender();
  
  return (
    <footer className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 border-t border-white/5 text-center">
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8 text-[10px] font-black uppercase tracking-widest text-white/30">
        <a href="#" className="hover:text-primary transition-colors">Privacy & Security</a>
        <a href="#" className="hover:text-primary transition-colors">Terms of Use</a>
        <a href="#" className="hover:text-primary transition-colors">Trademarks</a>
        <a href="#" className="hover:text-primary transition-colors">Legal</a>
        <a href="#" className="hover:text-primary transition-colors">Genuine tools</a>
      </div>
      
      <div className="flex justify-center gap-6 mb-8">
        <a 
          href="https://wa.me/218944879547" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] ${
            genderTheme === 'female' ? 'text-pink-400 border-pink-500/10' : 'text-blue-400 border-blue-500/10'
          }`}
        >
          <MessageCircle size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">WhatsApp Support</span>
        </a>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
        Copyright © 2000–2026 <span className="text-white/30">MOAD.ZAYED</span>
      </p>
    </footer>
  );
}
