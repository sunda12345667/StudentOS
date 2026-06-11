import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Play, Trophy, BookOpen, Flame, Users, ArrowUp, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';
import StoriesBar from '@/components/social/StoriesBar';
import TrendingPanel from '@/components/social/TrendingPanel';
import MobileFeedHeader from '@/components/feed/MobileFeedHeader';

const PAGE_SIZE = 15;

export default function Feed() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [feedFilter, setFeedFilter] = useState('all');
  const [followingEmails, setFollowingEmails] = useState([]);
  const [newPostCount, setNewPostCount] = useState(0);
  // savedIds: Set of post IDs the user has bookmarked — loaded ONCE, shared to all PostCards
  const [savedIds, setSavedIds] = useState(new Set());
  const [userProfile, setUserProfile] = useState(null);
  const sentinelRef = useRef(null);
  const skipRef = useRef(0);
  const newPostTimerRef = useRef(null);

  // Load initial page
  const load = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Post.list('-created_date', PAGE_SIZE);
    setPosts(data);
    skipRef.current = data.length;
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
    setNewPostCount(0);
  }, []);

  // Cursor-based pagination — uses skip, never re-fetches old posts
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = await base44.entities.Post.list('-created_date', PAGE_SIZE, skipRef.current);
    if (!next || next.length === 0) { setHasMore(false); setLoadingMore(false); return; }
    setPosts(p => [...p, ...next]);
    skipRef.current += next.length;
    setHasMore(next.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  useEffect(() => { load(); }, [load]);

  // Real-time: batch new-post notifications (max 1 update per 3s) to avoid per-event re-renders
  useEffect(() => {
    const unsub = base44.entities.Post.subscribe((event) => {
      if (event.type === 'create' && event.data?.author_email !== user?.email) {
        if (newPostTimerRef.current) return; // already pending
        newPostTimerRef.current = setTimeout(() => {
          setNewPostCount(c => c + 1);
          newPostTimerRef.current = null;
        }, 3000);
      }
    });
    return () => { unsub(); clearTimeout(newPostTimerRef.current); };
  }, [user?.email]);

  // Load ALL saved post IDs + user profile in ONE batch
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.SavedPost.filter({ user_email: user.email }, 'created_date', 200)
      .then(res => setSavedIds(new Set(res.map(s => s.post_id))))
      .catch(() => {});
    base44.entities.UserProfile.filter({ user_email: user.email })
      .then(res => { if (res?.[0]) setUserProfile(res[0]); })
      .catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    if (user?.email && feedFilter === 'following') {
      base44.entities.Follow.filter({ follower_email: user.email })
        .then(follows => setFollowingEmails(follows.map(f => f.following_email)))
        .catch(() => {});
    }
  }, [user?.email, feedFilter]);

  const filteredPosts = posts.filter(post => {
    if (activeHashtag) {
      const inTags = post.tags?.some(t => t.toLowerCase() === activeHashtag.toLowerCase());
      const inContent = new RegExp(`#${activeHashtag}`, 'i').test(post.content || '');
      return inTags || inContent;
    }
    if (feedFilter === 'following' && followingEmails.length > 0) {
      return followingEmails.includes(post.author_email);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto lg:px-4 lg:py-6 lg:grid lg:grid-cols-4 lg:gap-6">

      {/* ── LEFT SIDEBAR (desktop only) ── */}
      <div className="hidden lg:block space-y-4">
        <Card className="p-4">
          <Link to={`/profile/${user?.email}`}>
            <div className="flex items-center gap-3 hover:bg-muted -mx-2 px-2 py-2 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">View profile →</p>
              </div>
            </div>
          </Link>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Links</p>
          {[
            { icon: BookOpen, label: 'My Courses', path: '/classroom', color: 'text-green-500' },
            { icon: Play, label: 'Reels', path: '/reels', color: 'text-rose-500' },
            { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', color: 'text-amber-500' },
            { icon: Sparkles, label: 'AI Tutor', path: '/ai-tutor', color: 'text-cyan-500' },
            { icon: Users, label: 'Campus', path: '/campus', color: 'text-violet-500' },
            { icon: Bookmark, label: 'Saved Posts', path: '/saved', color: 'text-violet-400' },
          ].map(item => (
            <Link key={item.path} to={item.path}>
              <div className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </Card>
      </div>

      {/* ── CENTER FEED ── */}
      <div className="lg:col-span-2 space-y-0 lg:space-y-4">

        {/* Stories */}
        {user && (
          <div className="px-4 pt-3 pb-0 lg:rounded-2xl lg:bg-card/80 lg:backdrop-blur-md lg:border lg:border-white/5 lg:shadow-sm lg:px-4 lg:py-3 border-b border-white/5 lg:border">
            <StoriesBar user={user} />
          </div>
        )}

        {/* Feed Filter — full-width tabs on mobile, pill on desktop */}
        <MobileFeedHeader
          feedFilter={feedFilter}
          setFeedFilter={setFeedFilter}
          activeHashtag={activeHashtag}
          setActiveHashtag={setActiveHashtag}
        />

        {/* Secondary nav strip */}
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-white/5">
          {[
            { icon: Flame,    label: 'Trending',   color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', path: '/communities' },
            { icon: Play,     label: 'Reels',      color: 'bg-rose-500/15 text-rose-400 border-rose-500/20',       path: '/reels' },
            { icon: Trophy,   label: 'Rankings',   color: 'bg-amber-500/15 text-amber-400 border-amber-500/20',    path: '/leaderboard' },
            { icon: Sparkles, label: 'AI Tutor',   color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',       path: '/ai-tutor' },
            { icon: Users,    label: 'Groups',     color: 'bg-violet-500/15 text-violet-400 border-violet-500/20', path: '/campus' },
            { icon: BookOpen, label: 'Marketplace',color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', path: '/marketplace' },
          ].map(item => (
            <Link key={item.path} to={item.path} className="flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${item.color}`}>
                <item.icon className="w-3 h-3" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        {/* New posts banner */}
        <AnimatePresence>
          {newPostCount > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="px-4 lg:px-0">
              <button onClick={load}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl gradient-brand text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity">
                <ArrowUp className="w-4 h-4" />
                {newPostCount} new {newPostCount === 1 ? 'post' : 'posts'} — tap to refresh
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Post */}
        <div className="px-4 py-3 lg:px-0 lg:py-0 border-b border-border/50 lg:border-0">
          {user && <CreatePostBox user={user} userProfile={userProfile} onPosted={load} />}
        </div>

        {/* Post list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Loading your feed...</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="px-3 lg:px-0">
            <Card className="p-12 text-center rounded-2xl">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
              <p className="font-semibold text-lg">
                {activeHashtag ? `No posts with #${activeHashtag}` : feedFilter === 'following' ? 'No posts yet' : 'Feed is empty'}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {feedFilter === 'following' ? 'Follow people to see their posts' : 'Be the first to post!'}
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-0 lg:space-y-3">
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
              >
                <PostCard
                  post={post}
                  currentUser={user}
                  savedIds={savedIds}
                  onSaveToggle={(postId, isSaved) => {
                    setSavedIds(prev => {
                      const next = new Set(prev);
                      isSaved ? next.add(postId) : next.delete(postId);
                      return next;
                    });
                  }}
                  onDelete={id => setPosts(p => p.filter(x => x.id !== id))}
                  onHashtagClick={tag => { setActiveHashtag(tag); setFeedFilter('all'); }}
                />
                <div className="h-px bg-border lg:hidden" />
              </motion.div>
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">You're all caught up!</p>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT SIDEBAR (desktop only) ── */}
      <div className="hidden lg:block">
        <TrendingPanel user={user} onHashtagClick={tag => { setActiveHashtag(tag); setFeedFilter('all'); }} />
      </div>
    </div>
  );
}