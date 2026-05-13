import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { CAT_CONFIG, COND_COLORS } from './ItemCard';
import { MessageCircle, Eye, Share2, Flag, Star, CheckCircle2, Package, Loader2, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function ItemDetail({ item, open, onClose, currentUser, onContact }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!item) return null;
  const cfg = CAT_CONFIG[item.category] || CAT_CONFIG.textbook;
  const Icon = cfg.icon;
  const si = item.seller_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const isOwn = item.seller_email === currentUser?.email;

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    // Find or create a conversation
    const convos = await base44.entities.Conversation.filter({ participants: currentUser.email }).catch(() => []);
    let convo = convos.find(c => c.participants?.includes(item.seller_email));
    if (!convo) {
      convo = await base44.entities.Conversation.create({
        participants: [currentUser.email, item.seller_email],
        participant_names: [currentUser.full_name, item.seller_name],
        last_message: message.trim(),
        last_message_time: new Date().toISOString(),
        last_sender: currentUser.email,
      });
    }
    await base44.entities.Message.create({
      conversation_id: convo.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url || '',
      content: `Re: "${item.title}" — ${message.trim()}`,
      read_by: [currentUser.email],
    });
    setSent(true); setSending(false);
    toast.success('Message sent to seller!');
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black line-clamp-2">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Image */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${cfg.grad} flex items-center justify-center`}>
                <Icon className="w-20 h-20 text-white/60" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={`${cfg.color} border-0`}>{cfg.label}</Badge>
            {item.is_digital && <Badge className="gradient-brand text-white border-0">📱 Digital</Badge>}
            {item.condition && !item.is_digital && <Badge className={`${COND_COLORS[item.condition]} border-0`}>{item.condition.replace('_', ' ')}</Badge>}
            {item.subject && <Badge variant="outline">{item.subject}</Badge>}
            {item.grade_level && <Badge variant="outline">{item.grade_level}</Badge>}
            {item.status !== 'available' && <Badge className="bg-red-100 text-red-700 border-0">{item.status}</Badge>}
          </div>

          {/* Price & Stats */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black text-primary">${Number(item.price).toFixed(2)}</p>
              {item.price === 0 && <p className="text-xs text-green-600 font-medium mt-0.5">FREE</p>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{item.views || 0} views</span>
              <span className="text-[11px]">{formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <p className="font-semibold text-sm mb-1.5">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Seller */}
          <div className="rounded-xl border p-4 flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={item.seller_avatar} />
              <AvatarFallback className="gradient-brand text-white font-bold">{si}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold">{item.seller_name}</p>
              <p className="text-xs text-muted-foreground">Seller · Student</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-0 gap-1"><CheckCircle2 className="w-3 h-3" />Active</Badge>
          </div>

          {/* Actions */}
          {!isOwn && item.status === 'available' && (
            <div className="space-y-3">
              {!sent ? (
                <>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder={`Hi ${item.seller_name?.split(' ')[0]}, I'm interested in "${item.title}"...`}
                    rows={3} />
                  <div className="flex gap-2">
                    <Button onClick={sendMessage} disabled={sending || !message.trim()} className="flex-1 gradient-brand border-0 gap-2">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                      {item.is_digital ? 'Request Access' : 'Message Seller'}
                    </Button>
                    <Button variant="outline" size="icon" onClick={share}><Share2 className="w-4 h-4" /></Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">Message sent!</p>
                  <p className="text-sm text-muted-foreground">Check your Messages to continue the conversation.</p>
                </div>
              )}
            </div>
          )}

          {isOwn && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-center text-primary font-medium">
              This is your listing
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}