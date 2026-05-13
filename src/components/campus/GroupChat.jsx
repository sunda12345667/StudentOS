import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Megaphone, Paperclip, Loader2, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function GroupChat({ groupId, user, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    load();
    const unsub = base44.entities.GroupMessage.subscribe(ev => {
      if (ev.data?.group_id === groupId) {
        if (ev.type === 'create') setMessages(p => [...p, ev.data]);
        if (ev.type === 'delete') setMessages(p => p.filter(m => m.id !== ev.id));
      }
    });
    return unsub;
  }, [groupId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const load = async () => {
    const data = await base44.entities.GroupMessage.filter({ group_id: groupId }, 'created_date', 100).catch(() => []);
    setMessages(data);
    setLoading(false);
  };

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await base44.entities.GroupMessage.create({
      group_id: groupId, content: text.trim(),
      sender_email: user.email, sender_name: user.full_name,
      sender_avatar: user.avatar_url || '',
      is_announcement: isAnnouncement && isAdmin,
    });
    setText(''); setIsAnnouncement(false); setSending(false);
  };

  const announcements = messages.filter(m => m.is_announcement);
  const chats = messages.filter(m => !m.is_announcement);

  return (
    <div className="flex flex-col h-[600px]">
      {/* Pinned announcements */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 space-y-1.5 flex-shrink-0">
          <p className="text-xs font-bold text-amber-700 flex items-center gap-1"><Megaphone className="w-3.5 h-3.5" />Announcements</p>
          {announcements.slice(-2).map(m => (
            <p key={m.id} className="text-sm text-amber-900">📢 <span className="font-semibold">{m.sender_name}:</span> {m.content}</p>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No messages yet. Say hello! 👋</div>
        ) : (
          chats.map((msg) => {
            const isOwn = msg.sender_email === user?.email;
            const initials = msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                {!isOwn && (
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarImage src={msg.sender_avatar} />
                    <AvatarFallback className="gradient-brand text-white text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwn && <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.sender_name}</p>}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 mx-1">
                    {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex-shrink-0">
        {isAdmin && (
          <button
            onClick={() => setIsAnnouncement(a => !a)}
            className={`flex items-center gap-1.5 text-xs mb-2 px-2.5 py-1 rounded-full border transition-colors ${isAnnouncement ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            {isAnnouncement ? 'Sending as Announcement' : 'Send as Announcement'}
          </button>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-muted rounded-2xl px-4 py-2.5">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-transparent text-sm outline-none resize-none"
            />
          </div>
          <Button onClick={send} disabled={sending || !text.trim()} className="gradient-brand border-0 h-10 w-10 p-0 rounded-full flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}