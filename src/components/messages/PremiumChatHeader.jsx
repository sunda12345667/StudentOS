import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PremiumChatHeader({ user, other, onBack }) {
  return (
    <div className="flex-shrink-0 px-3 py-2.5 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between">
      {/* Left: Back + Avatar + Info */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Link to={`/profile/${other.email}`} className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={other.avatar} />
              <AvatarFallback className="gradient-brand text-white text-xs font-bold">{other.initials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{other.name}</p>
            <p className="text-xs text-green-500 font-medium">Active now</p>
          </div>
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}