import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image, Smile, Loader2, Phone, Video, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ChatWindow({ conversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const otherIdx = conversation?.participants?.indexOf(currentUser?.email) === 0 ? 1 : 0;
  const otherName = conversation?.participant_names?.[otherIdx] || 'Unknown';
  const otherAvatar = conversation?.participant_avatars?.[otherIdx] || '';
  const otherInitials = otherName.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    if (!conversation?.id) return;
    setLoading(true);
    base44.entities.Message.filter({ conversation_id: conversation.id }, 'created_date', 100)
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);

    const msg = await base44.entities.Message.create({
      conversation_id: conversation.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar || '',
      content: newMessage.trim(),
      read_by: [currentUser.email],
    });

    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setSending(false);

    // Update conversation
    await base44.entities.Conversation.update(conversation.id, {
      last_message: newMessage.trim(),
      last_message_time: new Date().toISOString(),
      last_sender: currentUser.email,
    });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose from your existing chats or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{otherInitials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <p className="font-semibold text-sm">{otherName}</p>
            <p className="text-xs text-green-500">Active now</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="text-primary"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-primary"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-primary"><Info className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center py-6">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarImage src={otherAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">{otherInitials}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{otherName}</p>
              <p className="text-xs text-muted-foreground">You're friends on Facebook</p>
            </div>
            {messages.map(msg => {
              const isMine = msg.sender_email === currentUser.email;
              return (
                <div key={msg.id} className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
                  {!isMine && (
                    <Avatar className="h-7 w-7 mt-1">
                      <AvatarImage src={msg.sender_avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-border">
        <Button type="button" variant="ghost" size="icon" className="text-primary flex-shrink-0">
          <Image className="w-5 h-5" />
        </Button>
        <Input
          placeholder="Aa"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="bg-secondary border-0 rounded-full"
        />
        <Button type="button" variant="ghost" size="icon" className="text-primary flex-shrink-0">
          <Smile className="w-5 h-5" />
        </Button>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={!newMessage.trim() || sending}
          className="text-primary flex-shrink-0"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
    </div>
  );
}

function MessageCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}