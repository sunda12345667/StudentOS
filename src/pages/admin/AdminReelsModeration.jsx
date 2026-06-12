import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Loader2, Play, Flag, Trash2, Eye, EyeOff, ShieldAlert,
  ShieldCheck, AlertTriangle, RotateCcw, CheckCircle, XCircle, Film
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700' },
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700' },
  flagged:   { label: 'Flagged',   color: 'bg-orange-100 text-orange-700' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
  removed:   { label: 'Removed',   color: 'bg-gray-100 text-gray-600' },
};

const REPORT_REASONS = {
  spam: 'Spam', abuse: 'Abuse', harassment: 'Harassment',
  copyright: 'Copyright', misinformation: 'Misinformation', non_educational: 'Non-Educational',
};

export default function AdminReelsModeration() {
  const [reels, setReels] = useState([]);
  const [reelReports, setReelReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState(false);
  const [modNote, setModNote] = useState('');
  const [noteDialogReel, setNoteDialogReel] = useState(null);
  const [pendingAction, setPendingAction] = useState('');

  const load = async () => {
    setLoading(true);
    const [r, rp] = await Promise.all([
      base44.entities.Reel.list('-created_date', 200),
      base44.entities.ContentReport.filter({ target_type: 'reel' }).catch(() => []),
    ]);
    setReels(r);
    setReelReports(rp);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const moderateReel = async (reel, status, note = '') => {
    setActing(true);
    const patch = {
      moderation_status: status,
      is_hidden: ['suspended', 'removed'].includes(status),
      moderation_note: note || modNote,
    };
    await base44.entities.Reel.update(reel.id, patch);
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, ...patch } : r));
    toast.success(`Reel ${status}`);
    setActing(false);
    setModNote('');
    setNoteDialogReel(null);
    setSelected(null);
  };

  const deleteReel = async (reel) => {
    setActing(true);
    await base44.entities.Reel.delete(reel.id);
    setReels(prev => prev.filter(r => r.id !== reel.id));
    toast.success('Reel permanently deleted');
    setActing(false);
    setSelected(null);
  };

  const openActionDialog = (reel, action) => {
    setNoteDialogReel(reel);
    setPendingAction(action);
    setModNote('');
  };

  const confirmAction = () => {
    if (!noteDialogReel) return;
    if (pendingAction === 'delete') { deleteReel(noteDialogReel); setNoteDialogReel(null); }
    else moderateReel(noteDialogReel, pendingAction, modNote);
  };

  const filtered = filter === 'all' ? reels
    : filter === 'reported' ? reels.filter(r => (r.report_count || 0) > 0)
    : reels.filter(r => r.moderation_status === filter);

  const stats = {
    total: reels.length,
    flagged: reels.filter(r => r.moderation_status === 'flagged').length,
    suspended: reels.filter(r => r.moderation_status === 'suspended').length,
    removed: reels.filter(r => r.moderation_status === 'removed').length,
    reported: reels.filter(r => (r.report_count || 0) > 0).length,
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Reels', value: stats.total, color: 'text-white' },
          { label: 'Flagged', value: stats.flagged, color: 'text-orange-400' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
          { label: 'Removed', value: stats.removed, color: 'text-gray-400' },
          { label: 'Reported', value: stats.reported, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'reported', label: 'Reported' },
          { key: 'flagged', label: 'Flagged' },
          { key: 'suspended', label: 'Suspended' },
          { key: 'removed', label: 'Removed' },
          { key: 'approved', label: 'Approved' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}>
            {f.label}
            {f.key === 'reported' && stats.reported > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5">{stats.reported}</span>
            )}
          </button>
        ))}
      </div>

      {/* Reels list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No reels in this category</p>
          </div>
        ) : (
          filtered.map(reel => {
            const statusCfg = STATUS_CONFIG[reel.moderation_status || 'approved'];
            const reportsForReel = reelReports.filter(r => r.target_id === reel.id);
            return (
              <div key={reel.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-24 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 relative">
                    {reel.thumbnail_url
                      ? <img src={reel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-white/30" /></div>
                    }
                    {reel.is_hidden && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <EyeOff className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${statusCfg.color}`}>{statusCfg.label}</span>
                      {(reel.report_count || 0) > 0 && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Flag className="w-3 h-3" />{reel.report_count} reports
                        </span>
                      )}
                      {reel.is_hidden && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg">Hidden</span>}
                    </div>

                    <p className="text-sm font-semibold text-white line-clamp-1">{reel.title || '(no title)'}</p>
                    {reel.subject && <p className="text-xs text-white/40">Subject: {reel.subject}</p>}

                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={reel.author_avatar} />
                        <AvatarFallback className="text-[8px] gradient-brand text-white">{reel.author_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-white/50">{reel.author_name}</span>
                      <span className="text-xs text-white/30">{reel.created_date ? formatDistanceToNow(new Date(reel.created_date), { addSuffix: true }) : ''}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                      <span>❤️ {reel.like_count || 0}</span>
                      <span>💬 {reel.comment_count || 0}</span>
                      <span>👁 {reel.view_count || 0}</span>
                    </div>

                    {reel.moderation_note && (
                      <p className="mt-1 text-xs text-orange-400/80 italic">Note: {reel.moderation_note}</p>
                    )}

                    {/* Reports for this reel */}
                    {reportsForReel.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {reportsForReel.slice(0, 2).map(rep => (
                          <p key={rep.id} className="text-[10px] text-white/30 bg-white/5 rounded-lg px-2 py-1">
                            Report: <span className="text-white/50">{REPORT_REASONS[rep.reason] || rep.reason}</span>
                            {rep.details && <span> — {rep.details}</span>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-white/60 hover:text-white hover:bg-white/10 gap-1"
                      onClick={() => setSelected(reel)}>
                      <Eye className="w-3 h-3" />View
                    </Button>
                    {reel.moderation_status !== 'flagged' && reel.moderation_status !== 'suspended' && reel.moderation_status !== 'removed' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 gap-1"
                        onClick={() => openActionDialog(reel, 'flagged')} disabled={acting}>
                        <ShieldAlert className="w-3 h-3" />Flag
                      </Button>
                    )}
                    {reel.moderation_status !== 'suspended' && reel.moderation_status !== 'removed' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                        onClick={() => openActionDialog(reel, 'suspended')} disabled={acting}>
                        <EyeOff className="w-3 h-3" />Suspend
                      </Button>
                    )}
                    {(reel.moderation_status === 'flagged' || reel.moderation_status === 'suspended') && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-1"
                        onClick={() => moderateReel(reel, 'approved', 'Restored by admin')} disabled={acting}>
                        <RotateCcw className="w-3 h-3" />Restore
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-1"
                      onClick={() => openActionDialog(reel, 'delete')} disabled={acting}>
                      <Trash2 className="w-3 h-3" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Film className="w-4 h-4 text-primary" />Reel Detail
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selected.thumbnail_url && (
                <img src={selected.thumbnail_url} alt="" className="w-full aspect-video object-cover rounded-xl" />
              )}
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Title:</span> {selected.title}</p>
                <p><span className="text-muted-foreground">Author:</span> {selected.author_name} ({selected.author_email})</p>
                {selected.subject && <p><span className="text-muted-foreground">Subject:</span> {selected.subject}</p>}
                {selected.description && <p><span className="text-muted-foreground">Description:</span> {selected.description}</p>}
                <p><span className="text-muted-foreground">Status:</span> <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${STATUS_CONFIG[selected.moderation_status || 'approved'].color}`}>{STATUS_CONFIG[selected.moderation_status || 'approved'].label}</span></p>
                {selected.moderation_note && <p><span className="text-muted-foreground">Mod Note:</span> {selected.moderation_note}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 border-0 text-white gap-1"
                  onClick={() => { openActionDialog(selected, 'flagged'); setSelected(null); }} disabled={acting}>
                  <Flag className="w-3.5 h-3.5" />Flag
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 border-0 text-white gap-1"
                  onClick={() => { openActionDialog(selected, 'suspended'); setSelected(null); }} disabled={acting}>
                  <EyeOff className="w-3.5 h-3.5" />Suspend
                </Button>
                <Button variant="outline" className="flex-1 gap-1"
                  onClick={() => moderateReel(selected, 'approved', 'Restored by admin')} disabled={acting}>
                  <RotateCcw className="w-3.5 h-3.5" />Restore
                </Button>
                <Button className="flex-1 bg-gray-800 hover:bg-gray-900 border-0 text-white gap-1"
                  onClick={() => { openActionDialog(selected, 'delete'); setSelected(null); }} disabled={acting}>
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm action + note dialog */}
      {noteDialogReel && (
        <Dialog open={!!noteDialogReel} onOpenChange={() => setNoteDialogReel(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {pendingAction === 'delete' ? 'Delete Reel' : `${pendingAction.charAt(0).toUpperCase() + pendingAction.slice(1)} Reel`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {pendingAction === 'delete'
                  ? 'This will permanently delete the reel. This cannot be undone.'
                  : 'Add an optional moderation note for auditing purposes.'}
              </p>
              {pendingAction !== 'delete' && (
                <Textarea
                  placeholder="Moderation note (optional)..."
                  value={modNote}
                  onChange={e => setModNote(e.target.value)}
                  rows={3}
                />
              )}
              <div className="flex gap-2">
                <Button onClick={confirmAction} disabled={acting}
                  className={`flex-1 border-0 text-white ${pendingAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}>
                  {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </Button>
                <Button variant="outline" onClick={() => setNoteDialogReel(null)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}