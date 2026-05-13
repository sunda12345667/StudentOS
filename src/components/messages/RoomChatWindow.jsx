import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Hash, Users, BookOpen, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function RoomChatWindow({ room, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!room?.id) return;
    setLoading(true);
    setMessages([]);
    base44.entities.GroupMessage.filter({ group_id: room.id }, 'created_date', 100)
      .then(setMessages)
      .finally(() => setLoading(false));

    const unsub = base44.entities.GroupMessage.subscribe((event) => {
      if (event.data?.group_id !== room.id) return;
      if (event.type === 'create') {
        setMessages(prev => {
          if (prev.find(m => m.id === event.id)) return prev;
          return [...prev, event.data];
        });
      }
    });
    return unsub;
  }, [room?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await base44.entities.GroupMessage.create({
      group_id: room.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url || '',
      content: text.trim(),
    });
    setText('');
    setSending(false);
  };

  if (!room) return null;

  const RoomIcon = room.roomType === 'course' ? BookOpen : GraduationCap;
  const iconColor = room.roomType === 'course' ? 'text-green-500' : 'text-indigo-500';

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", room.roomType === 'course' ? 'bg-green-500/10' : 'bg-indigo-500/10')}>
            <RoomIcon className={cn("w-5 h-5", iconColor)} />
          </div>
          <div>
            <p className="font-semibold text-sm">{room.name}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                {room.roomType === 'course' ? 'Course' : 'Campus Group'}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />{room.member_count || 0} members
              </span>
            </div>
          </div>
        </div>
        <Hash className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Hash className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm">Start the conversation</p>
                <p className="text-xs">Be the first to message in <strong>{room.name}</strong></p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMine = msg.sender_email === currentUser?.email;
              const prevMsg = messages[i - 1];
              const showSender = !isMine && msg.sender_email !== prevMsg?.sender_email;
              const initials = msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
              return (
                <div key={msg.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start", !showSender && !isMine && "pl-9")}>
                  {!isMine && showSender && (
                    <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                      <AvatarImage src={msg.sender_avatar} />
                      <AvatarFallback className="gradient-brand text-white text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[72%]", !isMine && "")}>
                    {showSender && !isMine && (
                      <p className="text-[11px] font-semibold text-primary mb-0.5 ml-0.5">{msg.sender_name}</p>
                    )}
                    <div className={cn("px-3 py-2 rounded-2xl text-sm", isMine ? "gradient-brand text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-border">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Message #${room.name?.toLowerCase().replace(/\s/g, '-')}`}
          className="flex-1 bg-muted border-0 rounded-full text-sm"
          disabled={sending}
        />
        <Button type="submit" variant="ghost" size="icon" className="text-primary" disabled={!text.trim() || sending}>
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
    </div>
  );
}