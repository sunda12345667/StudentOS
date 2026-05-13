import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, BookOpen, Trophy, Sparkles, Play, X } from 'lucide-react';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';
import StoriesBar from '@/components/social/StoriesBar';
import TrendingPanel from '@/components/social/TrendingPanel';

export default function Feed() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'following'
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
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left – Quick Links */}
      <div className="hidden lg:block space-y-4">
        <Card className="p-4">
          <Link to={`/profile/${user?.email}`}>
            <div className="flex items-center gap-3 hover:bg-muted -mx-2 px-2 py-2 rounded-lg transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="gradient-brand text-white font-bold text-sm">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">View profile</p>
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
          ].map(item => (
            <Link key={item.path} to={item.path}>
              <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </Card>
      </div>

      {/* Center – Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Stories */}
        {user && (
          <Card className="p-4">
            <StoriesBar user={user} />
          </Card>
        )}

        {/* Feed Filter Tabs */}
        <div className="flex items-center gap-2">
          {['all', 'following'].map(f => (
            <Button
              key={f}
              size="sm"
              variant={feedFilter === f ? 'default' : 'outline'}
              className={`rounded-full capitalize ${feedFilter === f ? 'gradient-brand border-0' : ''}`}
              onClick={() => { setFeedFilter(f); setActiveHashtag(null); }}
            >
              {f === 'all' ? '🌍 Everyone' : '👥 Following'}
            </Button>
          ))}
          {/* Active hashtag filter */}
          {activeHashtag && (
            <Badge className="gradient-brand text-white border-0 gap-1 pl-3 pr-2 py-1.5 text-sm">
              #{activeHashtag}
              <button onClick={() => setActiveHashtag(null)} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>

        {user && <CreatePostBox user={user} onPosted={load} />}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your feed...</p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-lg">
              {activeHashtag ? `No posts with #${activeHashtag}` : feedFilter === 'following' ? 'No posts from people you follow' : 'Your feed is empty'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {feedFilter === 'following' ? 'Follow people to see their posts here' : 'Be the first to post something!'}
            </p>
          </Card>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onDelete={id => setPosts(p => p.filter(x => x.id !== id))}
              onHashtagClick={tag => { setActiveHashtag(tag); setFeedFilter('all'); }}
            />
          ))
        )}
      </div>

      {/* Right – Trending */}
      <div className="hidden lg:block">
        <TrendingPanel user={user} onHashtagClick={tag => { setActiveHashtag(tag); setFeedFilter('all'); }} />
      </div>
    </div>
  );
}