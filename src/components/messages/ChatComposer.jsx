import React, { useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Plus, Smile, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatComposer({ value, onChange, onSubmit, disabled, inputRef, onAfterSend, onFocusChange }) {
  const textareaRef = useRef(null);
  const hasMessage = value.trim().length > 0;

  // Auto-resize textarea without touching focus/selection
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Save cursor position before resize
    const { selectionStart, selectionEnd } = textarea;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    // Restore cursor (prevents focus jump on mobile)
    textarea.setSelectionRange(selectionStart, selectionEnd);
  }, [value]);

  // Stable ref callback — never recreated so textarea never unmounts
  const handleTextareaRef = useCallback((r) => {
    textareaRef.current = r;
    if (inputRef) inputRef.current = r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called after send — restore focus on mobile without scroll jump
  const refocusInput = useCallback(() => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
    });
  }, []);

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm'
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', touchAction: 'manipulation' }}
    >
      <form onSubmit={(e) => { onSubmit(e); refocusInput(); }} className="flex items-end gap-2 p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          style={{ touchAction: 'manipulation' }}
        >
          <Plus className="w-4 h-4" />
        </Button>

        <div
          className={cn(
            'flex-1 rounded-2xl px-4 py-2',
            'bg-muted/70 border border-muted',
            'focus-within:border-primary/30 focus-within:bg-muted',
            'focus-within:ring-2 focus-within:ring-primary/10'
          )}
        >
          <textarea
            ref={handleTextareaRef}
            value={value}
            onChange={onChange}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            placeholder="Message..."
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none',
              'placeholder:text-muted-foreground/50 disabled:opacity-50'
            )}
            rows={1}
            style={{ maxHeight: '100px' }}
            inputMode="text"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          style={{ touchAction: 'manipulation' }}
        >
          <Smile className="w-4 h-4" />
        </Button>

        {hasMessage ? (
          <Button
            type="submit"
            size="icon"
            className={cn(
              'h-9 w-9 gradient-brand flex-shrink-0',
              'hover:shadow-lg hover:shadow-primary/20 active:scale-95'
            )}
            disabled={!hasMessage || disabled}
            onMouseDown={e => e.preventDefault()}
            style={{ touchAction: 'manipulation' }}
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
            onMouseDown={e => e.preventDefault()}
            style={{ touchAction: 'manipulation' }}
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
  );
}