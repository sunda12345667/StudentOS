import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThumbsUp, MessageCircle, UserPlus, UserCheck, Share2, AtSign, Loader2, MoreHorizontal, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const typeIcons = {
  like: ThumbsUp,
  comment: MessageCircle,
  friend_request: UserPlus,
  friend_accept: UserCheck,
  share: Share2,
  mention: AtSign,
};

const typeColors = {
  like: 'bg-primary text-primary-foreground',
  comment: 'bg-green-500 text-white',
  friend_request: 'bg-primary text-primary-foreground',
  friend_accept: 'bg-primary text-primary-foreground',
  share: 'bg-amber-500 text-white',
  mention: 'bg-purple-500 text-white',
};

export default function Notifications() {
  const { user } = useOutletContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 50)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [user?.email]);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markAsRead = async (notif) => {
    if (notif.is_read) return;
    await base44.entities.Notification.update(notif.id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="ghost" size="sm" className="text-primary gap-2" onClick={markAllAsRead}>
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No notifications yet
        </Card>
      ) : (
        <div className="space-y-1">
          {notifications.map(notif => {
            const Icon = typeIcons[notif.type] || ThumbsUp;
            const colorClass = typeColors[notif.type] || 'bg-primary text-primary-foreground';
            const ni = notif.from_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  notif.is_read ? "hover:bg-secondary" : "bg-primary/5 hover:bg-primary/10"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={notif.from_avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">{ni}</AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center", colorClass)}>
                    <Icon className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notif.from_name}</span>{' '}
                    {notif.content}
                  </p>
                  <p className={cn("text-xs mt-0.5", notif.is_read ? "text-muted-foreground" : "text-primary font-medium")}>
                    {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}