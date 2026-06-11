import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageCircle, BookOpen, Trophy, Bell, CheckCheck, Loader2, Zap, UserPlus, Share2, ShoppingBag, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 100)
      .then(setNotifications).finally(() => setLoading(false));

    // Real-time subscription
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email !== user.email) return;
      if (event.type === 'create') setNotifications(prev => [event.data, ...prev]);
      if (event.type === 'update') setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      if (event.type === 'delete') setNotifications(prev => prev.filter(n => n.id !== event.id));
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
    // Smart navigation based on notification type
    if (n.type === 'message' && n.entity_id) {
      navigate('/messages', { state: { conversationId: n.entity_id } });
    } else if ((n.type === 'like' || n.type === 'comment' || n.type === 'share') && n.entity_id) {
      navigate('/', { state: { highlightPostId: n.entity_id } });
    } else if (n.type === 'follow' && n.from_email) {
      navigate(`/profile/${n.from_email}`);
    } else if (n.type === 'marketplace' && n.entity_id) {
      navigate('/marketplace');
    } else if (n.type === 'enrollment' && n.entity_id) {
      navigate(`/classroom/${n.entity_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const deleteOne = async (e, n) => {
    e.stopPropagation();
    await base44.entities.Notification.delete(n.id);
    setNotifications(p => p.filter(x => x.id !== n.id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black">Notifications</h1>
          {unreadCount > 0 && <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-primary gap-2" onClick={markAll}>
            <CheckCheck className="w-4 h-4" />Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-muted/50 rounded-xl p-1 w-fit">
        {[['all','All'], ['unread','Unread']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === val ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {val === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 gradient-brand text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : displayed.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold text-muted-foreground">{filter === 'unread' ? 'No unread notifications' : 'All caught up!'}</p>
          <p className="text-sm text-muted-foreground mt-1">You're up to date</p>
        </Card>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {displayed.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.announcement;
              const Icon = cfg.icon;
              const ni = n.from_name?.split(' ').map(x => x[0]).join('').toUpperCase() || '?';
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                >
                  <div
                    onClick={() => markOne(n)}
                    className={cn(
                      "group flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all relative",
                      n.is_read ? "hover:bg-muted/60" : "bg-primary/5 border border-primary/10 hover:bg-primary/8"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={n.from_avatar} />
                        <AvatarFallback className="gradient-brand text-white font-semibold text-sm">{ni}</AvatarFallback>
                      </Avatar>
                      <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center", cfg.color)}>
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        {n.from_name && <span className="font-semibold">{n.from_name} </span>}
                        <span className={n.is_read ? 'text-muted-foreground' : 'text-foreground'}>{n.content}</span>
                      </p>
                      <p className={cn("text-xs mt-0.5", n.is_read ? "text-muted-foreground/60" : "text-primary font-medium")}>
                        {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      <button
                        onClick={e => deleteOne(e, n)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}