import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Search, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function RightSidebar({ user }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (user?.email) {
      base44.entities.FriendRequest.filter({ status: 'accepted' })
        .then(reqs => {
          const friendList = reqs
            .filter(r => r.from_email === user.email || r.to_email === user.email)
            .map(r => ({
              email: r.from_email === user.email ? r.to_email : r.from_email,
              name: r.from_email === user.email ? r.to_name : r.from_name,
              avatar: r.from_email === user.email ? r.to_avatar : r.from_avatar,
            }));
          // Deduplicate
          const unique = Array.from(new Map(friendList.map(f => [f.email, f])).values());
          setFriends(unique);
        })
        .catch(() => {});
    }
  }, [user?.email]);

  return (
    <div className="hidden xl:block w-72 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4 pl-4">
      {/* Birthdays */}
      <div className="mb-4">
        <h3 className="font-semibold text-muted-foreground text-sm px-2 mb-2">Birthdays</h3>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
          <Gift className="w-9 h-9 text-primary bg-primary/10 rounded-full p-2" />
          <p className="text-sm"><span className="font-semibold">John Doe</span> and <span className="font-semibold">2 others</span> have birthdays today</p>
        </div>
      </div>

      <Separator className="my-3" />

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="font-semibold text-muted-foreground text-sm">Contacts</h3>
          <Search className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
        <div className="space-y-0.5">
          {friends.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-3">Add friends to see them here</p>
          ) : (
            friends.map(friend => {
              const fi = friend.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
              return (
                <Link
                  key={friend.email}
                  to={`/profile/${friend.email}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{fi}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <span className="text-sm font-medium">{friend.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}