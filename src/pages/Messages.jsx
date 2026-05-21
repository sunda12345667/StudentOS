import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle, Loader2, X, Plus, Hash, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import RoomList from '@/components/messages/RoomList';
import RoomChatWindow from '@/components/messages/RoomChatWindow';
import PremiumChatHeader from '@/components/messages/PremiumChatHeader';
import PremiumMessageInput from '@/components/messages/PremiumMessageInput';
import EmptyChatState from '@/components/messages/EmptyChatState';
import { toast } from 'sonner';

const TABS = [
  { id: 'direct', label: 'DMs', icon: MessageCircle },
  { id: 'rooms',  label: 'Rooms', icon: Hash },
];

export default function Messages() {
  const { user } = useOutletContext();
  const location = useLocation();
  const [tab, setTab] = useState('direct');
  // 'list' or 'chat' — drives full-screen chat on mobile
  const [mobileView, setMobileView] = useState('list');

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const openConv = (conv) => {
    setSelected(conv);
    setTab('direct');
    setMobileView('chat');
  };

  const openRoom = (room) => {
    setSelectedRoom(room);
    setMobileView('chat');
  };

  const goBack = () => {
    setMobileView('list');
  };

  // Load DMs
  useEffect(() => {
    if (!user?.email) return;
    const targetId = location.state?.conversationId;
    base44.entities.Conversation.list('-updated_date', 50)
      .then(convs => {
        const mine = convs.filter(c => c.participants?.includes(user.email));
        setConversations(mine);
        if (targetId) {
          const target = mine.find(c => c.id === targetId);
          if (target) { setSelected(target); setMobileView('chat'); }
          else if (mine.length > 0) setSelected(mine[0]);
        } else if (mine.length > 0) {
          setSelected(mine[0]);
        }
      }).finally(() => setLoading(false));
  }, [user?.email]);

  // Load DM messages + subscribe
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

  // Subscribe to new messages outside active chat (toast notifications)
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type !== 'create') return;
      const msg = event.data;
      if (!msg || msg.sender_email === user.email) return;
      if (msg.conversation_id === selected?.id) return; // already in that chat
      toast(`💬 ${msg.sender_name || 'Someone'}: ${msg.content?.slice(0, 60)}`, {
        duration: 4000,
        action: { label: 'Open', onClick: () => {} },
      });
    });
    return unsub;
  }, [user?.email, selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Focus input when chat opens on mobile
  useEffect(() => {
    if (mobileView === 'chat' && tab === 'direct') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [mobileView, tab]);

  // Rooms
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
    const msgContent = text.trim();
    setText('');
    const msg = await base44.entities.Message.create({
      conversation_id: selected.id,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url || '',
      content: msgContent,
      read_by: [user.email],
    });
    setMessages(p => [...p, msg]);
    setSending(false);

    // Update convo
    await base44.entities.Conversation.update(selected.id, {
      last_message: msgContent, last_message_time: new Date().toISOString(), last_sender: user.email,
    });

    // Create notification for the other participant
    const otherEmail = selected.participants?.find(e => e !== user.email);
    if (otherEmail) {
      base44.entities.Notification.create({
        user_email: otherEmail,
        from_name: user.full_name,
        from_avatar: user.avatar_url || '',
        from_email: user.email,
        type: 'message',
        content: `sent you a message: "${msgContent.slice(0, 60)}${msgContent.length > 60 ? '...' : ''}"`,
        entity_type: 'conversation',
        entity_id: selected.id,
        is_read: false,
      }).catch(() => {});
    }
  };

  const searchUsers = async (q) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const all = await base44.entities.User.list('-created_date', 100);
    const filtered = all.filter(u =>
      u.email !== user?.email &&
      (u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()))
    );
    setSearchResults(filtered.slice(0, 8));
    setSearching(false);
  };

  const startChat = async (targetUser) => {
    const existing = conversations.find(c =>
      c.participants?.includes(user.email) && c.participants?.includes(targetUser.email)
    );
    if (existing) { openConv(existing); setShowSearch(false); setSearch(''); setSearchResults([]); return; }
    const conv = await base44.entities.Conversation.create({
      participants: [user.email, targetUser.email],
      participant_names: [user.full_name, targetUser.full_name],
      participant_avatars: [user.avatar_url || '', targetUser.avatar || ''],
      last_message: '', last_message_time: new Date().toISOString(), last_sender: user.email,
    });
    setConversations(p => [conv, ...p]);
    openConv(conv);
    setShowSearch(false); setSearch(''); setSearchResults([]);
  };

  const getOther = (conv) => {
    const idx = conv.participants?.indexOf(user?.email) === 0 ? 1 : 0;
    return {
      name: conv.participant_names?.[idx] || 'Unknown',
      avatar: conv.participant_avatars?.[idx] || '',
      email: conv.participants?.[idx] || '',
      initials: (conv.participant_names?.[idx] || 'U').split(' ').map(n => n[0]).join('').toUpperCase(),
    };
  };

  // ─── Sidebar / List panel ─────────────────────────────────────────────────
  const ListPanel = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black">Messages</h2>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            {showSearch ? <X className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
          </button>
        </div>

        {/* New chat search */}
        {showSearch && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search students..."
                value={search}
                onChange={e => searchUsers(e.target.value)}
                className="pl-8 bg-muted border-0 rounded-full h-9 text-sm"
              />
            </div>
            {(searching || searchResults.length > 0) && (
              <div className="mt-1.5 bg-card border border-border rounded-xl overflow-hidden shadow-lg z-10">
                {searching ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : searchResults.map(u => {
                  const si = u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                  return (
                    <button key={u.id} onClick={() => startChat(u)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="gradient-brand text-white text-xs">{si}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      {tab === 'direct' && (
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Tap + to start a chat</p>
            </div>
          ) : conversations.map(conv => {
            const other = getOther(conv);
            return (
              <button key={conv.id} onClick={() => openConv(conv)}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-0.5",
                  selected?.id === conv.id ? "bg-primary/10" : "hover:bg-muted active:bg-muted")}>
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={other.avatar} />
                    <AvatarFallback className="gradient-brand text-white font-semibold">{other.initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{other.name}</p>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
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
          })}
        </div>
      )}

      {tab === 'rooms' && (
        <div className="flex-1 overflow-hidden">
          <RoomList
            rooms={rooms}
            selectedId={selectedRoom?.id}
            onSelect={openRoom}
            loading={roomsLoading}
          />
        </div>
      )}
    </div>
  );

  // ─── Chat panel ───────────────────────────────────────────────────────────
  const DirectChatPanel = () => {
    if (!selected) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm mt-1">or start a new one</p>
          </div>
        </div>
      );
    }
    const other = getOther(selected);
    return (
      <div className="flex flex-col h-full">
        {/* Premium header */}
        <PremiumChatHeader user={user} other={other} onBack={goBack} />

        {/* Messages with gradient background */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth relative">
          {msgsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <EmptyChatState name={other.name} />
          ) : (
            <>
              {messages.map(msg => {
                const isMine = msg.sender_email === user?.email;
                const si = msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <div key={msg.id} className={`flex gap-2 items-end ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <Avatar className="h-7 w-7 flex-shrink-0 mb-1">
                        <AvatarImage src={msg.sender_avatar} />
                        <AvatarFallback className="gradient-brand text-white text-[10px]">{si}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                      isMine ? "gradient-brand text-white rounded-br-sm shadow-lg shadow-primary/20" : "bg-muted rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-1" />
            </>
          )}
        </div>

        {/* Premium input */}
        <PremiumMessageInput
          value={text}
          onChange={e => setText(e.target.value)}
          onSubmit={sendDM}
          disabled={sending}
          inputRef={inputRef}
        />
      </div>
    );
  };

  return (
    <div className="flex md:h-[calc(100vh-64px)] h-full overflow-hidden">
      {/* ── Mobile: show either list or chat (full screen) ── */}
      <div className="md:hidden w-full h-full flex flex-col">
        {mobileView === 'list' ? (
          <div className="h-full overflow-hidden bg-card">
            <ListPanel />
          </div>
        ) : tab === 'direct' ? (
          <div className="h-full flex flex-col bg-card">
            <DirectChatPanel />
          </div>
        ) : (
          <div className="h-full flex flex-col bg-card">
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border">
              <button onClick={goBack} className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-sm">{selectedRoom?.name || 'Room'}</span>
            </div>
            <RoomChatWindow room={selectedRoom} currentUser={user} onBack={goBack} />
          </div>
        )}
      </div>

      {/* ── Desktop: split-screen ── */}
      <div className="hidden md:flex w-full h-full">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <ListPanel />
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
          {tab === 'direct' ? (
            <DirectChatPanel />
          ) : selectedRoom ? (
            <RoomChatWindow room={selectedRoom} currentUser={user} onBack={() => {}} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Hash className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Select a room</p>
                <p className="text-sm mt-1">Join a course or campus group</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}