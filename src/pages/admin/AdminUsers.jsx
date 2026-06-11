import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, Search, Trash2, AlertTriangle, X, Loader2,
  ShieldAlert, CheckCircle2, FileText, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const ROLE_COLOR = {
  admin: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  student: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  teacher: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  parent: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');
  const [showWarnInput, setShowWarnInput] = useState(false);

  useEffect(() => {
    base44.entities.User.list('-created_date', 500)
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const openUser = async (user) => {
    setSelectedUser(user);
    setLoadingPosts(true);
    setUserPosts([]);
    setShowWarnInput(false);
    setWarningMsg('');
    const posts = await base44.entities.Post.filter({ author_email: user.email }, '-created_date', 50);
    setUserPosts(posts);
    setLoadingPosts(false);
  };

  const sendWarning = async () => {
    if (!warningMsg.trim()) return;
    setActionLoading('warn');
    await base44.entities.Notification.create({
      user_email: selectedUser.email,
      type: 'announcement',
      content: `⚠️ Admin Warning: ${warningMsg.trim()}`,
      is_read: false,
    });
    setActionLoading(null);
    setWarningMsg('');
    setShowWarnInput(false);
    toast.success('Warning sent to user!');
  };

  const deletePost = async (post) => {
    setActionLoading(post.id);
    await base44.entities.Post.delete(post.id);
    setUserPosts(prev => prev.filter(p => p.id !== post.id));
    setActionLoading(null);
    toast.success('Post deleted');
  };

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">

      {/* User List */}
      <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold text-sm">All Users</span>
            <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{users.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm h-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filtered.map(u => (
            <button
              key={u.id}
              onClick={() => openUser(u)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${selectedUser?.id === u.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''}`}
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={u.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                  {u.full_name?.slice(0, 2).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{u.full_name || 'No name'}</p>
                <p className="text-white/40 text-xs truncate">{u.email}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${ROLE_COLOR[u.role] || ROLE_COLOR.student}`}>
                {u.role || 'student'}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">No users found</p>
          )}
        </div>
      </div>

      {/* User Detail Panel */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col rounded-2xl border border-white/8 bg-[#0d1220] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 p-5 border-b border-white/8">
            <Avatar className="h-12 w-12">
              <AvatarImage src={selectedUser.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                {selectedUser.full_name?.slice(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-base">{selectedUser.full_name}</h2>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${ROLE_COLOR[selectedUser.role] || ROLE_COLOR.student}`}>
                  {selectedUser.role || 'student'}
                </span>
              </div>
              <p className="text-white/40 text-xs">{selectedUser.email}</p>
              <p className="text-white/25 text-xs mt-0.5">
                Joined {selectedUser.created_date ? formatDistanceToNow(new Date(selectedUser.created_date), { addSuffix: true }) : 'unknown'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => setShowWarnInput(v => !v)}
                className="bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 gap-1.5 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Warn User
              </Button>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-white/30 hover:text-white rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Warning input */}
          {showWarnInput && (
            <div className="px-5 py-3 border-b border-white/8 bg-amber-500/5 flex gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-2" />
              <Input
                placeholder="Warning message to send to user..."
                value={warningMsg}
                onChange={e => setWarningMsg(e.target.value)}
                className="flex-1 bg-white/5 border-amber-500/30 text-white placeholder:text-white/30 text-sm h-8"
              />
              <Button
                size="sm"
                onClick={sendWarning}
                disabled={actionLoading === 'warn' || !warningMsg.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0 gap-1.5 text-xs flex-shrink-0"
              >
                {actionLoading === 'warn' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Send
              </Button>
              <button onClick={() => { setShowWarnInput(false); setWarningMsg(''); }} className="text-white/30 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Posts */}
          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Posts ({userPosts.length})
            </h3>

            {loadingPosts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
              </div>
            ) : userPosts.length === 0 ? (
              <p className="text-white/25 text-sm text-center py-10">No posts by this user</p>
            ) : (
              <div className="space-y-3">
                {userPosts.map(post => (
                  <div key={post.id} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm leading-relaxed line-clamp-3">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="mt-2 h-20 w-32 object-cover rounded-lg opacity-70" />
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-white/25 text-xs">
                          {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : ''}
                        </span>
                        <span className="text-white/25 text-xs">❤️ {post.like_count || 0}</span>
                        <span className="text-white/25 text-xs">💬 {post.comment_count || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post)}
                      disabled={actionLoading === post.id}
                      title="Delete post"
                      className="flex-shrink-0 p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {actionLoading === post.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/8 bg-[#0d1220]">
          <div className="text-center">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Select a user to view their profile & posts</p>
          </div>
        </div>
      )}
    </div>
  );
}