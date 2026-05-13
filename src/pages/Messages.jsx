import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send, MessageCircle, Loader2, PenSquare, Phone, Video, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { user } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Conversation.list('-updated_date', 50)
      .then(convs => {
        const mine = convs.filter(c => c.participants?.includes(user.email));
        setConversations(mine);
        if (mine.length > 0) setSelected(mine[0]);
      }).finally(() => setLoading(false));
  }, [user?.email]);

  useEffect(() => {
    if (!selected?.id) return;
    setMsgsLoading(true);
    base44.entities.Message.filter({ conversation_id: selected.id }, 'created_date', 100)
      .then(setMessages).finally(() => setMsgsLoading(false));
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const msg = await base44.entities.Message.create({
      conversation_id: selected.id, sender_email: user.email,
      sender_name: user.full_name, sender_avatar: user.avatar_url || '',
      content: text.trim(), read_by: [user.email],
    });
    setMessages(p => [...p, msg]);
    setText('');
    setSending(false);
    await base44.entities.Conversation.update(selected.id, {
      last_message: text.trim(), last_message_time: new Date().toISOString(), last_sender: user.email,
    });
  };

  const getOther = (conv) => {
    const idx = conv.participants?.indexOf(user?.email) === 0 ? 1 : 0;
    return {
      name: conv.participant_names?.[idx] || 'Unknown',
      avatar: conv.participant_avatars?.[idx] || '',
      initials: (conv.participant_names?.[idx] || 'U').split(' ').map(n => n[0]).join('').toUpperCase(),
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4" style={{ height: 'calc(100vh - 4rem)' }}>
      <Card className="flex h-full overflow-hidden shadow-lg">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black">Messages</h2>
              <PenSquare className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 bg-muted border-0 rounded-full h-9 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No conversations yet</div>
            ) : (
              conversations.map(conv => {
                const other = getOther(conv);
                return (
                  <button key={conv.id} onClick={() => setSelected(conv)}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left", selected?.id === conv.id ? "bg-primary/10" : "hover:bg-muted")}>
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={other.avatar} />
                        <AvatarFallback className="gradient-brand text-white font-semibold text-sm">{other.initials}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{other.name}</p>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_sender === user?.email ? 'You: ' : ''}{conv.last_message}
                        </p>
                      )}
                    </div>
                    {conv.last_message_time && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message_time))}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={getOther(selected).avatar} />
                    <AvatarFallback className="gradient-brand text-white text-xs">{getOther(selected).initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{getOther(selected).name}</p>
                  <p className="text-xs text-green-500">Active now</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Video className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Info className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  {messages.map(msg => {
                    const isMine = msg.sender_email === user?.email;
                    const si = msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                            <AvatarImage src={msg.sender_avatar} />
                            <AvatarFallback className="gradient-brand text-white text-[10px]">{si}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm", isMine ? "gradient-brand text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                          {msg.content}
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
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Aa" className="flex-1 bg-muted border-0 rounded-full" disabled={sending} />
              <Button type="submit" variant="ghost" size="icon" className="text-primary" disabled={!text.trim() || sending}>
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Select a conversation</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}