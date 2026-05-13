import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Bookmark, Clock, ShoppingBag, Film, Calendar, Flag } from 'lucide-react';

const menuItems = [
  { icon: Users, label: 'Friends', path: '/friends' },
  { icon: Clock, label: 'Memories', path: '#' },
  { icon: Bookmark, label: 'Saved', path: '#' },
  { icon: Users, label: 'Groups', path: '#' },
  { icon: Film, label: 'Video', path: '#' },
  { icon: ShoppingBag, label: 'Marketplace', path: '#' },
  { icon: Calendar, label: 'Events', path: '#' },
  { icon: Flag, label: 'Pages', path: '#' },
];

export default function LeftSidebar({ user }) {
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="hidden lg:block w-72 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4 pr-4">
      <nav className="space-y-0.5">
        <Link to={`/profile/${user?.email}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{user?.full_name}</span>
        </Link>
        {menuItems.map(item => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-6 px-3 text-xs text-muted-foreground">
        Privacy · Terms · Advertising · Cookies · More · © 2026
      </div>
    </div>
  );
}