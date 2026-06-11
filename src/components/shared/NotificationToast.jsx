import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageCircle, UserPlus, Share2, ShoppingBag, Bell } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  like:        { icon: ThumbsUp,      color: 'text-blue-500',   label: 'liked your post' },
  comment:     { icon: MessageCircle, color: 'text-green-500',  label: 'commented on your post' },
  follow:      { icon: UserPlus,      color: 'text-violet-500', label: 'started following you' },
  share:       { icon: Share2,        color: 'text-pink-500',   label: 'shared your post' },
  marketplace: { icon: ShoppingBag,   color: 'text-orange-500', label: 'marketplace update' },
  message:     { icon: MessageCircle, color: 'text-cyan-500',   label: 'sent you a message' },
  default:     { icon: Bell,          color: 'text-primary',    label: 'new notification' },
};

// Global singleton — mount once in AppLayout, works app-wide
export default function NotificationToast({ user }) {
  const navigate = useNavigate();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!user?.email) return;

    // Skip notifications already loaded on mount (avoid re-toasting old ones)
    let ready = false;
    const timer = setTimeout(() => { ready = true; }, 2000);

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (!ready) return;
      if (event.type !== 'create') return;
      if (event.data?.user_email !== user.email) return;

      const n = event.data;
      const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
      const Icon = cfg.icon;
      const initials = n.from_name?.split(' ').map(x => x[0]).join('').toUpperCase() || '?';

      const handleClick = () => {
        if (n.type === 'message' && n.entity_id) navigate('/messages', { state: { conversationId: n.entity_id } });
        else if (['like', 'comment', 'share'].includes(n.type)) navigate('/');
        else if (n.type === 'follow' && n.from_email) navigate(`/profile/${n.from_email}`);
        else if (n.type === 'marketplace') navigate('/marketplace');
        else navigate('/notifications');
        // Mark as read
        base44.entities.Notification.update(n.id, { is_read: true }).catch(() => {});
      };

      toast.custom(() => (
        <div
          onClick={handleClick}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-xl p-3.5 w-80 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={n.from_avatar} />
              <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center`}>
              <Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {n.from_name || 'Someone'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{n.content || cfg.label}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
        </div>
      ), { duration: 5000, position: 'top-right' });
    });

    return () => { clearTimeout(timer); unsub(); };
  }, [user?.email, navigate]);

  return null;
}