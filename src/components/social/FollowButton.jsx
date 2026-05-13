import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

export default function FollowButton({ currentUser, targetEmail, targetName, targetAvatar }) {
  const [following, setFollowing] = useState(false);
  const [followRecord, setFollowRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.email || !targetEmail) { setLoading(false); return; }
    Promise.all([
      base44.entities.Follow.filter({ follower_email: currentUser.email, following_email: targetEmail }),
      base44.entities.Follow.filter({ following_email: targetEmail }),
    ]).then(([myFollow, allFollows]) => {
      setFollowing(myFollow.length > 0);
      setFollowRecord(myFollow[0] || null);
      setCount(allFollows.length);
    }).finally(() => setLoading(false));
  }, [currentUser?.email, targetEmail]);

  const toggle = async () => {
    setLoading(true);
    if (following && followRecord) {
      await base44.entities.Follow.delete(followRecord.id);
      setFollowing(false);
      setFollowRecord(null);
      setCount(c => Math.max(0, c - 1));
    } else {
      const rec = await base44.entities.Follow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        follower_avatar: currentUser.avatar_url || '',
        following_email: targetEmail,
        following_name: targetName || '',
        following_avatar: targetAvatar || '',
      });
      setFollowing(true);
      setFollowRecord(rec);
      setCount(c => c + 1);
    }
    setLoading(false);
  };

  if (!currentUser || currentUser.email === targetEmail) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggle}
        disabled={loading}
        variant={following ? 'secondary' : 'default'}
        className={`gap-2 ${!following ? 'gradient-brand border-0' : ''}`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
          following ? <><UserCheck className="w-4 h-4" />Following</> : <><UserPlus className="w-4 h-4" />Follow</>}
      </Button>
      <span className="text-xs text-muted-foreground">{count} followers</span>
    </div>
  );
}