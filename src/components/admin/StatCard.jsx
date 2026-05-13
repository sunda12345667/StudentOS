import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, sub, icon: Icon, trend, trendUp, color = 'blue', gradient }) {
  const colors = {
    blue:   'from-blue-600/20 to-blue-800/10 border-blue-500/20',
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-500/20',
    green:  'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20',
    amber:  'from-amber-500/20 to-amber-700/10 border-amber-500/20',
    pink:   'from-pink-600/20 to-pink-800/10 border-pink-500/20',
    cyan:   'from-cyan-600/20 to-cyan-800/10 border-cyan-500/20',
  };
  const iconColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    pink: 'bg-pink-500/20 text-pink-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <div className={cn(
      'relative rounded-2xl border bg-gradient-to-br p-5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
      colors[color]
    )}>
      {/* Glow */}
      <div className={cn('absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl',
        color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' :
        color === 'green' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' :
        color === 'pink' ? 'bg-pink-500' : 'bg-cyan-500'
      )} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">{label}</p>
          <p className="text-white text-2xl font-black tracking-tight">{value}</p>
          {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-semibold',
              trendUp ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconColors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}