import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import StoryBar from '@/components/feed/StoryBar';
import LeftSidebar from '@/components/feed/LeftSidebar';
import RightSidebar from '@/components/feed/RightSidebar';

export default function Feed() {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    const data = await base44.entities.Post.list('-created_date', 50);
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 flex gap-0">
      <LeftSidebar user={user} />

      <div className="flex-1 max-w-xl mx-auto py-4 space-y-4">
        <StoryBar user={user} />
        <CreatePost user={user} onPostCreated={loadPosts} />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No posts yet</p>
            <p className="text-muted-foreground text-sm mt-1">Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      <RightSidebar user={user} />
    </div>
  );
}