import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function CommentSection({ fileID }: { fileID: number }) {
  const [commentText, setCommentText] = useState("");
  const utils = trpc.useUtils();

  const commentsQuery = trpc.comments.list.useQuery({ fileID });
  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      setCommentText("");
      commentsQuery.refetch();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ fileID, text: commentText });
  };

  return (
    <div className="mt-6 pt-6 border-t border-border/30">
      <div className="flex items-center gap-2 mb-4 text-primary dark:text-white">
        <MessageSquare size={16} />
        <h4 className="text-xs font-black uppercase tracking-widest">التعليقات والمراجعات</h4>
      </div>

      {/* List Comments */}
      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {commentsQuery.isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin h-5 w-5 text-muted-foreground/30" />
          </div>
        ) : commentsQuery.data?.length === 0 ? (
          <p className="text-[10px] text-slate-500 dark:text-white/40 text-center py-4 font-bold uppercase italic">
            لا توجد تعليقات بعد، كن أول من يصحح أو يضيف معلومة.
          </p>
        ) : (
          <AnimatePresence>
            {commentsQuery.data?.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 dark:bg-white/[0.02] border border-border/20 rounded-2xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px]">
                      <User size={12} />
                    </div>
                    <span className="text-xs font-black text-foreground">{comment.studentName}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ar })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed pr-8">
                  {comment.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <Input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="أضف تعليقاً أو تصحيحاً..."
          className="bg-background/50 border-border/50 h-12 pr-12 rounded-xl focus:ring-primary/20"
          dir="rtl"
        />
        <Button
          type="submit"
          disabled={addCommentMutation.isPending || !commentText.trim()}
          size="icon"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"
        >
          {addCommentMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} className="rotate-180" />}
        </Button>
      </form>
    </div>
  );
}
