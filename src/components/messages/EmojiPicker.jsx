import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = {
  '😊': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🥴','😬','🙄','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬'],
  '👋': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','💪','👀','👁','👅','👄'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  '🎉': ['🎉','🎊','🎈','🎁','🎀','🏆','🥇','🥈','🥉','🏅','🎯','🎮','🕹','🎲','🧩','🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🥁'],
  '📚': ['📚','📖','📝','✏️','🖊','🖋','📓','📔','📒','📕','📗','📘','📙','📜','📄','📃','📑','📊','📈','📉','🗓','📅','📆','🔬','🔭','💻','🖥','📱','📞'],
  '🌟': ['⭐','🌟','💫','✨','🌈','🔥','💥','☀️','⛅','🌧','❄️','💨','🌊','💧','🌍','🌙','🍎','🍕','🚀','🎓'],
};

const CATEGORY_LABELS = { '😊': 'Smileys', '👋': 'People', '❤️': 'Hearts', '🎉': 'Fun', '📚': 'School', '🌟': 'More' };

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('😊');
  const pickerRef = useRef(null);

  // Close on outside click/touch — fires on both mouse and touch
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Use capture so it fires before React synthetic events
    document.addEventListener('mousedown', handler, true);
    document.addEventListener('touchstart', handler, true);
    return () => {
      document.removeEventListener('mousedown', handler, true);
      document.removeEventListener('touchstart', handler, true);
    };
  }, [onClose]);

  return (
    /*
     * Position: fixed so it escapes any overflow:hidden parent and stays
     * in the viewport on all screen sizes. We anchor it above the toolbar
     * using bottom + right via inline style set by the parent.
     * The parent passes these via the `style` prop when rendering this component.
     */
    <div
      ref={pickerRef}
      className="fixed bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{
        bottom: 'var(--emoji-picker-bottom, 72px)',
        right: 'var(--emoji-picker-right, 12px)',
        width: 'min(288px, calc(100vw - 24px))',
        zIndex: 9999,
      }}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {/* Category tabs — emoji icons, no text labels, never overflow */}
      <div className="flex border-b border-border bg-muted/40 px-1 pt-1 pb-0 gap-0.5">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            type="button"
            title={CATEGORY_LABELS[cat]}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex-1 text-lg py-1.5 rounded-t-lg transition-colors',
              activeCategory === cat
                ? 'bg-card border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid — fixed height, scrollable, no horizontal overflow */}
      <div className="p-2 grid grid-cols-8 gap-0.5 h-44 overflow-y-auto overflow-x-hidden overscroll-contain">
        {EMOJI_CATEGORIES[activeCategory].map(emoji => (
          <button
            key={emoji}
            type="button"
            title={emoji}
            onMouseDown={e => e.preventDefault()}
            onClick={() => onSelect(emoji)}
            className="text-xl p-1 rounded-lg hover:bg-muted active:scale-90 transition-all leading-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}