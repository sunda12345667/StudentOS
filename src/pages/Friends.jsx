import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserMinus } from 'lucide-react';
import FriendRequestCard from '@/components/friends/FriendRequestCard';

export default function Friends() {
  const { user } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    const [pendingReqs, acceptedReqs, users] = await Promise.all([
      base44.entities.FriendRequest.filter({ to_email: user.email, status: 'pending' }),
      base44.entities.FriendRequest.filter({ status: 'accepted' }),
      base44.entities.User.list(),
    ]);

    setRequests(pendingReqs);

    const friendList = acceptedReqs
      .filter(r => r.from_email === user.email || r.to_email === user.email)
      .map(r => ({
        email: r.from_email === user.email ? r.to_email : r.from_email,
        name: r.from_email === user.email ? r.to_name : r.from_name,
        avatar: r.from_email === user.email ? r.to_avatar : r.from_avatar,
        requestId: r.id,
      }));
    setFriends(Array.from(new Map(friendList.map(f => [f.email, f])).values()));

    // People you may know
    const friendEmails = new Set(friendList.map(f => f.email));
    friendEmails.add(user.email);
    setAllUsers(users.filter(u => !friendEmails.has(u.email)));

    setLoading(false);
  };

  const handleAccept = async (request) => {
    await base44.entities.FriendRequest.update(request.id, { status: 'accepted' });
    setRequests(prev => prev.filter(r => r.id !== request.id));
    loadData();
  };

  const handleDecline = async (request) => {
    await base44.entities.FriendRequest.update(request.id, { status: 'declined' });
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      <Tabs defaultValue="requests">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="requests">
            Requests {requests.length > 0 && `(${requests.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">All Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-0">
          {requests.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No pending friend requests
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {requests.map(req => (
                <FriendRequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          {friends.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No friends yet. Start connecting!
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map(friend => {
                const fi = friend.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <Card key={friend.email} className="p-4 flex items-center gap-3">
                    <Link to={`/profile/${friend.email}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">{fi}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${friend.email}`} className="font-semibold text-sm hover:underline truncate block">
                        {friend.name}
                      </Link>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <UserMinus className="w-5 h-5" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-0">
          {allUsers.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No suggestions right now
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allUsers.map(u => {
                const ui = u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <Card key={u.email} className="overflow-hidden shadow-sm">
                    <div className="aspect-square bg-secondary relative">
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={u.avatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-none text-4xl">{ui}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="p-3 space-y-2">
                      <Link to={`/profile/${u.email}`} className="font-semibold text-sm hover:underline block truncate">
                        {u.full_name}
                      </Link>
                      <Button className="w-full h-8 text-sm" onClick={async () => {
                        await base44.entities.FriendRequest.create({
                          from_email: user.email,
                          from_name: user.full_name,
                          from_avatar: user.avatar || '',
                          to_email: u.email,
                          to_name: u.full_name,
                          to_avatar: u.avatar || '',
                          status: 'pending',
                        });
                        setAllUsers(prev => prev.filter(p => p.email !== u.email));
                      }}>
                        Add Friend
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}