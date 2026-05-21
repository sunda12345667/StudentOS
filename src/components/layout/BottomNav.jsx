import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Home, BookOpen, ShoppingBag, Bot, MessageCircle, Bell, Users, Trophy, GraduationCap, CalendarDays, School, Play } from 'lucide-react';

// Primary 5 nav items shown in the bottom bar
const PRIMARY_NAV = [
  { icon: Home,          label: 'Feed',        path: '/' },
  { icon: BookOpen,      label: 'Classroom',   path: '/classroom' },
  { icon: Bot,           label: 'AI Tutor',    path: '/ai-tutor' },
  { icon: MessageCircle, label: 'Messages',    path: '/messages' },
  { icon: Bell,          label: 'Alerts',      path: '/notifications' },
];

export default function BottomNav({ user }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.email) {
      base44.entities.Notification.filter({ user_email: user.email, is_read: false })
        .then(n => setUnread(n.length)).catch(() => {});
    }
  }, [user?.email, location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border flex items-stretch h-16 safe-area-bottom">
      {PRIMARY_NAV.map(item => {
        const active = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);
        const isNotif = item.path === '/notifications';

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <item.icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              {isNotif && unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>
              {item.label}
            </span>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}