import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Settings, LogOut, User, Moon, Sun, GraduationCap, Bell } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/ThemeContext';

export default function Topbar({ user, sidebarCollapsed, isMobile }) {
  const [query, setQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  // Load unread notification count + subscribe to real-time updates
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 99)
      .then(notifs => setUnreadCount(notifs.length));

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email !== user.email) return;
      if (event.type === 'create') setUnreadCount(c => c + 1);
      if (event.type === 'update' && event.data?.is_read) {
        // re-fetch count to stay accurate
        base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 99)
          .then(notifs => setUnreadCount(notifs.length));
      }
    });
    return unsub;
  }, [user?.email]);

  const leftOffset = isMobile ? 0 : sidebarCollapsed ? 64 : 240;

  return (
    <header
      className="fixed top-0 right-0 h-14 bg-card/90 backdrop-blur border-b border-border z-30 flex items-center gap-3 px-4 transition-all duration-300"
      style={{ left: leftOffset }}
    >
      {/* Mobile: avatar on left, logo center, settings on right */}
      {isMobile ? (
        <>
          <Link to={`/profile/${user?.email}`}>
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="gradient-brand text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-base gradient-brand-text tracking-tight">StudentOS</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative" asChild>
              <Link to="/notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] gradient-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Desktop layout unchanged */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, people, topics..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 bg-muted border-0 rounded-full h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative" asChild>
              <Link to="/notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] gradient-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-9 w-9">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="gradient-brand text-white text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-semibold text-sm">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${user?.email}`} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer gap-2">
                    <Settings className="w-4 h-4" />Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => base44.auth.logout()}>
                  <LogOut className="w-4 h-4 mr-2" />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </header>
  );
}