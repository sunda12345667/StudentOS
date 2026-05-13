import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send, MessageCircle, Loader2, PenSquare, Hash, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import RoomList from '@/components/messages/RoomList';
import RoomChatWindow from '@/components/messages/RoomChatWindow';

const TABS = [
  { id: 'direct', label: 'Direct', icon: MessageCircle },
  { id: 'rooms', label: 'Rooms', icon: Hash },
];

export default function Messages() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState('direct');

  // Direct messaging state
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const bottomRef = useRef(null);

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Load DMs
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Conversation.list('-updated_date', 50)
      .then(convs => {
        const mine = convs.filter(c => c.participants?.includes(user.email));
        setConversations(mine);
        if (mine.length > 0) setSelected(mine[0]);
      }).finally(() => setLoading(false));
  }, [user?.email]);

  // Load DM messages
  useEffect(() => {
    if (!selected?.id) return;
    setMsgsLoading(true);
    base44.entities.Message.filter({ conversation_id: selected.id }, 'created_date', 100)
      .then(setMessages).finally(() => setMsgsLoading(false));

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id !== selected.id) return;
      if (event.type === 'create') {
        setMessages(prev => prev.find(m => m.id === event.id) ? prev : [...prev, event.data]);
      }
    });
    return unsub;
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load rooms (courses + campus groups the user is in)
  useEffect(() => {
    if (!user?.email) return;
    setRoomsLoading(true);
    Promise.all([
      base44.entities.Course.list('-created_date', 50),
      base44.entities.CampusGroup.list('-created_date', 50),
    ]).then(([courses, groups]) => {
      const myCourses = courses
        .filter(c => c.enrolled_emails?.includes(user.email) || c.teacher_email === user.email)
        .map(c => ({ ...c, roomType: 'course', member_count: c.student_count || c.enrolled_emails?.length || 0 }));
      const myGroups = groups
        .filter(g => g.member_emails?.includes(user.email) || g.admin_email === user.email)
        .map(g => ({ ...g, roomType: 'group', member_count: g.member_count || g.member_emails?.length || 0 }));
      const allRooms = [...myCourses, ...myGroups];
      setRooms(allRooms);
      if (allRooms.length > 0) setSelectedRoom(allRooms[0]);
    }).finally(() => setRoomsLoading(false));
  }, [user?.email]);

  const sendDM = async (e) => {
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
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black">Messages</h2>
              <PenSquare className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
            </div>
            {/* Tabs */}
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direct conversations list */}
          {tab === 'direct' && (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 bg-muted border-0 rounded-full h-8 text-xs" />
              </div>
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
                        <Avatar className="h-10 w-10">
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
                          {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: false })}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Rooms list */}
          {tab === 'rooms' && (
            <div className="flex-1 overflow-hidden">
              <RoomList
                rooms={rooms}
                selectedId={selectedRoom?.id}
                onSelect={setSelectedRoom}
                loading={roomsLoading}
              />
            </div>
          )}
        </div>

        {/* Main panel */}
        {tab === 'direct' ? (
          selected ? (
            <div className="flex-1 flex flex-col">
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
              </div>
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
              <form onSubmit={sendDM} className="flex items-center gap-2 p-3 border-t border-border">
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
          )
        ) : (
          selectedRoom ? (
            <RoomChatWindow room={selectedRoom} currentUser={user} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Hash className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Select a room</p>
                <p className="text-sm">Join a course or campus group to see its chat room</p>
              </div>
            </div>
          )
        )}
      </Card>
    </div>
  );
}