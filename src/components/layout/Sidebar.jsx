import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Home, BookOpen, Users, ShoppingBag, Bot, Bell,
  School, Trophy, ChevronLeft, ChevronRight,
  GraduationCap, Sparkles, Settings, LogOut, Play, ShieldCheck, CalendarDays, MessageCircle
} from 'lucide-react';

const NAV = [
  { icon: Home,        label: 'Feed',        path: '/',           color: 'text-blue-500' },
  { icon: School,      label: 'Schools',     path: '/schools',    color: 'text-purple-500' },
  { icon: BookOpen,    label: 'Classroom',   path: '/classroom',  color: 'text-green-500' },
  { icon: Users,       label: 'Communities', path: '/communities',color: 'text-amber-500' },
  { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace',color: 'text-rose-500' },
  { icon: MessageCircle, label: 'Messages',  path: '/messages',   color: 'text-teal-500' },
  { icon: Bot,         label: 'AI Tutor',    path: '/ai-tutor',   color: 'text-cyan-500' },
  { icon: Bell,        label: 'Notifications',path:'/notifications',color:'text-orange-500' },
  { icon: Trophy,      label: 'Leaderboard', path: '/leaderboard',color: 'text-yellow-500' },
  { icon: Play,        label: 'Reels',       path: '/reels',      color: 'text-rose-500' },
  { icon: GraduationCap, label: 'Campus',    path: '/campus',     color: 'text-indigo-500' },
  { icon: CalendarDays,  label: 'Planner',   path: '/planner',    color: 'text-violet-500' },
];

export default function Sidebar({ user, collapsed, onToggle }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user?.email) {
      base44.entities.Notification.filter({ user_email: user.email, is_read: false })
        .then(n => setUnread(n.length)).catch(() => {});
    }
  }, [user?.email, location.pathname]);

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-card border-r border-border z-40 flex flex-col transition-all duration-300 shadow-sm",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <span className="font-black text-lg gradient-brand-text tracking-tight">StudentOS</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Learn · Grow · Connect</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(item => {
          const active = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const isNotif = item.path === '/notifications';
          return (
            <Link key={item.path} to={item.path}>
              <div className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <div className="relative flex-shrink-0">
                  <item.icon className={cn("w-5 h-5", active ? "text-primary" : item.color, "group-hover:scale-110 transition-transform")} />
                  {isNotif && unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className={cn("text-sm font-medium truncate", active && "font-semibold")}>
                    {item.label}
                  </span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* About & Contact footer links */}
      <div className="px-2 pb-1 flex gap-1">
        <Link to="/about" className="flex-1">
          <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span className="text-[11px] font-medium">About</span>}
          </div>
        </Link>
        <Link to="/contact" className="flex-1">
          <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span className="text-[11px] font-medium">Contact</span>}
          </div>
        </Link>
      </div>

      {/* Admin link for admins */}
      {user?.role === 'admin' && (
        <div className="px-2 pb-1">
          <Link to="/admin">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/20 hover:from-blue-600/30 transition-all">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
              {!collapsed && <span className="text-xs font-bold text-blue-300">Owner Dashboard</span>}
            </div>
          </Link>
        </div>
      )}

      {/* User + Collapse */}
      <div className="border-t border-border p-2 flex-shrink-0">
        <Link to={`/profile/${user?.email}`}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
            <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-gradient-brand text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground mt-1"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}