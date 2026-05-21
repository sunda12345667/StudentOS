import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Play, Bot, ShoppingBag, MessageCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,         label: 'Home',      path: '/' },
  { icon: Play,         label: 'Reels',     path: '/reels' },
  { icon: Bot,          label: 'AI',        path: '/ai-tutor', highlight: true },
  { icon: ShoppingBag,  label: 'Market',    path: '/marketplace' },
  { icon: MessageCircle,label: 'Messages',  path: '/messages', badge: true },
];

export default function BottomNav({ user, hidden = false }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    // Count unread message notifications
    base44.entities.Notification.filter({ user_email: user.email, type: 'message', is_read: false })
      .then(n => setUnread(n.length)).catch(() => {});

    // Also subscribe to new notifications in real-time
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_email === user.email && event.data?.type === 'message') {
        setUnread(prev => prev + 1);
      }
    });
    return unsub;
  }, [user?.email, location.pathname]);

  // Detect keyboard open/close
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const isOpen = vv.height < window.innerHeight - 100;
      setKeyboardOpen(isOpen);
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center transition-transform duration-200 md:block"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: hidden || keyboardOpen ? 'translateY(120%)' : 'translateY(0)',
      }}
    >
      {/* Glass container */}
      <div className="w-full mx-3 mb-3 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(var(--card-rgb, 255 255 255) / 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.15) inset',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="flex items-stretch h-14">
          {NAV_ITEMS.map(item => {
            const active = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative select-none"
              >
                {/* Active glow pill */}
                <AnimatePresence>
                  {active && !item.highlight && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute top-1.5 w-10 h-8 rounded-xl bg-primary/15"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                </AnimatePresence>

                {/* AI highlight pill */}
                {item.highlight ? (
                  <div className={cn(
                    'relative w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/40',
                    'mb-0.5 -mt-5',
                    active && 'ring-2 ring-white/30 ring-offset-1 ring-offset-transparent'
                  )}>
                    <item.icon className="w-5 h-5 text-white" />
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-2xl gradient-brand opacity-50 blur-md -z-10" />
                  </div>
                ) : (
                  <div className="relative z-10">
                    <item.icon className={cn(
                      'w-5 h-5 transition-all duration-200',
                      active ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'
                    )} />
                    {item.badge && unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                )}

                {!item.highlight && (
                  <span className={cn(
                    'text-[10px] font-medium transition-colors relative z-10',
                    active ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                )}
                {item.highlight && (
                  <span className={cn(
                    'text-[10px] font-semibold',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}>AI</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}