import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MobileFeedHeader({ feedFilter, setFeedFilter, activeHashtag, setActiveHashtag }) {
  return (
    <div className="flex items-center border-b border-border lg:border-0 lg:gap-2 lg:px-1">
      {['all', 'following'].map(f => (
        <button
          key={f}
          onClick={() => { setFeedFilter(f); setActiveHashtag(null); }}
          className={cn(
            'flex-1 lg:flex-none py-3 lg:py-1.5 text-sm font-semibold transition-all relative',
            'lg:rounded-full lg:h-8 lg:px-4 lg:text-xs',
            feedFilter === f && !activeHashtag
              ? 'text-foreground lg:gradient-brand lg:border-0 lg:text-white lg:shadow-md'
              : 'text-muted-foreground hover:text-foreground lg:bg-muted lg:border-0'
          )}
        >
          {f === 'all' ? 'For You' : 'Following'}
          {/* Mobile underline indicator */}
          {feedFilter === f && !activeHashtag && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary lg:hidden" />
          )}
        </button>
      ))}
      {activeHashtag && (
        <Badge className="gradient-brand text-white border-0 gap-1 pl-3 pr-2 py-1.5 text-xs flex-shrink-0 mx-2">
          #{activeHashtag}
          <button onClick={() => setActiveHashtag(null)} className="ml-0.5 hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}