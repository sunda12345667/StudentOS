import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Play, Trophy, BookOpen, Flame, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';
import StoriesBar from '@/components/social/StoriesBar';
import TrendingPanel from '@/components/social/TrendingPanel';
import MobileFeedHeader from '@/components/feed/MobileFeedHeader';

export default function Feed() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [feedFilter, setFeedFilter] = useState('all');
  const [followingEmails, setFollowingEmails] = useState([]);

  const load = useCallback(async () => {
    const data = await base44.entities.Post.list('-created_date', 60);
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

        {/* Stories — edge-to-edge on mobile */}
        {user && (
          <div className="lg:rounded-2xl lg:overflow-hidden">
            <div className="bg-card lg:rounded-2xl px-4 py-3 border-b border-border lg:border lg:shadow-sm">
              <StoriesBar user={user} />
            </div>
          </div>
        )}

        {/* Quick explore strip — mobile only */}
        <div className="flex gap-2 px-3 pt-3 overflow-x-auto scrollbar-hide lg:hidden">
          {[
            { icon: Flame, label: 'Trending', color: 'bg-orange-500/10 text-orange-600', path: '/communities' },
            { icon: Play, label: 'Reels', color: 'bg-rose-500/10 text-rose-600', path: '/reels' },
            { icon: Trophy, label: 'Ranks', color: 'bg-amber-500/10 text-amber-600', path: '/leaderboard' },
            { icon: Sparkles, label: 'AI Tutor', color: 'bg-cyan-500/10 text-cyan-600', path: '/ai-tutor' },
          ].map(item => (
            <Link key={item.path} to={item.path} className="flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${item.color} bg-opacity-80`}>
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Feed Filter */}
        <div className="px-3 pt-2 pb-1 lg:px-0 lg:pt-0 lg:pb-0">
          <MobileFeedHeader
            feedFilter={feedFilter}
            setFeedFilter={setFeedFilter}
            activeHashtag={activeHashtag}
            setActiveHashtag={setActiveHashtag}
          />
        </div>

        {/* Create Post */}
        <div className="px-3 lg:px-0">
          {user && <CreatePostBox user={user} onPosted={load} />}
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
                  onDelete={id => setPosts(p => p.filter(x => x.id !== id))}
                  onHashtagClick={tag => { setActiveHashtag(tag); setFeedFilter('all'); }}
                />
                {/* Mobile divider */}
                <div className="h-px bg-border lg:hidden" />
              </motion.div>
            ))}
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