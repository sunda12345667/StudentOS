import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MobileFeedHeader({ feedFilter, setFeedFilter, activeHashtag, setActiveHashtag }) {
  return (
    <div className="flex items-center gap-2 px-1 overflow-x-auto scrollbar-hide">
      {['all', 'following'].map(f => (
        <Button
          key={f}
          size="sm"
          onClick={() => { setFeedFilter(f); setActiveHashtag(null); }}
          className={cn(
            'rounded-full h-8 px-4 text-xs font-semibold flex-shrink-0 transition-all',
            feedFilter === f && !activeHashtag
              ? 'gradient-brand border-0 text-white shadow-md shadow-primary/30'
              : 'bg-muted text-muted-foreground border-0 hover:bg-accent'
          )}
        >
          {f === 'all' ? '🌍 For You' : '👥 Following'}
        </Button>
      ))}
      {activeHashtag && (
        <Badge className="gradient-brand text-white border-0 gap-1 pl-3 pr-2 py-1.5 text-xs flex-shrink-0 h-8">
          #{activeHashtag}
          <button onClick={() => setActiveHashtag(null)} className="ml-0.5 hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}