import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Plus, Smile, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PremiumMessageInput({ value, onChange, onSubmit, disabled, inputRef }) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea (preserve cursor position)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Save cursor position
    const cursorStart = textarea.selectionStart;
    const cursorEnd = textarea.selectionEnd;
    
    // Resize
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    
    // Restore cursor position
    textarea.setSelectionRange(cursorStart, cursorEnd);
  }, [value]);

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-200',
        isFocused && 'bg-card/95'
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <form onSubmit={onSubmit} className="flex items-end gap-2 p-3">
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0"
          disabled={disabled}
        >
          <Plus className="w-4 h-4" />
        </Button>

        {/* Input field */}
        <div
          className={cn(
            'flex-1 rounded-2xl px-4 py-2 transition-all duration-200',
            'bg-muted/70 border border-muted focus-within:border-primary/30 focus-within:bg-muted',
            'focus-within:ring-2 focus-within:ring-primary/10'
          )}
        >
          <textarea
            ref={(r) => {
              textareaRef.current = r;
              if (inputRef) inputRef.current = r;
            }}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Message..."
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none',
              'placeholder:text-muted-foreground/50 disabled:opacity-50'
            )}
            rows={1}
            style={{ maxHeight: '100px' }}
          />
        </div>

        {/* Emoji button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0"
          disabled={disabled}
        >
          <Smile className="w-4 h-4" />
        </Button>

        {/* Voice/Send button */}
        {value.trim() ? (
          <Button
            type="submit"
            size="icon"
            className={cn(
              'h-9 w-9 gradient-brand flex-shrink-0 transition-all duration-200',
              'hover:shadow-lg hover:shadow-primary/20 active:scale-95'
            )}
            disabled={!value.trim() || disabled}
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0"
            disabled={disabled}
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
  );
}