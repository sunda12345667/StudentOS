import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageCircle, BookOpen, Trophy, Bell, CheckCheck, Loader2, Zap, UserPlus, Share2, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TYPE_CONFIG = {
  like: { icon: ThumbsUp, color: 'bg-blue-100 text-blue-600' },
  comment: { icon: MessageCircle, color: 'bg-green-100 text-green-600' },
  assignment: { icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
  grade: { icon: Trophy, color: 'bg-amber-100 text-amber-600' },
  enrollment: { icon: BookOpen, color: 'bg-indigo-100 text-indigo-600' },
  announcement: { icon: Bell, color: 'bg-rose-100 text-rose-600' },
  message: { icon: MessageCircle, color: 'bg-cyan-100 text-cyan-600' },
  achievement: { icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  follow: { icon: UserPlus, color: 'bg-violet-100 text-violet-600' },
  share: { icon: Share2, color: 'bg-pink-100 text-pink-600' },
  marketplace: { icon: ShoppingBag, color: 'bg-orange-100 text-orange-600' },
};

export default function Notifications() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50)
      .then(setNotifications).finally(() => setLoading(false));

    // Real-time subscription
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_email === user.email) {
        setNotifications(prev => [event.data, ...prev]);
      }
    });
    return unsub;
  }, [user?.email]);

  const markAll = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  const markOne = async (n) => {
    if (!n.is_read) {
      await base44.entities.Notification.update(n.id, { is_read: true });
      setNotifications(p => p.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    // Navigate for message notifications
    if (n.type === 'message' && n.entity_id) {
      navigate('/messages', { state: { conversationId: n.entity_id } });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-primary gap-2" onClick={markAll}>
            <CheckCheck className="w-4 h-4" />Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">No new notifications</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.announcement;
            const Icon = cfg.icon;
            const ni = n.from_name?.split(' ').map(x => x[0]).join('').toUpperCase() || '?';
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <div
                  onClick={() => markOne(n)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all",
                    n.is_read ? "hover:bg-muted" : "bg-primary/5 border border-primary/10 hover:bg-primary/10"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={n.from_avatar} />
                      <AvatarFallback className="gradient-brand text-white font-semibold">{ni}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center", cfg.color)}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {n.from_name && <span className="font-semibold">{n.from_name} </span>}
                      {n.content}
                    </p>
                    <p className={cn("text-xs mt-0.5", n.is_read ? "text-muted-foreground" : "text-primary font-medium")}>
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}