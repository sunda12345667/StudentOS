import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2 } from 'lucide-react';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';

const CAT_COLORS = { subject: 'from-blue-500 to-indigo-600', club: 'from-purple-500 to-pink-600', sports: 'from-green-500 to-emerald-600', arts: 'from-pink-500 to-rose-600', science: 'from-cyan-500 to-blue-600', technology: 'from-violet-500 to-purple-600', language: 'from-amber-500 to-orange-600', general: 'from-gray-500 to-slate-600' };

export default function CommunityDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const [comms, ps] = await Promise.all([
      base44.entities.Community.filter({ id }),
      base44.entities.Post.filter({ community_id: id }, '-created_date', 30),
    ]);
    if (comms.length) setCommunity(comms[0]);
    setPosts(ps);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!community) return <div className="text-center py-20">Community not found</div>;

  const colorClass = community.color || 'from-blue-500 to-indigo-600';
  const isMember = community.member_emails?.includes(user?.email);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Banner */}
      <Card className={`bg-gradient-to-br ${colorClass} text-white p-6 mb-6`}>
        <Badge className="bg-white/20 text-white border-0 mb-2">{community.category}</Badge>
        <h1 className="text-3xl font-black mb-1">{community.name}</h1>
        <p className="text-white/80 text-sm mb-3">{community.description}</p>
        <div className="flex items-center gap-1 text-sm">
          <Users className="w-4 h-4" />
          <span>{community.member_count || 0} members</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {isMember && user && (
            <CreatePostBox user={user} onPosted={load} extraData={{ community_id: id }} />
          )}
          {posts.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No posts yet. Be the first to share!</Card>
          ) : (
            posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onDelete={pid => setPosts(prev => prev.filter(x => x.id !== pid))} />)
          )}
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Members ({community.member_count || 0})</h3>
            <div className="flex flex-wrap gap-1">
              {(community.member_emails || []).slice(0, 12).map(email => (
                <Avatar key={email} className="h-8 w-8">
                  <AvatarFallback className="gradient-brand text-white text-xs">{email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}