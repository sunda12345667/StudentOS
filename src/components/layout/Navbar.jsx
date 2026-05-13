import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Home, Users, MessageCircle, Bell, Search, LogOut, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar({ user }) {
  const location = useLocation();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.email) {
      base44.entities.Notification.filter({ user_email: user.email, is_read: false })
        .then(notifs => setUnreadNotifs(notifs.length))
        .catch(() => {});
    }
  }, [user?.email, location.pathname]);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifs },
  ];

  const isActive = (path) => location.pathname === path;
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Search */}
          <div className="flex items-center gap-3 flex-1">
            <Link to="/" className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">f</span>
              </div>
            </Link>
            <div className="hidden sm:block relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-0 rounded-full h-10"
              />
            </div>
          </div>

          {/* Nav Items - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={`relative px-8 py-6 rounded-lg transition-all ${
                    isActive(item.path) 
                      ? 'text-primary border-b-2 border-primary rounded-b-none' 
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          {/* Profile + Mobile Menu */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-9 w-9">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link to={`/profile/${user?.email}`}>
                  <DropdownMenuItem className="cursor-pointer">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">View profile</p>
                    </div>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${isActive(item.path) ? 'text-primary bg-primary/5' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.badge > 0 && (
                  <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}