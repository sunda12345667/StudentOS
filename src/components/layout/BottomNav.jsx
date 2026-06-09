import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Play, Bot, ShoppingBag, MessageCircle } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,          label: 'Home',     path: '/' },
  { icon: Play,          label: 'Reels',    path: '/reels' },
  { icon: Bot,           label: 'AI',       path: '/ai-tutor', highlight: true },
  { icon: ShoppingBag,   label: 'Market',   path: '/marketplace' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
];

export default function BottomNav({ user, hidden = false }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.email) return;
    // Set global user email for profile link
    if (typeof window !== 'undefined') {
      window.__CURRENT_USER_EMAIL__ = user.email;
    }
  }, [user?.email]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center transition-transform duration-200 md:block keyboard-hide-nav"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)',
        transform: hidden ? 'translateY(120%)' : 'translateY(0)',
      }}
    >
      {/* Glass container */}
      <div className="w-full mx-2 mb-0 rounded-xl overflow-hidden"
        style={{
          background: 'rgba(var(--card-rgb, 255 255 255) / 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.1) inset',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-stretch h-12">
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
                    'relative w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-primary/30',
                    'mb-0.5 -mt-4',
                    active && 'ring-2 ring-white/20 ring-offset-1 ring-offset-transparent'
                  )}>
                    <item.icon className="w-4 h-4 text-white" />
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-xl gradient-brand opacity-40 blur-sm -z-10" />
                  </div>
                ) : (
                  <div className="relative z-10">
                    <item.icon className={cn(
                      'w-4 h-4 transition-all duration-200',
                      active ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'
                    )} />
                  </div>
                )}

                {!item.highlight && (
                  <span className={cn(
                    'text-[9px] font-medium transition-colors relative z-10',
                    active ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                )}
                {item.highlight && (
                  <span className={cn(
                    'text-[9px] font-semibold',
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