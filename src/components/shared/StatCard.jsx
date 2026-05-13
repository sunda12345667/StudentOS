import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, color, bgColor, trend }) {
  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", bgColor)}>
        {Icon && <Icon className={cn("w-6 h-6", color)} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {trend !== undefined && (
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
          trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </Card>
  );
}