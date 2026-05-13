import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CAT_CONFIG, COND_COLORS } from './ItemCard';
import { MessageCircle, Eye, Share2, CheckCircle2, Loader2, ShieldCheck, Star, ShoppingCart, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import ItemReviews from './ItemReviews';
import PlaceOrder from './PlaceOrder';

export default function ItemDetail({ item, open, onClose, currentUser }) {
  const [sendingMsg, setSendingMsg] = useState(false);
  const [message, setMessage] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  if (!item) return null;
  const cfg = CAT_CONFIG[item.category] || CAT_CONFIG.textbook;
  const Icon = cfg.icon;
  const si = item.seller_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const isOwn = item.seller_email === currentUser?.email;

  const sendMessage = async () => {
    if (!message.trim() || sendingMsg) return;
    setSendingMsg(true);
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
      sender_email: currentUser.email, sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url || '',
      content: `Re: "${item.title}" — ${message.trim()}`,
      read_by: [currentUser.email],
    });
    setMsgSent(true); setSendingMsg(false);
    toast.success('Message sent to seller!');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black line-clamp-2 pr-6">{item.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
              {item.status !== 'available' && <Badge className="bg-red-100 text-red-700 border-0 capitalize">{item.status}</Badge>}
            </div>

            {/* Price row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-black text-primary">${Number(item.price).toFixed(2)}</p>
                {item.price == 0 && <p className="text-xs text-green-600 font-medium">FREE</p>}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{item.views || 0}</span>
                <span className="text-[11px]">{formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Delivery badge */}
            {item.is_digital ? (
              <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
                📱 Digital product — instant delivery after payment
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
                <Truck className="w-3.5 h-3.5" />Pickup or delivery available · Escrow payment protection
              </div>
            )}

            {/* Seller card */}
            <div className="rounded-xl border p-3 flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={item.seller_avatar} />
                <AvatarFallback className="gradient-brand text-white font-bold">{si}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-sm">{item.seller_name}</p>
                <p className="text-xs text-muted-foreground">Seller</p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-0 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />Active</Badge>
            </div>

            {/* Tabs: Description | Chat | Reviews */}
            <Tabs defaultValue="description">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="flex-1">Details</TabsTrigger>
                {!isOwn && <TabsTrigger value="chat" className="flex-1 gap-1"><MessageCircle className="w-3.5 h-3.5" />Chat</TabsTrigger>}
                <TabsTrigger value="reviews" className="flex-1 gap-1"><Star className="w-3.5 h-3.5" />Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-3">
                {item.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}
              </TabsContent>

              {!isOwn && (
                <TabsContent value="chat" className="mt-3">
                  {!msgSent ? (
                    <div className="space-y-2">
                      <Textarea value={message} onChange={e => setMessage(e.target.value)}
                        placeholder={`Hi ${item.seller_name?.split(' ')[0]}, I'm interested in "${item.title}"...`}
                        rows={4} />
                      <Button onClick={sendMessage} disabled={sendingMsg || !message.trim()} className="w-full gradient-brand border-0 gap-2">
                        {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                        Send Message
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold">Message sent!</p>
                      <p className="text-sm text-muted-foreground">Check Messages to continue the chat.</p>
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="reviews" className="mt-3">
                <ItemReviews itemId={item.id} sellerEmail={item.seller_email} currentUser={currentUser} />
              </TabsContent>
            </Tabs>

            {/* Buy / Order CTA */}
            {!isOwn && item.status === 'available' && (
              <div className="flex gap-2 pt-1">
                <Button onClick={() => setOrderOpen(true)} className="flex-1 gradient-brand border-0 gap-2 h-11">
                  <ShieldCheck className="w-4 h-4" />Buy with Escrow
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                  <Share2 className="w-4 h-4" />
                </Button>
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

      <PlaceOrder item={item} open={orderOpen} onClose={() => setOrderOpen(false)} buyer={currentUser} />
    </>
  );
}