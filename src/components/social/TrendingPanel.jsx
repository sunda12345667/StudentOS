import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp, UserPlus, Check, Loader2, GraduationCap, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrendingPanel({ user, onHashtagClick }) {
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followStates, setFollowStates] = useState({});
  const [loadingFollow, setLoadingFollow] = useState({});

  useEffect(() => {
    loadTrending();
    loadSuggestions();
  }, [user?.email]);

  // Educational keyword boost: any tag/topic matching these gets a 3x score multiplier
  const EDU_KEYWORDS = [
    'math','maths','mathematics','algebra','calculus','geometry','statistics','trigonometry',
    'science','physics','chemistry','biology','anatomy','astronomy',
    'coding','programming','python','javascript','java','html','css','algorithm','datastructure',
    'history','geography','literature','english','grammar','writing','essay',
    'exam','quiz','test','study','studygroup','examprep','revision','homework','assignment',
    'tutorial','lesson','lecture','course','class','workshop',
    'project','research','thesis','experiment','lab',
    'scholarship','fellowship','grant','bursary','internship','career',
    'campus','campusnews','announcement','event','club',
    'tip','trick','hack','howto','learnwith','explained','notes','summary',
  ];

  const isEducational = (tag) => {
    const lower = tag.toLowerCase();
    return EDU_KEYWORDS.some(k => lower.includes(k) || k.includes(lower));
  };

  const loadTrending = async () => {
    const posts = await base44.entities.Post.list('-created_date', 100).catch(() => []);
    const tagCounts = {};

    posts.forEach(p => {
      // From explicit tags
      (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      // From hashtags in content
      const matches = (p.content || '').match(/#\w+/g) || [];
      matches.forEach(m => {
        const t = m.slice(1);
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    // Apply educational boost multiplier (3x for edu topics)
    const scored = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count,
      score: isEducational(tag) ? count * 3 : count,
      isEdu: isEducational(tag),
    }));

    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 8);
    setTrending(sorted);
  };

  const loadSuggestions = async () => {
    if (!user?.email) return;
    const [allUsers, follows] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Follow.filter({ follower_email: user.email }).catch(() => []),
    ]);
    const followingEmails = new Set(follows.map(f => f.following_email));
    followingEmails.add(user.email);
    const suggest = allUsers.filter(u => !followingEmails.has(u.email)).slice(0, 4);
    setSuggestions(suggest);
    const states = {};
    follows.forEach(f => { states[f.following_email] = true; });
    setFollowStates(states);
  };

  const handleFollow = async (targetUser) => {
    setLoadingFollow(p => ({ ...p, [targetUser.email]: true }));
    if (followStates[targetUser.email]) {
      const follows = await base44.entities.Follow.filter({ follower_email: user.email, following_email: targetUser.email });
      if (follows.length) await base44.entities.Follow.delete(follows[0].id);
      setFollowStates(p => ({ ...p, [targetUser.email]: false }));
    } else {
      await base44.entities.Follow.create({
        follower_email: user.email, follower_name: user.full_name, follower_avatar: user.avatar_url || '',
        following_email: targetUser.email, following_name: targetUser.full_name, following_avatar: targetUser.avatar || '',
      });
      setFollowStates(p => ({ ...p, [targetUser.email]: true }));
    }
    setLoadingFollow(p => ({ ...p, [targetUser.email]: false }));
  };

  return (
    <div className="space-y-4">
      {/* Trending Hashtags */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-bold">Trending Now</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-semibold">
            <GraduationCap className="w-3 h-3" />EDU Boosted
          </span>
        </div>
        {trending.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trending topics yet</p>
        ) : (
          <div className="space-y-1.5">
            {trending.map(({ tag, count, isEdu }, i) => (
              <button
                key={tag}
                onClick={() => onHashtagClick?.(tag)}
                className="w-full flex items-center justify-between hover:bg-muted px-2 py-1.5 rounded-lg transition-colors group text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-primary group-hover:underline">#{tag}</p>
                      {isEdu && (
                        <span title="Educational content boosted" className="flex items-center gap-0.5 bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          <GraduationCap className="w-2.5 h-2.5" />EDU
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{count} post{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {isEdu
                  ? <Zap className="w-3.5 h-3.5 text-green-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                  : <TrendingUp className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                }
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Who to Follow */}
      {suggestions.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-bold mb-3">Who to Follow</p>
          <div className="space-y-3">
            {suggestions.map(u => {
              const ui = u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
              const isFollowing = followStates[u.email];
              return (
                <div key={u.email} className="flex items-center gap-2">
                  <Link to={`/profile/${u.email}`}>
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="gradient-brand text-white text-xs font-bold">{ui}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u.email}`} className="text-sm font-semibold hover:underline truncate block">{u.full_name}</Link>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'default'}
                    className={`h-7 text-xs flex-shrink-0 gap-1 ${isFollowing ? '' : 'gradient-brand border-0'}`}
                    onClick={() => handleFollow(u)}
                    disabled={loadingFollow[u.email]}
                  >
                    {loadingFollow[u.email] ? <Loader2 className="w-3 h-3 animate-spin" /> :
                      isFollowing ? <><Check className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}