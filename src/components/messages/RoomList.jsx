import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, GraduationCap, Search, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoomList({ rooms, selectedId, onSelect, loading }) {
  const [search, setSearch] = useState('');

  const filtered = rooms.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const courses = filtered.filter(r => r.roomType === 'course');
  const groups = filtered.filter(r => r.roomType === 'group');

  const RoomItem = ({ room }) => (
    <button
      onClick={() => onSelect(room)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
        selectedId === room.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        room.roomType === 'course' ? 'bg-green-500/10' : 'bg-indigo-500/10')}>
        {room.roomType === 'course'
          ? <BookOpen className="w-4 h-4 text-green-500" />
          : <GraduationCap className="w-4 h-4 text-indigo-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{room.name}</p>
        <p className="text-xs text-muted-foreground truncate">{room.member_count || 0} members</p>
      </div>
      <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="pl-8 bg-muted border-0 rounded-full h-8 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Loading rooms...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            {search ? 'No rooms found' : 'No rooms available yet'}
          </div>
        ) : (
          <>
            {courses.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">Courses</p>
                {courses.map(r => <RoomItem key={r.id} room={r} />)}
              </div>
            )}
            {groups.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">Campus Groups</p>
                {groups.map(r => <RoomItem key={r.id} room={r} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}