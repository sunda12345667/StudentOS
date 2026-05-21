import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Plus, Smile, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PremiumMessageInput({ value, onChange, onSubmit, disabled, inputRef }) {
  const textareaRef = useRef(null);
  const hasMessage = useMemo(() => value.trim().length > 0, [value]);

  // Auto-resize textarea (preserve cursor position)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Save cursor position
    const cursorStart = textarea.selectionStart;
    const cursorEnd = textarea.selectionEnd;
    
    // Resize
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 100);
    textarea.style.height = newHeight + 'px';
    
    // Restore cursor position
    textarea.setSelectionRange(cursorStart, cursorEnd);
  }, [value]);

  const handleChange = useCallback((e) => {
    onChange(e);
  }, [onChange]);

  const handleTextareaRef = useCallback((r) => {
    textareaRef.current = r;
    if (inputRef) inputRef.current = r;
  }, [inputRef]);

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm'
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
            'flex-1 rounded-2xl px-4 py-2',
            'bg-muted/70 border border-muted',
            'focus-within:border-primary/30 focus-within:bg-muted',
            'focus-within:ring-2 focus-within:ring-primary/10'
          )}
        >
          <textarea
            ref={handleTextareaRef}
            value={value}
            onChange={handleChange}
            placeholder="Message..."
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none',
              'placeholder:text-muted-foreground/50 disabled:opacity-50'
            )}
            rows={1}
            style={{ 
              maxHeight: '100px',
              WebkitAppearance: 'none'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            inputMode="text"
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
        {hasMessage ? (
          <Button
            type="submit"
            size="icon"
            className={cn(
              'h-9 w-9 gradient-brand flex-shrink-0',
              'hover:shadow-lg hover:shadow-primary/20 active:scale-95'
            )}
            disabled={!hasMessage || disabled}
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