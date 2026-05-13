import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function StoryBar({ user }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Story.list('-created_date', 20)
      .then(setStories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const userInitials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  // Group stories by author
  const storyGroups = stories.reduce((acc, story) => {
    if (!acc[story.author_email]) {
      acc[story.author_email] = {
        author_name: story.author_name,
        author_avatar: story.author_avatar,
        stories: [],
      };
    }
    acc[story.author_email].stories.push(story);
    return acc;
  }, {});

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {/* Create Story */}
        <Card className="flex-shrink-0 w-28 h-48 relative overflow-hidden cursor-pointer group">
          <div className="h-3/4 bg-secondary">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={user?.avatar} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary rounded-none text-2xl">{userInitials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="h-1/4 flex flex-col items-center justify-center relative">
            <div className="absolute -top-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-4 border-card">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold mt-2">Create Story</span>
          </div>
        </Card>

        {/* Stories */}
        {loading ? (
          <div className="flex items-center px-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          Object.entries(storyGroups).map(([email, group]) => {
            const si = group.author_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            const latestStory = group.stories[0];
            return (
              <Card
                key={email}
                className="flex-shrink-0 w-28 h-48 relative overflow-hidden cursor-pointer group"
              >
                {latestStory.image_url ? (
                  <img
                    src={latestStory.image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: latestStory.background_color || '#3b82f6' }}
                  >
                    <p className="text-white text-xs font-medium text-center px-2">{latestStory.text_overlay}</p>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Avatar className="h-8 w-8 ring-2 ring-primary">
                    <AvatarImage src={group.author_avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{si}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-semibold drop-shadow-lg truncate">{group.author_name}</p>
                </div>
              </Card>
            );
          })
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}