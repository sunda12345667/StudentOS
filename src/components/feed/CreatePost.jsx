import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image, Smile, MapPin, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imageFile) return;
    setIsPosting(true);

    let image_url = '';
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = file_url;
    }

    await base44.entities.Post.create({
      content: content.trim(),
      image_url,
      author_name: user.full_name,
      author_email: user.email,
      author_avatar: user.avatar || '',
      likes: [],
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      privacy: 'public',
    });

    setContent('');
    setImageFile(null);
    setImagePreview('');
    setExpanded(false);
    setIsPosting(false);
    onPostCreated?.();
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div
            onClick={() => setExpanded(true)}
            className={`w-full ${expanded ? '' : 'cursor-pointer'}`}
          >
            {expanded ? (
              <Textarea
                placeholder={`What's on your mind, ${user?.full_name?.split(' ')[0]}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] border-0 resize-none focus-visible:ring-0 text-base p-0"
                autoFocus
              />
            ) : (
              <div className="bg-secondary rounded-full px-4 py-2.5 text-muted-foreground text-sm hover:bg-accent transition-colors">
                What's on your mind, {user?.full_name?.split(' ')[0]}?
              </div>
            )}
          </div>

          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mt-3"
              >
                <img src={imagePreview} alt="Preview" className="rounded-lg max-h-64 object-cover w-full" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-foreground/60 hover:bg-foreground/80"
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                >
                  <X className="w-4 h-4 text-background" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mt-3 pt-3 border-t border-border"
            >
              <div className="flex gap-1">
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  <Button variant="ghost" size="sm" className="gap-2 text-green-600" asChild>
                    <span><Image className="w-5 h-5" /> Photo</span>
                  </Button>
                </label>
                <Button variant="ghost" size="sm" className="gap-2 text-amber-500">
                  <Smile className="w-5 h-5" /> Feeling
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 text-red-500 hidden sm:flex">
                  <MapPin className="w-5 h-5" /> Location
                </Button>
              </div>
              <Button
                onClick={handlePost}
                disabled={isPosting || (!content.trim() && !imageFile)}
                className="rounded-full px-6"
              >
                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
}