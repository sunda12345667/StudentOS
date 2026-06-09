import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Flag, Trash2, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  misinformation: 'Misinformation',
  inappropriate_content: 'Inappropriate Content',
  violence: 'Violence',
  other: 'Other',
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  reviewed:  { label: 'Reviewed',  color: 'bg-blue-100 text-blue-700' },
  removed:   { label: 'Removed',   color: 'bg-red-100 text-red-700' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-600' },
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState(false);

  const load = async () => {
    const all = await base44.entities.PostReport.list('-created_date', 100);
    setReports(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (report, status) => {
    setActing(true);
    await base44.entities.PostReport.update(report.id, { status });
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status } : r));
    toast.success(`Report marked as ${status}`);
    setActing(false);
  };

  const removePost = async (report) => {
    setActing(true);
    try {
      await base44.entities.Post.delete(report.post_id);
      await base44.entities.PostReport.update(report.id, { status: 'removed' });
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'removed' } : r));
      toast.success('Post removed and report resolved.');
      setSelected(null);
    } catch {
      toast.error('Could not delete post — it may have already been removed.');
      await base44.entities.PostReport.update(report.id, { status: 'removed' });
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'removed' } : r));
      setSelected(null);
    }
    setActing(false);
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, color: 'text-white' },
          { label: 'Pending Review', value: pendingCount, color: 'text-amber-400' },
          { label: 'Posts Removed', value: reports.filter(r => r.status === 'removed').length, color: 'text-red-400' },
          { label: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs text-white/40 mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'reviewed', 'removed', 'dismissed', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Flag className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {filter !== 'all' ? filter : ''} reports</p>
          </div>
        ) : (
          filtered.map(report => {
            const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
            return (
              <div key={report.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/8 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-lg">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                      <span className="text-xs text-white/30">
                        {report.created_date ? formatDistanceToNow(new Date(report.created_date), { addSuffix: true }) : ''}
                      </span>
                    </div>

                    {/* Post content preview */}
                    <div className="rounded-xl bg-black/30 border border-white/5 p-3 mb-2">
                      <p className="text-xs text-white/40 mb-1">Reported post by <span className="text-white/60 font-medium">{report.post_author_name || report.post_author_email}</span></p>
                      <p className="text-sm text-white/70 line-clamp-2">{report.post_content || '(content unavailable)'}</p>
                    </div>

                    <p className="text-xs text-white/40">
                      Reported by: <span className="text-white/60">{report.reporter_name || report.reporter_email}</span>
                      {report.details && <span className="ml-2 text-white/30">· "{report.details}"</span>}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-white/60 hover:text-white hover:bg-white/10 gap-1"
                      onClick={() => setSelected(report)}>
                      <Eye className="w-3.5 h-3.5" />Review
                    </Button>
                    {report.status === 'pending' && (
                      <>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                          onClick={() => removePost(report)} disabled={acting}>
                          <Trash2 className="w-3.5 h-3.5" />Remove
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 gap-1"
                          onClick={() => updateStatus(report, 'dismissed')} disabled={acting}>
                          <XCircle className="w-3.5 h-3.5" />Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Review Report
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-1">
              <div className="rounded-xl bg-muted p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Reason: <strong>{REASON_LABELS[selected.reason]}</strong></p>
                <p className="text-xs text-muted-foreground">Reported by: <strong>{selected.reporter_name || selected.reporter_email}</strong></p>
                {selected.details && <p className="text-xs text-muted-foreground">Details: {selected.details}</p>}
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground mb-2 font-semibold">Post by {selected.post_author_name}</p>
                <p className="text-sm leading-relaxed">{selected.post_content || '(content unavailable)'}</p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-red-600 hover:bg-red-700 border-0 gap-1.5 text-white"
                  onClick={() => removePost(selected)} disabled={acting}>
                  {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Remove Post
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5"
                  onClick={() => { updateStatus(selected, 'dismissed'); setSelected(null); }} disabled={acting}>
                  <XCircle className="w-4 h-4" />Dismiss
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5"
                  onClick={() => { updateStatus(selected, 'reviewed'); setSelected(null); }} disabled={acting}>
                  <CheckCircle className="w-4 h-4 text-blue-500" />Mark Reviewed
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}