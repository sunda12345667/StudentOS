import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, TrendingUp, Sparkles, BookOpen, Trophy, Flame } from 'lucide-react';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';

export default function Feed() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await base44.entities.Post.list('-created_date', 40);
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
            { icon: TrendingUp, label: 'Marketplace', path: '/marketplace', color: 'text-rose-500' },
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
        {user && <CreatePostBox user={user} onPosted={load} />}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your feed...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
            <p className="font-semibold text-lg">Your feed is empty</p>
            <p className="text-muted-foreground text-sm mt-1">Join communities and follow courses to see posts</p>
          </Card>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onDelete={id => setPosts(p => p.filter(x => x.id !== id))} />
          ))
        )}
      </div>

      {/* Right – Trending */}
      <div className="hidden lg:block space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-semibold">Trending Topics</p>
          </div>
          <div className="space-y-2">
            {['#Mathematics', '#Python101', '#StudyGroup', '#ExamPrep', '#ScienceFair'].map(tag => (
              <div key={tag} className="flex items-center justify-between hover:bg-muted px-2 py-1.5 rounded-lg cursor-pointer">
                <span className="text-sm font-medium text-primary">{tag}</span>
                <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 500 + 50)} posts</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Today's Schedule</p>
          <div className="space-y-2">
            {[
              { time: '9:00 AM', title: 'Math Class', color: 'bg-blue-500' },
              { time: '11:00 AM', title: 'Quiz Due', color: 'bg-red-500' },
              { time: '2:00 PM', title: 'Science Lab', color: 'bg-green-500' },
            ].map(ev => (
              <div key={ev.time} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${ev.color}`} />
                <span className="text-xs text-muted-foreground w-16">{ev.time}</span>
                <span className="text-xs font-medium">{ev.title}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}