import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Star, Zap, Medal, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TIER_CONFIG = [
  { min: 0, label: 'Beginner', color: 'text-gray-500', bg: 'bg-gray-100', icon: Star },
  { min: 100, label: 'Explorer', color: 'text-blue-500', bg: 'bg-blue-100', icon: Zap },
  { min: 300, label: 'Scholar', color: 'text-green-500', bg: 'bg-green-100', icon: BookOpen2 },
  { min: 700, label: 'Champion', color: 'text-purple-500', bg: 'bg-purple-100', icon: Medal },
  { min: 1500, label: 'Legend', color: 'text-amber-500', bg: 'bg-amber-100', icon: Crown },
];

function getTier(xp) {
  for (let i = TIER_CONFIG.length - 1; i >= 0; i--) {
    if (xp >= TIER_CONFIG[i].min) return TIER_CONFIG[i];
  }
  return TIER_CONFIG[0];
}

function BookOpen2({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}

const RANK_ICONS = [
  <Crown key={0} className="w-5 h-5 text-amber-500" />,
  <Medal key={1} className="w-5 h-5 text-slate-400" />,
  <Trophy key={2} className="w-5 h-5 text-amber-700" />,
];

export default function Leaderboard() {
  const { user } = useOutletContext();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.UserProfile.list('-xp_points', 50).then(setProfiles).finally(() => setLoading(false));
  }, []);

  const myProfile = profiles.find(p => p.user_email === user?.email);
  const myRank = profiles.findIndex(p => p.user_email === user?.email) + 1;
  const myXP = myProfile?.xp_points || 0;
  const myTier = getTier(myXP);
  const TierIcon = myTier.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Leaderboard</h1>
          <p className="text-muted-foreground">Top learners this month</p>
        </div>
      </div>

      {/* My Stats */}
      {myProfile && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${myTier.bg} flex items-center justify-center`}>
              <TierIcon className={`w-6 h-6 ${myTier.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold">{user?.full_name}</p>
                <Badge className={`text-[10px] ${myTier.bg} ${myTier.color} border-0`}>{myTier.label}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />{myXP} XP</span>
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" />{myProfile.streak_days || 0} day streak</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-500" />Rank #{myRank || '—'}</span>
              </div>
            </div>
          </div>
          {/* XP Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{myTier.label}</span>
              <span>{myXP} XP</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="gradient-brand h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (myXP % 500) / 5)}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[profiles[1], profiles[0], profiles[2]].map((p, idx) => {
              if (!p) return <div key={idx} />;
              const position = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const pi = p.user_email?.[0]?.toUpperCase() || '?';
              const tier = getTier(p.xp_points || 0);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className={`p-4 text-center ${position === 1 ? 'bg-gradient-to-b from-amber-50 to-card border-amber-200' : ''}`}>
                    <div className="flex justify-center mb-2">{RANK_ICONS[position - 1]}</div>
                    <Avatar className="h-12 w-12 mx-auto mb-2">
                      <AvatarFallback className="gradient-brand text-white font-bold">{pi}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-xs truncate">{p.user_email?.split('@')[0]}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">{p.xp_points || 0} XP</p>
                    <Badge className={`text-[9px] mt-1 ${tier.bg} ${tier.color} border-0`}>{tier.label}</Badge>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Full list */}
          <Card className="overflow-hidden">
            {profiles.map((p, idx) => {
              const isMe = p.user_email === user?.email;
              const tier = getTier(p.xp_points || 0);
              const TI = tier.icon;
              const pi = p.user_email?.[0]?.toUpperCase() || '?';
              return (
                <div key={p.id} className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 transition-colors ${isMe ? 'bg-primary/5' : 'hover:bg-muted'}`}>
                  <span className={`w-8 text-center font-black text-sm ${idx < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="gradient-brand text-white text-xs">{pi}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : ''}`}>
                        {p.user_email?.split('@')[0]}{isMe ? ' (you)' : ''}
                      </p>
                      <Badge className={`text-[9px] ${tier.bg} ${tier.color} border-0 hidden sm:block`}>{tier.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{p.xp_points || 0} XP</span>
                      {p.streak_days > 0 && <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" />{p.streak_days}d</span>}
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-lg ${tier.bg} flex items-center justify-center`}>
                    <TI className={`w-4 h-4 ${tier.color}`} />
                  </div>
                </div>
              );
            })}
            {profiles.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No rankings yet. Start learning to earn XP!</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}