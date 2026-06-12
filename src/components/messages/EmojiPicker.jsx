import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = {
  '😊 Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🥴','😬','🙄','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬'],
  '👋 People': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','💪','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄'],
  '❤️ Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️'],
  '🎉 Activities': ['🎉','🎊','🎈','🎁','🎀','🎗','🎟','🎫','🎖','🏆','🥇','🥈','🥉','🏅','🎯','🎮','🕹','🎲','🧩','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🥁','🪘'],
  '📚 School': ['📚','📖','📝','✏️','🖊','🖋','📓','📔','📒','📕','📗','📘','📙','📜','📄','📃','📑','🗒','📊','📈','📉','🗓','📅','📆','🔬','🔭','📡','💻','🖥','🖨','⌨️','🖱','🧮','📱','📞','☎️','📟','📠'],
  '🌟 Symbols': ['⭐','🌟','💫','✨','🌈','🔥','💥','🎆','🎇','☀️','🌤','⛅','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','🌬','💨','🌀','🌪','🌫','🌂','☂️','⛱','⚡','🌊','💧','💦','🫧'],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-border px-2 pt-2 gap-1 scrollbar-hide">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'flex-shrink-0 text-xs px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap',
              activeCategory === cat ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {cat.split(' ')[0]}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); }}
            className="text-xl p-1 rounded hover:bg-muted transition-colors leading-none"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}