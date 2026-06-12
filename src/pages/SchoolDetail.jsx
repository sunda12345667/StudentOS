import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Users, Globe, MapPin, CheckCircle, School, Loader2, UserCircle2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const TYPE_LABELS = { k12: 'K-12', university: 'University', vocational: 'Vocational', online: 'Online', tutoring: 'Tutoring' };
const TYPE_COLORS = { k12: 'bg-blue-100 text-blue-700', university: 'bg-purple-100 text-purple-700', vocational: 'bg-amber-100 text-amber-700', online: 'bg-green-100 text-green-700', tutoring: 'bg-rose-100 text-rose-700' };

export default function SchoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [joining, setJoining] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    if (!id) { setError('School not found.'); setLoading(false); return; }
    base44.entities.School.filter({ id })
      .then(results => {
        if (!results || results.length === 0) { setError('School not found.'); }
        else { setSchool(results[0]); }
      })
      .catch(() => setError('Failed to load school.'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadMembers = async (memberEmails) => {
    if (!memberEmails?.length) return;
    setLoadingMembers(true);
    try {
      const profiles = await Promise.all(
        memberEmails.slice(0, 50).map(email =>
          base44.entities.UserProfile.filter({ user_email: email }).then(r => r[0] || null)
        )
      );
      setMemberProfiles(profiles.filter(Boolean));
    } catch { /* ignore */ }
    setLoadingMembers(false);
  };

  const handleJoin = async () => {
    if (!school || school.member_emails?.includes(user?.email)) return;
    setJoining(true);
    const newMembers = [...(school.member_emails || []), user.email];
    await base44.entities.School.update(school.id, { member_emails: newMembers, student_count: newMembers.length });
    setSchool(prev => ({ ...prev, member_emails: newMembers, student_count: newMembers.length }));
    setJoining(false);
  };

  const openMembers = () => {
    setMembersOpen(true);
    if (memberProfiles.length === 0) loadMembers(school?.member_emails);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <School className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
      <p className="text-lg font-semibold text-muted-foreground mb-4">{error}</p>
      <Button variant="outline" onClick={() => navigate('/schools')} className="gap-2">
        <ArrowLeft className="w-4 h-4" />Back to Schools
      </Button>
    </div>
  );

  const isMember = school.member_emails?.includes(user?.email);
  const isAdmin = school.admin_email === user?.email;
  const memberCount = school.member_emails?.length || school.student_count || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/schools')} className="gap-2 mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4" />Schools
      </Button>

      {/* Cover */}
      <div className="rounded-2xl overflow-hidden mb-6">
        <div className="h-40 sm:h-56 relative">
          {school.cover_url ? (
            <img src={school.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-brand opacity-80 flex items-center justify-center">
              <School className="w-16 h-16 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{school.name}</h1>
                {school.verified && (
                  <Badge className="bg-blue-500 text-white text-[10px] gap-1">
                    <CheckCircle className="w-3 h-3" />Verified
                  </Badge>
                )}
              </div>
              <Badge className={`mt-1 text-xs ${TYPE_COLORS[school.type] || ''}`}>
                {TYPE_LABELS[school.type] || school.type}
              </Badge>
            </div>
            {!isMember && !isAdmin && (
              <Button onClick={handleJoin} disabled={joining} className="gradient-brand border-0 gap-2 flex-shrink-0">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Join School
              </Button>
            )}
            {(isMember || isAdmin) && (
              <Badge className="bg-emerald-500 text-white text-xs">✓ Member</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {school.description && (
            <Card className="p-5">
              <h2 className="font-bold text-base mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{school.description}</p>
            </Card>
          )}

          {/* Members preview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Members ({memberCount})
              </h2>
              {memberCount > 0 && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openMembers}>
                  View All
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(school.member_emails || []).slice(0, 8).map((email, i) => (
                <div key={email}
                  onClick={openMembers}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                  title={email}>
                  {email[0].toUpperCase()}
                </div>
              ))}
              {memberCount > 8 && (
                <button onClick={openMembers}
                  className="w-9 h-9 rounded-full bg-muted border flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted/80">
                  +{memberCount - 8}
                </button>
              )}
              {memberCount === 0 && (
                <p className="text-sm text-muted-foreground">No members yet. Be the first to join!</p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h2 className="font-bold text-sm">School Info</h2>
            {school.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                {school.address}
              </div>
            )}
            {school.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 flex-shrink-0 text-primary" />
                <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {school.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {school.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                {school.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 flex-shrink-0 text-primary" />
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </div>
          </Card>
        </div>
      </div>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Members ({memberCount})
            </DialogTitle>
          </DialogHeader>
          {loadingMembers ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2 mt-2">
              {memberProfiles.length > 0 ? memberProfiles.map(profile => (
                <Link
                  key={profile.user_email}
                  to={`/profile/${encodeURIComponent(profile.user_email)}`}
                  onClick={() => setMembersOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                      {profile.username?.[0]?.toUpperCase() || profile.user_email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{profile.username || profile.user_email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.role} {profile.school_name ? `· ${profile.school_name}` : ''}
                    </p>
                  </div>
                  {profile.is_verified && (
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </Link>
              )) : (
                <div className="text-center py-8">
                  <UserCircle2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">Member profiles not loaded yet.</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => loadMembers(school.member_emails)}>
                    Load Members
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}