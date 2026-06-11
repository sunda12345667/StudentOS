import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Bookmark, Loader2 } from 'lucide-react';
import PostCard from '@/components/shared/PostCard';
import { motion } from 'framer-motion';

export default function SavedPosts() {
  const { user } = useOutletContext();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      const saves = await base44.entities.SavedPost.filter({ user_email: user.email }, '-created_date', 50);
      if (!saves.length) { setLoading(false); return; }
      // Fetch actual posts
      const postIds = saves.map(s => s.post_id);
      const allPosts = await base44.entities.Post.list('-created_date', 200);
      const matched = allPosts.filter(p => postIds.includes(p.id));
      setSavedPosts(matched);
      setLoading(false);
    };
    load();
  }, [user?.email]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Saved Posts</h1>
          <p className="text-sm text-muted-foreground">{savedPosts.length} saved</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : savedPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold">No saved posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Tap the bookmark icon on any post to save it here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <PostCard
                post={post}
                currentUser={user}
                onDelete={id => setSavedPosts(p => p.filter(x => x.id !== id))}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}