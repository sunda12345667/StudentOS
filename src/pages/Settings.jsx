import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/lib/ThemeContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  User, Lock, Bell, Eye, Palette, Wallet, HelpCircle, LogOut,
  ChevronRight, Moon, Sun, Monitor, Camera, Loader2, ArrowLeft, Shield, Trash2
} from 'lucide-react';
import RecycleBin from '@/components/settings/RecycleBin';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'profile',       icon: User,     label: 'Profile',       color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  { id: 'privacy',       icon: Eye,      label: 'Privacy',       color: 'text-green-500',  bg: 'bg-green-500/10' },
  { id: 'notifications', icon: Bell,     label: 'Notifications', color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  { id: 'security',      icon: Shield,   label: 'Security',      color: 'text-rose-500',   bg: 'bg-rose-500/10' },
  { id: 'appearance',    icon: Palette,  label: 'Appearance',    color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'recycle_bin',   icon: Trash2,   label: 'Recycle Bin',   color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

export default function Settings() {
  const { user } = useOutletContext();
  const { theme, toggleTheme } = useTheme();
  const [active, setActive] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(res => {
      const p = res[0] || {};
      setProfile(p);
      setForm(p);
    }).catch(() => {});
  }, [user?.email]);

  const save = async () => {
    setSaving(true);
    try {
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, form);
      } else {
        const created = await base44.entities.UserProfile.create({ ...form, user_email: user.email });
        setProfile(created);
      }
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save. Try again.');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updated = { ...form, avatar_url: file_url };
      setForm(updated);
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, { avatar_url: file_url });
      } else {
        const created = await base44.entities.UserProfile.create({ ...updated, user_email: user.email });
        setProfile(created);
      }
      await base44.auth.updateMe({ avatar: file_url });
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Upload failed. Try again.');
    }
    setUploading(false);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showList = !active || !isMobile;
  const showDetail = active;

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
      <div className="sm:flex sm:gap-6 min-h-[70vh]">

        {/* Left — section list */}
        <div className={cn(
          'sm:w-72 flex-shrink-0',
          active ? 'hidden sm:block' : 'block'
        )}>
          <div className="px-4 pt-4 pb-2 sm:px-0 sm:pt-0">
            <h1 className="text-xl font-black mb-4">Settings</h1>

            {/* Profile summary */}
            <Card className="p-4 mb-4 flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                  <AvatarImage src={form?.avatar_url} />
                  <AvatarFallback className="gradient-brand text-white font-bold">{initials}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center cursor-pointer shadow">
                  {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <Link to={`/profile/${user?.email}`} className="text-xs text-primary hover:underline">View profile →</Link>
              </div>
            </Card>

            {/* Nav list */}
            <Card className="overflow-hidden">
              {SECTIONS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => setActive(s.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors',
                      active === s.id && 'bg-primary/8'
                    )}
                  >
                    <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <span className="flex-1 text-sm font-medium">{s.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {i < SECTIONS.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </Card>

            {/* Logout */}
            <button
              onClick={() => base44.auth.logout()}
              className="w-full flex items-center gap-3 px-4 py-3.5 mt-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>

        {/* Right — section detail */}
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
            className="flex-1 px-4 sm:px-0"
          >
            {/* Back (mobile) */}
            <button onClick={() => setActive(null)} className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground mb-4 pt-4">
              <ArrowLeft className="w-4 h-4" /> Back to Settings
            </button>

            {active === 'profile' && (
              <Card className="p-5 space-y-4">
                <h2 className="font-bold text-base">Profile Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label className="text-xs mb-1.5">Bio</Label>
                    <textarea value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      rows={3} className="w-full bg-muted rounded-xl p-3 text-sm resize-none border-0 outline-none focus:ring-2 focus:ring-primary" placeholder="Tell others about yourself..." />
                  </div>
                  <div className="space-y-3">
                    <div><Label className="text-xs mb-1.5">Username</Label>
                      <Input value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="@username" className="bg-muted border-0" />
                    </div>
                    <div><Label className="text-xs mb-1.5">Location</Label>
                      <Input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" className="bg-muted border-0" />
                    </div>
                  </div>
                  <div><Label className="text-xs mb-1.5">School</Label>
                    <Input value={form.school_name || ''} onChange={e => setForm(p => ({ ...p, school_name: e.target.value }))} placeholder="School name" className="bg-muted border-0" />
                  </div>
                  <div><Label className="text-xs mb-1.5">Department</Label>
                    <Input value={form.department || ''} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Computer Science" className="bg-muted border-0" />
                  </div>
                  <div><Label className="text-xs mb-1.5">Level / Class</Label>
                    <Input value={form.grade_level || ''} onChange={e => setForm(p => ({ ...p, grade_level: e.target.value }))} placeholder="e.g. 300L, Year 3" className="bg-muted border-0" />
                  </div>
                  <div><Label className="text-xs mb-1.5">Website / Portfolio</Label>
                    <Input value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className="bg-muted border-0" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1.5">Interests (comma separated)</Label>
                  <Input
                    value={form.interests?.join(', ') || ''}
                    onChange={e => setForm(p => ({ ...p, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="e.g. Math, Coding, Music"
                    className="bg-muted border-0"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">Skills (comma separated)</Label>
                  <Input
                    value={form.skills?.join(', ') || ''}
                    onChange={e => setForm(p => ({ ...p, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="e.g. Python, Design, Writing"
                    className="bg-muted border-0"
                  />
                </div>
                <Button onClick={save} disabled={saving} className="gradient-brand border-0 w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Profile
                </Button>
              </Card>
            )}

            {active === 'privacy' && (
              <Card className="p-5 space-y-5">
                <h2 className="font-bold text-base">Privacy Settings</h2>
                {[
                  { key: 'privacy_public', label: 'Public Profile', desc: 'Anyone can view your profile' },
                  { key: 'show_email', label: 'Show Email', desc: 'Display your email on your public profile' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={!!form[item.key]}
                      onCheckedChange={v => setForm(p => ({ ...p, [item.key]: v }))}
                    />
                  </div>
                ))}
                <Button onClick={save} disabled={saving} className="gradient-brand border-0 w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Privacy
                </Button>
              </Card>
            )}

            {active === 'notifications' && (
              <Card className="p-5 space-y-5">
                <h2 className="font-bold text-base">Notification Settings</h2>
                <p className="text-sm text-muted-foreground">Notification preferences are managed per-device. You'll always receive important account alerts.</p>
                {[
                  { label: 'Likes on my posts', desc: 'When someone likes your post' },
                  { label: 'Comments', desc: 'When someone comments on your post' },
                  { label: 'New followers', desc: 'When someone follows you' },
                  { label: 'Direct messages', desc: 'When you receive a new message' },
                  { label: 'Marketplace orders', desc: 'When someone purchases your item' },
                  { label: 'Group updates', desc: 'Activity in your groups' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </Card>
            )}

            {active === 'security' && (
              <Card className="p-5 space-y-5">
                <h2 className="font-bold text-base">Security</h2>
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-medium">Signed in as</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Password</p>
                  <p className="text-xs text-muted-foreground mb-3">Use a strong password with at least 8 characters.</p>
                  <Button variant="outline" size="sm" className="rounded-xl">Change Password</Button>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Danger Zone</p>
                  <p className="text-xs text-muted-foreground mb-3">These actions are irreversible.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => base44.auth.logout()}
                  >
                    Log out from all devices
                  </Button>
                </div>
              </Card>
            )}

            {active === 'recycle_bin' && (
              <Card className="p-5">
                <h2 className="font-bold text-base mb-4">Recycle Bin</h2>
                <RecycleBin userEmail={user?.email} />
              </Card>
            )}

            {active === 'appearance' && (
              <Card className="p-5 space-y-5">
                <h2 className="font-bold text-base">Appearance</h2>
                <div>
                  <p className="text-sm font-medium mb-3">Theme</p>
                  <div className="flex gap-3">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' },
                      { id: 'dark', icon: Moon, label: 'Dark' },
                      { id: 'system', icon: Monitor, label: 'System' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { if (opt.id !== theme) toggleTheme(); }}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                          theme === opt.id ? 'border-primary bg-primary/8' : 'border-border hover:border-muted-foreground/30'
                        )}
                      >
                        <opt.icon className={cn('w-5 h-5', theme === opt.id ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('text-xs font-medium', theme === opt.id ? 'text-primary' : 'text-muted-foreground')}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Desktop placeholder when nothing selected */}
        {!active && (
          <div className="hidden sm:flex flex-1 items-center justify-center text-muted-foreground flex-col gap-3">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
              <User className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm">Select a section to configure</p>
          </div>
        )}
      </div>
    </div>
  );
}