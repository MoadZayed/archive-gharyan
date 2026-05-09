import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function NotificationBell() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.getUnreadNotifications.useQuery();
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadNotifications.invalidate();
    },
  });

  const unreadCount = notifications?.length || 0;

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      markAsRead.mutate();
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-accent/50 transition-all rounded-full h-10 w-10">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
            <Bell className="h-4 w-4" /> الإشعارات
          </h3>
        </div>
        <ScrollArea className="h-[350px]">
          {notifications && notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors group">
                  <p className="text-sm font-bold text-foreground leading-relaxed mb-1">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-black text-muted-foreground">لا توجد إشعارات جديدة</p>
            </div>
          )}
        </ScrollArea>
        {notifications && notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/10 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">GITA Interaction Hub</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
