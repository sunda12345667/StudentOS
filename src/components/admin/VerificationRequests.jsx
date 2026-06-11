import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle,
  Loader2, FileText, ExternalLink, GraduationCap, BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',  icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle },
};

export default function VerificationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.VerificationRequest.list('-created_date', 200)
      .then(setRequests)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (req) => {
    setActionLoading(req.id);
    try {
      await base44.entities.VerificationRequest.update(req.id, { status: 'approved', admin_note: '' });
      // Update UserProfile verification badge
      const profiles = await base44.entities.UserProfile.filter({ user_email: req.user_email });
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, { is_verified: true });
      }
      // Notify user
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: 'achievement',
        content: `✅ Your ${req.role} verification has been approved! You now have a verified badge.`,
        is_read: false,
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
      toast.success('Verification approved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (req) => {
    setActionLoading(req.id);
    try {
      await base44.entities.VerificationRequest.update(req.id, { status: 'rejected', admin_note: rejectNote });
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: 'announcement',
        content: `❌ Your ${req.role} verification was rejected.${rejectNote ? ` Reason: ${rejectNote}` : ''}`,
        is_read: false,
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected', admin_note: rejectNote } : r));
      setRejectingId(null);
      setRejectNote('');
      toast.success('Verification rejected');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white/5 text-white/40 hover:text-white/70'
            }`}
          >
            {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/30 text-sm">No {filter} verification requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            const isRejecting = rejectingId === req.id;

            return (
              <div key={req.id} className="rounded-2xl border border-white/8 bg-[#0d1220] p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {req.role === 'teacher'
                      ? <BookOpen className="w-5 h-5 text-violet-300" />
                      : <GraduationCap className="w-5 h-5 text-blue-300" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{req.user_name || req.user_email}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                        <StatusIcon className="inline w-3 h-3 mr-0.5" />{sc.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/40 capitalize">{req.role}</span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">{req.user_email}</p>
                    {req.institution && <p className="text-white/30 text-xs mt-0.5">🏫 {req.institution}</p>}
                    {req.notes && <p className="text-white/40 text-xs mt-1 italic">"{req.notes}"</p>}
                    {req.admin_note && (
                      <p className="text-amber-400/70 text-xs mt-1 italic">Admin note: {req.admin_note}</p>
                    )}
                    <p className="text-white/20 text-[10px] mt-1">
                      {req.created_date ? formatDistanceToNow(new Date(req.created_date), { addSuffix: true }) : ''}
                    </p>
                  </div>

                  {/* Document link */}
                  <a
                    href={req.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/20 transition-colors flex-shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Doc
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>

                {/* Actions — only for pending */}
                {req.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {isRejecting ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Rejection reason (optional)..."
                          value={rejectNote}
                          onChange={e => setRejectNote(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 placeholder:text-white/20 outline-none focus:border-red-500/40"
                        />
                        <Button
                          size="sm"
                          onClick={() => reject(req)}
                          disabled={actionLoading === req.id}
                          className="bg-red-500/80 hover:bg-red-500 text-white border-0 text-xs gap-1"
                        >
                          {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldX className="w-3 h-3" />}
                          Confirm
                        </Button>
                        <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="text-white/30 hover:text-white text-xs px-2">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approve(req)}
                          disabled={actionLoading === req.id}
                          className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 gap-1.5 text-xs"
                        >
                          {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setRejectingId(req.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 gap-1.5 text-xs"
                        >
                          <ShieldX className="w-3 h-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}