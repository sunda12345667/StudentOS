import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, ArrowLeft, Settings, UserPlus, Lock, Loader2, MessageCircle, BarChart3, FolderOpen, Calendar, ClipboardCheck, CalendarDays, Megaphone } from 'lucide-react';
import GroupChat from '@/components/campus/GroupChat';
import GroupPolls from '@/components/campus/GroupPolls';
import GroupFiles from '@/components/campus/GroupFiles';
import GroupEvents from '@/components/campus/GroupEvents';
import GroupAttendance from '@/components/campus/GroupAttendance';
import GroupTimetable from '@/components/campus/GroupTimetable';
import CreatePostBox from '@/components/shared/CreatePostBox';
import PostCard from '@/components/shared/PostCard';

const GROUP_TYPES = {
  department: { label: 'Department', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
  class: { label: 'Class Group', icon: '📚', color: 'from-green-500 to-emerald-600' },
  faculty: { label: 'Faculty', icon: '🎓', color: 'from-purple-500 to-violet-600' },
  club: { label: 'Club / Society', icon: '🎭', color: 'from-pink-500 to-rose-600' },
  study: { label: 'Study Group', icon: '📖', color: 'from-amber-500 to-orange-600' },
  campus: { label: 'Campus Community', icon: '🏫', color: 'from-cyan-500 to-blue-600' },
  general: { label: 'General', icon: '💬', color: 'from-gray-500 to-slate-600' },
};

export default function CampusGroupDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);

  const load = useCallback(async () => {
    const [groups, ps] = await Promise.all([
      base44.entities.CampusGroup.filter({ id }),
      base44.entities.Post.filter({ community_id: id }, '-created_date', 30).catch(() => []),
    ]);
    if (groups.length) setGroup(groups[0]);
    setPosts(ps);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const loadMembers = async (memberEmails) => {
    const all = await base44.entities.User.list().catch(() => []);
    const profiles = await base44.entities.UserProfile.list().catch(() => []);
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user_email] = p; });
    const members = (memberEmails || []).map(email => {
      const u = all.find(u => u.email === email);
      const p = profileMap[email];
      return { email, name: u?.full_name || email.split('@')[0], avatar: p?.avatar_url || u?.avatar, role: p?.role || 'student' };
    });
    setMemberProfiles(members);
    setMembersOpen(true);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!group) return <div className="text-center py-20 text-muted-foreground">Group not found</div>;

  const isMember = group.member_emails?.includes(user?.email);
  const isAdmin = group.admin_email === user?.email;
  const typeInfo = GROUP_TYPES[group.type] || GROUP_TYPES.general;
  const coverColor = group.cover_color || typeInfo.color;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back */}
      <Link to="/campus" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Groups
      </Link>

      {/* Hero Banner */}
      <Card className={`bg-gradient-to-br ${coverColor} text-white p-6 mb-6 overflow-hidden relative`}>
        <div className="absolute -right-6 -top-6 text-9xl opacity-20">{group.icon || typeInfo.icon}</div>
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-0">{typeInfo.icon} {typeInfo.label}</Badge>
                {group.is_private && <Badge className="bg-white/20 text-white border-0 gap-1"><Lock className="w-3 h-3" />Private</Badge>}
                {isAdmin && <Badge className="bg-white/30 text-white border-0">You're Admin</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">{group.name}</h1>
              {group.description && <p className="text-white/80 text-sm max-w-xl">{group.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <button onClick={() => loadMembers(group.member_emails)} className="flex items-center gap-1.5 text-sm hover:text-white/70 transition-colors">
              <Users className="w-4 h-4" />{group.member_count || 0} Members
            </button>
            <div className="flex -space-x-2">
              {(group.member_emails || []).slice(0, 5).map(email => (
                <Avatar key={email} className="h-7 w-7 ring-2 ring-white/40">
                  <AvatarFallback className="bg-white/30 text-white text-xs">{email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {(group.member_emails?.length || 0) > 5 && (
                <div className="h-7 w-7 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-[10px] text-white font-bold">
                  +{(group.member_emails?.length || 0) - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="announcements">
        <div className="overflow-x-auto mb-6">
          <TabsList className="flex w-max min-w-full gap-1 h-auto bg-muted/50 p-1">
            {[
              { value: 'announcements', icon: Megaphone, label: 'Announcements' },
              { value: 'chat', icon: MessageCircle, label: 'Chat' },
              { value: 'polls', icon: BarChart3, label: 'Polls' },
              { value: 'files', icon: FolderOpen, label: 'Files' },
              { value: 'events', icon: Calendar, label: 'Events' },
              { value: 'timetable', icon: CalendarDays, label: 'Timetable' },
              { value: 'attendance', icon: ClipboardCheck, label: 'Attendance' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Icon className="w-3.5 h-3.5" />{label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Announcements / Posts */}
        <TabsContent value="announcements">
          <div className="max-w-2xl space-y-4">
            {isMember && <CreatePostBox user={user} onPosted={load} extraData={{ community_id: id }} />}
            {posts.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No announcements yet</p>
              </Card>
            ) : posts.map(p => (
              <PostCard key={p.id} post={p} currentUser={user} onDelete={pid => setPosts(prev => prev.filter(x => x.id !== pid))} />
            ))}
          </div>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat">
          <Card className="p-4">
            {isMember ? (
              <GroupChat groupId={id} user={user} isAdmin={isAdmin} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">Join the group to access chat</div>
            )}
          </Card>
        </TabsContent>

        {/* Polls */}
        <TabsContent value="polls">
          <Card className="p-4">
            <GroupPolls groupId={id} user={user} isAdmin={isAdmin} />
          </Card>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files">
          <Card className="p-4">
            <GroupFiles groupId={id} user={user} isAdmin={isAdmin} />
          </Card>
        </TabsContent>

        {/* Events */}
        <TabsContent value="events">
          <Card className="p-4">
            <GroupEvents groupId={id} user={user} isAdmin={isAdmin} />
          </Card>
        </TabsContent>

        {/* Timetable */}
        <TabsContent value="timetable">
          <Card className="p-4">
            <GroupTimetable group={group} user={user} isAdmin={isAdmin} onUpdate={load} />
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          <Card className="p-4">
            {isAdmin ? (
              <GroupAttendance groupId={id} user={user} isAdmin={isAdmin} members={group.member_emails} />
            ) : (
              <GroupAttendance groupId={id} user={user} isAdmin={false} members={[]} />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Members Modal */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Members ({group.member_count || 0})</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto mt-2">
            {memberProfiles.map(m => (
              <Link key={m.email} to={`/profile/${m.email}`} onClick={() => setMembersOpen(false)}>
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="gradient-brand text-white text-sm">{m.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role} {m.email === group.admin_email ? '· Admin' : ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}