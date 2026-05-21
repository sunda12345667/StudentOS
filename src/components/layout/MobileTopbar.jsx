import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, GraduationCap, Bell, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';

export default function MobileTopbar({ user }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14"
      style={{
        background: 'rgba(var(--background-rgb, 250 251 255) / 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(var(--border-rgb, 200 210 230) / 0.5)',
      }}
    >
      <AnimatePresence mode="wait">
        {searchOpen ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 h-full px-3"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search students, courses, topics..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 rounded-full bg-muted border-0 h-9 text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 flex-shrink-0"
              onClick={() => { setSearchOpen(false); setQuery(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="bar"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between h-full px-4"
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-primary/30">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-[15px] gradient-brand-text tracking-tight">StudentOS</span>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"
                onClick={() => setSearchOpen(true)}>
                <Search className="w-4.5 h-4.5" />
              </Button>

              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                <Link to="/notifications">
                  <Bell className="w-4.5 h-4.5" />
                </Link>
              </Button>

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 h-9 w-9 ml-0.5">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/25">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="gradient-brand text-white text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <div className="px-3 py-2.5 flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="gradient-brand text-white text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user?.email}`} className="cursor-pointer gap-2.5">
                      <User className="w-4 h-4" />Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/marketplace" className="cursor-pointer gap-2.5">
                      <Wallet className="w-4 h-4" />Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer gap-2.5">
                      <Settings className="w-4 h-4" />Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer gap-2.5"
                    onClick={() => base44.auth.logout()}>
                    <LogOut className="w-4 h-4" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}