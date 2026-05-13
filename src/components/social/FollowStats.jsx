import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

export default function FollowStats({ email }) {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [dialog, setDialog] = useState(null); // 'followers' | 'following'

  useEffect(() => {
    if (!email) return;
    Promise.all([
      base44.entities.Follow.filter({ following_email: email }),
      base44.entities.Follow.filter({ follower_email: email }),
    ]).then(([frs, fng]) => {
      setFollowers(frs);
      setFollowing(fng);
    }).catch(() => {});
  }, [email]);

  const list = dialog === 'followers' ? followers : following;

  return (
    <>
      <div className="flex gap-4 text-sm">
        <button onClick={() => setDialog('followers')} className="hover:underline">
          <span className="font-bold">{followers.length}</span>
          <span className="text-muted-foreground ml-1">Followers</span>
        </button>
        <button onClick={() => setDialog('following')} className="hover:underline">
          <span className="font-bold">{following.length}</span>
          <span className="text-muted-foreground ml-1">Following</span>
        </button>
      </div>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto mt-2">
            {list.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                {dialog === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            ) : (
              list.map(f => {
                const email = dialog === 'followers' ? f.follower_email : f.following_email;
                const name = dialog === 'followers' ? f.follower_name : f.following_name;
                const avatar = dialog === 'followers' ? f.follower_avatar : f.following_avatar;
                const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <Link key={f.id} to={`/profile/${email}`} onClick={() => setDialog(null)}>
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="gradient-brand text-white font-bold text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{email}</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}