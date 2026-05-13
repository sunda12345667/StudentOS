import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PenSquare, Loader2, MessageCircle } from 'lucide-react';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';

export default function Messages() {
  const { user } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Conversation.list('-updated_date', 50)
      .then(convs => {
        const mine = convs.filter(c => c.participants?.includes(user.email));
        setConversations(mine);
        if (mine.length > 0) setSelectedConv(mine[0]);
      })
      .finally(() => setLoading(false));
  }, [user?.email]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4" style={{ height: 'calc(100vh - 3.5rem)' }}>
      <Card className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Chats</h2>
              <PenSquare className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search Messenger" className="pl-9 bg-secondary border-0 rounded-full h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No conversations yet
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                currentUser={user}
                selectedId={selectedConv?.id}
                onSelect={setSelectedConv}
              />
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConv ? (
          <ChatWindow conversation={selectedConv} currentUser={user} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Your Messages</p>
              <p className="text-sm">Send messages to your friends</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}