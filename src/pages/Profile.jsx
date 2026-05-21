import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Camera, Pencil, BookOpen, Trophy, Flame, Star, Loader2,
  MapPin, Link as LinkIcon, Zap, MessageCircle, Settings, GraduationCap,
  Heart, Users, Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PostCard from '@/components/shared/PostCard';
import FollowButton from '@/components/social/FollowButton';
import FollowStats from '@/components/social/FollowStats';

const ROLE_COLORS = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  teacher: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function Profile() {
  const { email } = useParams();
  const { user: currentUser } = useOutletContext();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const loadedRef = useRef(false);

  const isOwn = currentUser?.email === email;

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    loadedRef.current = false;
    try {
      // Fetch profile and posts in parallel
      const [profs, ps] = await Promise.all([
        base44.entities.UserProfile.filter({ user_email: email }),
        base44.entities.Post.filter({ author_email: email }, '-created_date', 20),
      ]);

      if (profs.length) {
        setProfile(profs[0]);
        setEditForm(profs[0]);
        // Build profileUser from profile data
        setProfileUser({ full_name: profs[0].username || email.split('@')[0], email });
      } else {
        setProfile(null);
        setEditForm({ user_email: email });
        // If own profile and no profile record exists, use currentUser data
        if (isOwn && currentUser) {
          setProfileUser({ full_name: currentUser.full_name, email: currentUser.email });
        } else {
          setProfileUser({ full_name: email.split('@')[0], email });
        }
      }

      setPosts(ps);
    } catch (err) {
      setError('Could not load profile. Please try again.');
    }
    setLoading(false);
    loadedRef.current = true;
  }, [email, isOwn, currentUser?.email]);

  // Override profileUser name with currentUser full_name if viewing own profile
  useEffect(() => {
    if (isOwn && currentUser?.full_name) {
      setProfileUser(p => p ? { ...p, full_name: currentUser.full_name } : { full_name: currentUser.full_name, email: currentUser.email });
    }
  }, [isOwn, currentUser?.full_name]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, editForm);
      } else {
        const created = await base44.entities.UserProfile.create({ ...editForm, user_email: email });
        setProfile(created);
      }
      await load();
      setEditOpen(false);
      toast.success('Profile updated!');
    } catch { toast.error('Save failed.'); }
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newData = { ...editForm, avatar_url: file_url };
      setEditForm(newData);
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, { avatar_url: file_url });
        setProfile(p => ({ ...p, avatar_url: file_url }));
      } else {
        const created = await base44.entities.UserProfile.create({ ...newData, user_email: email });
        setProfile(created);
      }
      await base44.auth.updateMe({ avatar: file_url });
      toast.success('Profile picture updated!');
    } catch { toast.error('Upload failed.'); }
    setUploading(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Cover must be under 10MB'); return; }
    setCoverUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, { cover_url: file_url });
        setProfile(p => ({ ...p, cover_url: file_url }));
      } else {
        const created = await base44.entities.UserProfile.create({ user_email: email, cover_url: file_url });
        setProfile(created);
      }
      toast.success('Cover photo updated!');
    } catch { toast.error('Upload failed.'); }
    setCoverUploading(false);
  };

  const xp = profile?.xp_points || 0;
  const displayName = isOwn ? (currentUser?.full_name || profileUser?.full_name) : profileUser?.full_name;
  const initials = displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  const handleMessageClick = async () => {
    if (!currentUser || !email) return;
    // Find or create a conversation with this user
    const convs = await base44.entities.Conversation.list('-updated_date', 100);
    const existing = convs.find(c => c.participants?.includes(currentUser.email) && c.participants?.includes(email));
    if (existing) {
      navigate('/messages', { state: { conversationId: existing.id } });
      return;
    }
    const conv = await base44.entities.Conversation.create({
      participants: [currentUser.email, email],
      participant_names: [currentUser.full_name, profileUser?.full_name || email],
      participant_avatars: [currentUser.avatar_url || '', profile?.avatar_url || ''],
      last_message: '', last_message_time: new Date().toISOString(), last_sender: currentUser.email,
    });
    navigate('/messages', { state: { conversationId: conv.id } });
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center py-24">
      <div className="text-center">
        <p className="text-muted-foreground mb-3">{error}</p>
        <button onClick={load} className="text-primary text-sm hover:underline">Try again</button>
      </div>
    </div>
  );

  return (
    <div className="pb-6">
      {/* ── Cover ── */}
      <div className="h-44 sm:h-56 relative overflow-hidden">
        {profile?.cover_url ? (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-brand opacity-80" />
        )}
        {/* Cover overlay gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
        {isOwn && (
          <label className="absolute bottom-3 right-3 cursor-pointer">
            <div className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur transition-colors">
              {coverUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {coverUploading ? 'Uploading...' : 'Edit Cover'}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
          </label>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* ── Avatar + Name row ── */}
        <div className="flex items-end justify-between -mt-14 mb-4 relative z-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-card shadow-xl">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="gradient-brand text-white text-3xl font-black">{initials}</AvatarFallback>
            </Avatar>
            {isOwn && (
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-brand border-2 border-card flex items-center justify-center cursor-pointer shadow-lg">
                {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1">
            {isOwn ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 h-9"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" asChild>
                  <Link to="/settings"><Settings className="w-4 h-4" /></Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton currentUser={currentUser} targetEmail={email} targetName={profileUser?.full_name} targetAvatar={profile?.avatar_url} />
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={handleMessageClick}>
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="text-xl sm:text-2xl font-black">{displayName || 'Student'}</h1>
            {profile?.role && (
              <Badge className={`text-[10px] px-2 py-0 border-0 ${ROLE_COLORS[profile.role] || ''}`}>
                {profile.role}
              </Badge>
            )}
          </div>
          {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          {profile?.school_name && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5" />
              {profile.school_name}
              {profile?.department && ` · ${profile.department}`}
              {profile?.grade_level && ` · ${profile.grade_level}`}
            </p>
          )}
          {profile?.bio && <p className="text-sm mt-2 leading-relaxed">{profile.bio}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            {profile?.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
            )}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <LinkIcon className="w-3.5 h-3.5" />{profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          {/* Interests / skills */}
          {profile?.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.interests.map(i => (
                <Badge key={i} variant="secondary" className="text-xs rounded-full px-2.5">{i}</Badge>
              ))}
            </div>
          )}
          <div className="mt-3">
            <FollowStats email={email} />
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { icon: Star, label: 'XP', value: xp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { icon: Flame, label: 'Streak', value: `${profile?.streak_days || 0}d`, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { icon: BookOpen, label: 'Courses', value: profile?.courses_enrolled || 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { icon: Trophy, label: 'Tasks', value: profile?.assignments_done || 0, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          ].map(stat => (
            <Card key={stat.label} className="p-3 flex flex-col items-center gap-1 text-center">
              <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-sm font-black leading-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* XP bar */}
        <Card className="p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Learning Progress</span>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{xp} XP</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <motion.div
              className="gradient-brand h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{500 - (xp % 500)} XP to next level</p>
        </Card>

        {/* ── Tabs ── */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full mb-4 h-10 bg-muted rounded-xl p-1">
            <TabsTrigger value="posts" className="flex-1 rounded-lg text-xs data-[state=active]:shadow-sm">
              <Heart className="w-3.5 h-3.5 mr-1" />Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1 rounded-lg text-xs data-[state=active]:shadow-sm">
              <Users className="w-3.5 h-3.5 mr-1" />About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="space-y-3 pb-8">
              {posts.length === 0 ? (
                <Card className="p-12 text-center">
                  <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No posts yet</p>
                </Card>
              ) : (
                posts.map(p => (
                  <PostCard key={p.id} post={p} currentUser={currentUser}
                    onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <Card className="p-5 space-y-4 pb-8">
              {profile?.bio && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">About</p>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
              {[
                { label: 'School', value: profile?.school_name },
                { label: 'Department', value: profile?.department },
                { label: 'Level', value: profile?.grade_level },
                { label: 'Location', value: profile?.location },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex items-start gap-3">
                  <p className="text-xs text-muted-foreground w-24 flex-shrink-0 pt-0.5">{row.label}</p>
                  <p className="text-sm font-medium">{row.value}</p>
                </div>
              ))}
              {profile?.skills?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map(s => (
                      <Badge key={s} className="bg-primary/10 text-primary border-0 text-xs rounded-full">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile?.interests?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map(i => (
                      <Badge key={i} variant="secondary" className="text-xs rounded-full">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {!profile && isOwn && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Your profile is empty. Add your details!</p>
                  <Button size="sm" onClick={() => setEditOpen(true)} className="gradient-brand border-0 rounded-xl gap-2">
                    <Pencil className="w-3.5 h-3.5" />Complete Profile
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            {/* Avatar upload in dialog */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarImage src={editForm?.avatar_url} />
                  <AvatarFallback className="gradient-brand text-white font-bold text-xl">{initials}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gradient-brand border-2 border-card flex items-center justify-center cursor-pointer">
                  {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1">Username</Label>
                <Input value={editForm.username || ''} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} placeholder="@username" className="bg-muted border-0 rounded-xl" />
              </div>
              <div><Label className="text-xs mb-1">School</Label>
                <Input value={editForm.school_name || ''} onChange={e => setEditForm(p => ({ ...p, school_name: e.target.value }))} placeholder="School name" className="bg-muted border-0 rounded-xl" />
              </div>
              <div><Label className="text-xs mb-1">Department</Label>
                <Input value={editForm.department || ''} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Computer Science" className="bg-muted border-0 rounded-xl" />
              </div>
              <div><Label className="text-xs mb-1">Level / Class</Label>
                <Input value={editForm.grade_level || ''} onChange={e => setEditForm(p => ({ ...p, grade_level: e.target.value }))} placeholder="e.g. 300L" className="bg-muted border-0 rounded-xl" />
              </div>
              <div><Label className="text-xs mb-1">Location</Label>
                <Input value={editForm.location || ''} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" className="bg-muted border-0 rounded-xl" />
              </div>
              <div><Label className="text-xs mb-1">Website</Label>
                <Input value={editForm.website || ''} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className="bg-muted border-0 rounded-xl" />
              </div>
            </div>

            <div><Label className="text-xs mb-1">Bio</Label>
              <textarea value={editForm.bio || ''} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                rows={3} className="w-full bg-muted rounded-xl p-3 text-sm resize-none border-0 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tell others about yourself..." />
            </div>

            <div><Label className="text-xs mb-1">Interests (comma separated)</Label>
              <Input value={editForm.interests?.join(', ') || ''}
                onChange={e => setEditForm(p => ({ ...p, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="e.g. Math, Coding, Music" className="bg-muted border-0 rounded-xl" />
            </div>

            <div><Label className="text-xs mb-1">Skills (comma separated)</Label>
              <Input value={editForm.skills?.join(', ') || ''}
                onChange={e => setEditForm(p => ({ ...p, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                placeholder="e.g. Python, Design, Writing" className="bg-muted border-0 rounded-xl" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={saveProfile} disabled={saving} className="flex-1 gradient-brand border-0 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}