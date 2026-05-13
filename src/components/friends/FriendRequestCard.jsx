import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function FriendRequestCard({ request, onAccept, onDecline }) {
  const initials = request.from_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="aspect-square bg-secondary relative">
        <Avatar className="w-full h-full rounded-none">
          <AvatarImage src={request.from_avatar} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary rounded-none text-4xl">{initials}</AvatarFallback>
        </Avatar>
      </div>
      <div className="p-3 space-y-2">
        <Link to={`/profile/${request.from_email}`} className="font-semibold text-sm hover:underline block truncate">
          {request.from_name}
        </Link>
        <Button className="w-full h-8 text-sm" onClick={() => onAccept(request)}>
          Confirm
        </Button>
        <Button variant="secondary" className="w-full h-8 text-sm" onClick={() => onDecline(request)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}