import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Pencil, BookOpen, Trophy, Flame, Star, Loader2, MapPin, Link as LinkIcon, Zap } from 'lucide-react';
import PostCard from '@/components/shared/PostCard';

export default function Profile() {
  const { email } = useParams();
  const { user: currentUser } = useOutletContext();
  const [profileUser, setProfileUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isOwn = currentUser?.email === email;

  const load = useCallback(async () => {
    setLoading(true);
    const [users, profs, ps, cs] = await Promise.all([
      base44.entities.User.filter({ email }),
      base44.entities.UserProfile.filter({ user_email: email }),
      base44.entities.Post.filter({ author_email: email }, '-created_date', 20),
      base44.entities.Course.filter({ teacher_email: email }),
    ]);
    if (users.length) setProfileUser(users[0]);
    if (profs.length) { setProfile(profs[0]); setEditForm(profs[0]); }
    setPosts(ps);
    setCourses(cs);
    setLoading(false);
  }, [email]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, editForm);
    } else {
      await base44.entities.UserProfile.create({ ...editForm, user_email: email });
    }
    await load();
    setEditOpen(false);
    setSaving(false);
  };

  const xp = profile?.xp_points || 0;
  const initials = profileUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const ROLE_COLORS = { student: 'bg-blue-100 text-blue-700', teacher: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700' };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Cover */}
      <div className="h-48 sm:h-64 relative overflow-hidden">
        {profile?.cover_url ? (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-brand opacity-70" />
        )}
        {isOwn && (
          <Button variant="secondary" size="sm" className="absolute bottom-4 right-4 gap-2 shadow">
            <Camera className="w-4 h-4" />Edit Cover
          </Button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 relative z-10 pb-4">
          <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-card shadow-xl">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="gradient-brand text-white text-4xl font-black">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black">{profileUser?.full_name}</h1>
              {profile?.role && <Badge className={`${ROLE_COLORS[profile.role] || ''} border-0`}>{profile.role}</Badge>}
            </div>
            {profile?.school_name && <p className="text-muted-foreground text-sm mt-0.5">{profile.school_name}</p>}
            {profile?.bio && <p className="text-sm mt-1 max-w-lg">{profile.bio}</p>}
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {profile?.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location}</span>}
              {profile?.website && <a href={profile.website} className="flex items-center gap-1 text-primary hover:underline"><LinkIcon className="w-4 h-4" />{profile.website}</a>}
            </div>
          </div>
          {isOwn && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-brand border-0 gap-2"><Pencil className="w-4 h-4" />Edit Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
                  <div><Label>Bio</Label><Textarea value={editForm.bio || ''} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3} /></div>
                  <div><Label>School</Label><Input value={editForm.school_name || ''} onChange={e => setEditForm(p => ({ ...p, school_name: e.target.value }))} /></div>
                  <div><Label>Location</Label><Input value={editForm.location || ''} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} /></div>
                  <div><Label>Website</Label><Input value={editForm.website || ''} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} /></div>
                  <div><Label>Grade Level</Label><Input value={editForm.grade_level || ''} onChange={e => setEditForm(p => ({ ...p, grade_level: e.target.value }))} /></div>
                  <Button onClick={saveProfile} disabled={saving} className="w-full gradient-brand border-0">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* XP & Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Star, label: 'XP Points', value: xp, color: 'text-amber-500', bg: 'bg-amber-50' },
            { icon: Flame, label: 'Day Streak', value: profile?.streak_days || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
            { icon: BookOpen, label: 'Courses', value: profile?.courses_enrolled || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Trophy, label: 'Assignments', value: profile?.assignments_done || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map(stat => (
            <Card key={stat.label} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-black">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* XP Progress */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Learning Progress</span>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{xp} XP</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="gradient-brand h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{500 - (xp % 500)} XP to next level</p>
        </Card>

        <Tabs defaultValue="posts">
          <TabsList className="mb-6">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <div className="max-w-xl space-y-4 pb-8">
              {posts.length === 0 ? (
                <Card className="p-10 text-center text-muted-foreground">No posts yet</Card>
              ) : (
                posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))} />)
              )}
            </div>
          </TabsContent>
          <TabsContent value="courses">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
              {courses.map(c => (
                <Card key={c.id} className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color || 'from-blue-500 to-indigo-600'} flex items-center justify-center`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.student_count || 0} students</p>
                  </div>
                </Card>
              ))}
              {courses.length === 0 && <Card className="col-span-2 p-10 text-center text-muted-foreground">No courses yet</Card>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}