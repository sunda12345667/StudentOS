import { useState } from 'react';
import { Bell, Search, Menu, ChevronDown, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminTopbar({ user, onMenuOpen, title, subtitle }) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuOpen} className="lg:hidden text-white/50 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">{title}</h1>
          {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
        </div>
      </div>

      {/* Search */}
      <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
        searchFocused ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/5'
      }`}>
        <Search className="w-4 h-4 text-white/40" />
        <input
          className="bg-transparent text-white text-sm placeholder-white/30 outline-none w-44"
          placeholder="Search anything..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
          <Bell className="w-4 h-4 text-white/70" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
          <Avatar className="w-8 h-8 border border-blue-500/40">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold">
              {user?.full_name?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-white text-xs font-semibold">{user?.full_name || 'Admin'}</p>
            <p className="text-white/40 text-[10px]">Platform Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}