import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Heart, BookOpen, FileText, HelpCircle, Package, Cpu, FileImage, Monitor, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export const CAT_CONFIG = {
  textbook:   { label: 'Textbook',      icon: BookOpen,   color: 'bg-blue-100 text-blue-700',    grad: 'from-blue-400 to-blue-600' },
  notes:      { label: 'Notes',         icon: FileText,   color: 'bg-green-100 text-green-700',  grad: 'from-green-400 to-emerald-600' },
  past_questions: { label: 'Past Questions', icon: HelpCircle, color: 'bg-amber-100 text-amber-700', grad: 'from-amber-400 to-orange-500' },
  materials:  { label: 'Materials',     icon: Package,    color: 'bg-rose-100 text-rose-700',    grad: 'from-rose-400 to-pink-600' },
  gadgets:    { label: 'Gadgets',       icon: Cpu,        color: 'bg-violet-100 text-violet-700',grad: 'from-violet-400 to-purple-600' },
  handouts:   { label: 'Handouts',      icon: FileImage,  color: 'bg-cyan-100 text-cyan-700',    grad: 'from-cyan-400 to-blue-500' },
  course:     { label: 'Course',        icon: Monitor,    color: 'bg-purple-100 text-purple-700',grad: 'from-purple-400 to-violet-600' },
  tutorial:   { label: 'Tutorial',      icon: Tag,        color: 'bg-teal-100 text-teal-700',    grad: 'from-teal-400 to-green-600' },
};

export const COND_COLORS = {
  new:      'bg-green-100 text-green-700',
  like_new: 'bg-emerald-100 text-emerald-700',
  good:     'bg-blue-100 text-blue-700',
  fair:     'bg-amber-100 text-amber-700',
};

export default function ItemCard({ item, index, onClick }) {
  const cfg = CAT_CONFIG[item.category] || CAT_CONFIG.textbook;
  const Icon = cfg.icon;
  const si = item.seller_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card onClick={onClick} className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer border-border/60">
        {/* Image / Placeholder */}
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${cfg.grad} flex items-center justify-center opacity-80`}>
              <Icon className="w-14 h-14 text-white/70" />
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <Badge className={`text-[10px] border-0 ${cfg.color}`}>{cfg.label}</Badge>
            {item.is_digital && <Badge className="bg-primary text-white border-0 text-[10px]">Digital</Badge>}
          </div>
          {item.condition && !item.is_digital && (
            <Badge className={`absolute top-2 right-2 text-[10px] border-0 ${COND_COLORS[item.condition] || ''}`}>
              {item.condition.replace('_', ' ')}
            </Badge>
          )}
          {item.status !== 'available' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-red-500 text-white border-0 text-sm px-3 py-1">{item.status === 'sold' ? 'SOLD' : 'Reserved'}</Badge>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{item.title}</h3>
          {item.subject && <p className="text-[11px] text-muted-foreground">{item.subject} {item.grade_level ? `· ${item.grade_level}` : ''}</p>}

          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-5 w-5 flex-shrink-0">
              <AvatarImage src={item.seller_avatar} />
              <AvatarFallback className="gradient-brand text-white text-[9px]">{si}</AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate">{item.seller_name}</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xl font-black text-primary">${Number(item.price).toFixed(2)}</span>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />{item.views || 0}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}