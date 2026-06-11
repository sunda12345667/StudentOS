import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, User, Hash, BookOpen, ShoppingBag, Loader2, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchDropdown({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ profiles: [], posts: [], items: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults({ profiles: [], posts: [], items: [] });
      return;
    }
    const q = debouncedQuery.toLowerCase();
    setLoading(true);

    Promise.all([
      base44.entities.UserProfile.list('-created_date', 100),
      base44.entities.Post.list('-created_date', 100),
      base44.entities.MarketItem.list('-created_date', 50),
    ]).then(([profiles, posts, items]) => {
      setResults({
        profiles: profiles.filter(p =>
          p.username?.toLowerCase().includes(q) ||
          p.school_name?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.user_email?.toLowerCase().includes(q)
        ).slice(0, 5),
        posts: posts.filter(p =>
          p.content?.toLowerCase().includes(q) ||
          p.author_name?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
        ).slice(0, 4),
        items: items.filter(i =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.seller_name?.toLowerCase().includes(q)
        ).slice(0, 3),
      });
    }).finally(() => setLoading(false));
  }, [debouncedQuery]);

  const hasResults = results.profiles.length + results.posts.length + results.items.length > 0;

  const go = (path) => { navigate(path); onClose(); };

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search people, posts, marketplace..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 pr-9 bg-muted border-0 rounded-full h-9 text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {(loading || hasResults || (query.length >= 2 && !loading)) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <div className="py-8 text-center text-muted-foreground text-sm">No results for "{query}"</div>
          )}

          {!loading && results.profiles.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] text-muted-foreground uppercase font-semibold tracking-wide flex items-center gap-1">
                <User className="w-3 h-3" /> People
              </p>
              {results.profiles.map(p => (
                <button key={p.id} onClick={() => go(`/profile/${p.user_email}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={p.avatar_url} />
                    <AvatarFallback className="gradient-brand text-white text-xs">
                      {p.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">@{p.username || p.user_email}</p>
                    {p.school_name && <p className="text-xs text-muted-foreground">{p.school_name}{p.department ? ` · ${p.department}` : ''}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.posts.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] text-muted-foreground uppercase font-semibold tracking-wide flex items-center gap-1">
                <Hash className="w-3 h-3" /> Posts
              </p>
              {results.posts.map(p => (
                <button key={p.id} onClick={() => go('/')}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {p.author_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{p.author_name}</p>
                    <p className="text-sm line-clamp-2">{p.content}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results.items.length > 0 && (
            <div className="border-t border-border">
              <p className="px-4 pt-3 pb-1 text-[10px] text-muted-foreground uppercase font-semibold tracking-wide flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> Marketplace
              </p>
              {results.items.map(i => (
                <button key={i.id} onClick={() => go('/marketplace')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                  {i.image_url
                    ? <img src={i.image_url} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                    : <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-4 h-4 text-muted-foreground" /></div>
                  }
                  <div>
                    <p className="text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-primary font-semibold">₦{i.price?.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}