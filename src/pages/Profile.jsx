import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, UserPlus, MessageCircle, MoreHorizontal, MapPin, Briefcase, Heart, Loader2, Check, Clock } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';

export default function Profile() {
  const { email } = useParams();
  const { user: currentUser } = useOutletContext();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null); // null, 'pending', 'friends', 'incoming'
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.email === email;

  const loadProfile = useCallback(async () => {
    setLoading(true);

    // Load user
    const users = await base44.entities.User.filter({ email });
    if (users.length > 0) setProfileUser(users[0]);

    // Load posts
    const userPosts = await base44.entities.Post.filter({ author_email: email }, '-created_date');
    setPosts(userPosts);

    // Load friends
    const allFriendReqs = await base44.entities.FriendRequest.filter({ status: 'accepted' });
    const userFriends = allFriendReqs
      .filter(r => r.from_email === email || r.to_email === email)
      .map(r => ({
        email: r.from_email === email ? r.to_email : r.from_email,
        name: r.from_email === email ? r.to_name : r.from_name,
        avatar: r.from_email === email ? r.to_avatar : r.from_avatar,
      }));
    setFriends(Array.from(new Map(userFriends.map(f => [f.email, f])).values()));

    // Check friendship status
    if (!isOwnProfile && currentUser) {
      const pendingReqs = await base44.entities.FriendRequest.filter({ status: 'pending' });
      const sentReq = pendingReqs.find(r => r.from_email === currentUser.email && r.to_email === email);
      const incomingReq = pendingReqs.find(r => r.from_email === email && r.to_email === currentUser.email);
      const isFriend = allFriendReqs.find(
        r => (r.from_email === currentUser.email && r.to_email === email) ||
             (r.to_email === currentUser.email && r.from_email === email)
      );

      if (isFriend) setFriendStatus('friends');
      else if (sentReq) setFriendStatus('pending');
      else if (incomingReq) setFriendStatus('incoming');
      else setFriendStatus(null);
    }

    setLoading(false);
  }, [email, currentUser, isOwnProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAddFriend = async () => {
    await base44.entities.FriendRequest.create({
      from_email: currentUser.email,
      from_name: currentUser.full_name,
      from_avatar: currentUser.avatar || '',
      to_email: email,
      to_name: profileUser?.full_name || '',
      to_avatar: profileUser?.avatar || '',
      status: 'pending',
    });
    setFriendStatus('pending');
  };

  const initials = profileUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop"
          alt="Cover"
          className="w-full h-full object-cover"
        />
        {isOwnProfile && (
          <Button variant="secondary" size="sm" className="absolute bottom-4 right-4 gap-2 shadow-lg">
            <Camera className="w-4 h-4" /> Edit Cover Photo
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-8 sm:-mt-12 relative z-10">
          <Avatar className="h-32 w-32 sm:h-40 sm:w-40 ring-4 ring-card shadow-xl">
            <AvatarImage src={profileUser?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold">{profileUser?.full_name}</h1>
            <p className="text-muted-foreground text-sm">{friends.length} friends</p>
            <div className="flex -space-x-2 mt-2">
              {friends.slice(0, 8).map(f => {
                const fi = f.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <Avatar key={f.email} className="h-8 w-8 border-2 border-card">
                    <AvatarImage src={f.avatar} />
                    <AvatarFallback className="bg-secondary text-xs">{fi}</AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pb-4">
            {isOwnProfile ? (
              <Button variant="secondary" className="gap-2">
                <Camera className="w-4 h-4" /> Edit Profile
              </Button>
            ) : (
              <>
                {friendStatus === 'friends' ? (
                  <Button variant="secondary" className="gap-2">
                    <Check className="w-4 h-4" /> Friends
                  </Button>
                ) : friendStatus === 'pending' ? (
                  <Button variant="secondary" className="gap-2" disabled>
                    <Clock className="w-4 h-4" /> Request Sent
                  </Button>
                ) : (
                  <Button className="gap-2" onClick={handleAddFriend}>
                    <UserPlus className="w-4 h-4" /> Add Friend
                  </Button>
                )}
                <Button variant="secondary" className="gap-2">
                  <MessageCircle className="w-4 h-4" /> Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="bg-card border border-border w-full justify-start">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pb-8">
            <TabsContent value="posts" className="col-span-full md:col-span-3 md:col-start-2 space-y-4 mt-0">
              {posts.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No posts yet
                </Card>
              ) : (
                posts.map(post => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} />
                ))
              )}
            </TabsContent>

            <TabsContent value="about" className="col-span-full md:col-span-3 md:col-start-2 mt-0">
              <Card className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">About</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <span>Works at <span className="font-semibold">Company</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>Lives in <span className="font-semibold">City</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                    <span>Single</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="friends" className="col-span-full md:col-span-3 md:col-start-2 mt-0">
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Friends · {friends.length}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {friends.map(f => {
                    const fi = f.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                    return (
                      <div key={f.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={f.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">{fi}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">{f.name}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="col-span-full md:col-span-3 md:col-start-2 mt-0">
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-4">Photos</h2>
                <div className="grid grid-cols-3 gap-2">
                  {posts.filter(p => p.image_url).map(p => (
                    <img key={p.id} src={p.image_url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  ))}
                  {posts.filter(p => p.image_url).length === 0 && (
                    <p className="col-span-3 text-muted-foreground text-center py-8">No photos yet</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}