import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, LogOut, User, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function Topbar({ user, sidebarCollapsed }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <header className={`fixed top-0 right-0 h-16 bg-card/80 backdrop-blur border-b border-border z-30 flex items-center gap-4 px-4 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-60'}`}>
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
            <DropdownMenuItem asChild><Link to={`/profile/${user?.email}`} className="cursor-pointer"><User className="w-4 h-4 mr-2" />Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/settings" className="cursor-pointer"><Settings className="w-4 h-4 mr-2" />Settings</Link></DropdownMenuItem>
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