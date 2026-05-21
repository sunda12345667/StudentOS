import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, LogOut, User, Moon, Sun, GraduationCap } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/ThemeContext';

export default function Topbar({ user, sidebarCollapsed, isMobile }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const leftOffset = isMobile ? 0 : sidebarCollapsed ? 64 : 240;

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-card/80 backdrop-blur border-b border-border z-30 flex items-center gap-3 px-4 transition-all duration-300"
      style={{ left: leftOffset }}
    >
      {/* Mobile logo */}
      {isMobile && (
        <div className="flex items-center gap-2 mr-1">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base gradient-brand-text tracking-tight">StudentOS</span>
        </div>
      )}

      {/* Search — hidden on small mobile, visible on md+ */}
      <div className="flex-1 max-w-md hidden sm:block">
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

      {/* Spacer on mobile when search is hidden */}
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2 ml-auto">
        {/* Search icon on mobile */}
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:hidden">
          <Search className="w-4 h-4" />
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
              <Link to="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-2" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}