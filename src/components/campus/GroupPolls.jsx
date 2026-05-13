import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BarChart3, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function GroupPolls({ groupId, user, isAdmin }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endsAt, setEndsAt] = useState('');

  useEffect(() => {
    base44.entities.Poll.filter({ group_id: groupId }, '-created_date', 20)
      .then(setPolls).finally(() => setLoading(false));
  }, [groupId]);

  const createPoll = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setCreating(true);
    await base44.entities.Poll.create({
      group_id: groupId, question: question.trim(),
      options: validOptions.map(text => ({ text, votes: [] })),
      created_by: user.email, creator_name: user.full_name,
      ends_at: endsAt || null, is_closed: false,
    });
    const updated = await base44.entities.Poll.filter({ group_id: groupId }, '-created_date', 20);
    setPolls(updated);
    setQuestion(''); setOptions(['', '']); setEndsAt(''); setShowForm(false); setCreating(false);
  };

  const vote = async (poll, optIdx) => {
    const hasVoted = poll.options.some(o => o.votes?.includes(user.email));
    if (hasVoted || poll.is_closed) return;
    const newOptions = poll.options.map((o, i) =>
      i === optIdx ? { ...o, votes: [...(o.votes || []), user.email] } : o
    );
    await base44.entities.Poll.update(poll.id, { options: newOptions });
    setPolls(prev => prev.map(p => p.id === poll.id ? { ...p, options: newOptions } : p));
  };

  const closePoll = async (poll) => {
    await base44.entities.Poll.update(poll.id, { is_closed: true });
    setPolls(prev => prev.map(p => p.id === poll.id ? { ...p, is_closed: true } : p));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Polls</h3>
        <Button size="sm" className="gradient-brand border-0 gap-1.5" onClick={() => setShowForm(f => !f)}>
          <Plus className="w-4 h-4" />New Poll
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 border-primary/20 bg-primary/5">
          <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..." />
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input value={opt} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))} placeholder={`Option ${i + 1}`} />
              {options.length > 2 && (
                <Button size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0" onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOptions(p => [...p, ''])} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Add Option</Button>
            <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="text-xs border border-input rounded-md px-3 py-1.5 bg-background flex-1" />
          </div>
          <Button onClick={createPoll} disabled={creating || !question.trim() || options.filter(o => o.trim()).length < 2} className="w-full gradient-brand border-0">
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Poll
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No polls yet. Create one!</div>
      ) : polls.map((poll, pi) => {
        const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
        const myVoteIdx = poll.options.findIndex(o => o.votes?.includes(user?.email));
        const hasVoted = myVoteIdx !== -1;
        const closed = poll.is_closed || (poll.ends_at && new Date(poll.ends_at) < new Date());
        return (
          <motion.div key={poll.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.05 }}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold">{poll.question}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{poll.creator_name} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {closed ? <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">Closed</Badge>
                    : <Badge className="bg-green-100 text-green-700 border-0 text-[10px] gap-0.5"><Clock className="w-2.5 h-2.5" />Active</Badge>}
                  {isAdmin && !closed && (
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-muted-foreground" onClick={() => closePoll(poll)}>Close</Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {poll.options.map((opt, oi) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes?.length || 0) / totalVotes * 100) : 0;
                  const isMyVote = oi === myVoteIdx;
                  return (
                    <button key={oi} disabled={hasVoted || closed} onClick={() => vote(poll, oi)}
                      className={`w-full text-left rounded-xl overflow-hidden border transition-all ${isMyVote ? 'border-primary' : 'border-border hover:border-primary/50'} ${(!hasVoted && !closed) ? 'cursor-pointer' : 'cursor-default'}`}>
                      <div className="relative px-3 py-2.5">
                        {(hasVoted || closed) && (
                          <div className={`absolute inset-0 ${isMyVote ? 'bg-primary/15' : 'bg-muted/60'}`} style={{ width: `${pct}%` }} />
                        )}
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isMyVote && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                            <span className="text-sm font-medium">{opt.text}</span>
                          </div>
                          {(hasVoted || closed) && <span className="text-xs font-bold text-muted-foreground">{pct}%</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}