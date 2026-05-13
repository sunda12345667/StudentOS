import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ConversationList({ conversations, currentUser, selectedId, onSelect }) {
  return (
    <div className="space-y-0.5">
      {conversations.map(conv => {
        const otherIdx = conv.participants?.indexOf(currentUser?.email) === 0 ? 1 : 0;
        const otherName = conv.participant_names?.[otherIdx] || 'Unknown';
        const otherAvatar = conv.participant_avatars?.[otherIdx] || '';
        const initials = otherName.split(' ').map(n => n[0]).join('').toUpperCase();
        const isSelected = conv.id === selectedId;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
              isSelected ? "bg-primary/10" : "hover:bg-secondary"
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{otherName}</p>
              {conv.last_message && (
                <p className="text-xs text-muted-foreground truncate">
                  {conv.last_sender === currentUser?.email ? 'You: ' : ''}
                  {conv.last_message}
                </p>
              )}
            </div>
            {conv.last_message_time && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: false })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}