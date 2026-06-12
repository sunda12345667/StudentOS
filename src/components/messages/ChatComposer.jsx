import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Plus, Smile, Mic, Loader2, X, FileText, Image as ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import EmojiPicker from './EmojiPicker';
import AttachmentMenu from './AttachmentMenu';
import VoiceRecorder from './VoiceRecorder';

export default function ChatComposer({ value, onChange, onSubmit, disabled, inputRef, onAfterSend, onFocusChange, onSendAttachment }) {
  const textareaRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [attachPreview, setAttachPreview] = useState(null); // { file, type, previewUrl }
  const [uploading, setUploading] = useState(false);

  const hasMessage = value.trim().length > 0 || attachPreview;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    textarea.setSelectionRange(selectionStart, selectionEnd);
  }, [value]);

  const handleTextareaRef = useCallback((r) => {
    textareaRef.current = r;
    if (inputRef) inputRef.current = r;
  }, [inputRef]);

  const refocusInput = useCallback(() => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
  }, []);

  // Insert emoji at cursor position
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange({ target: { value: value + emoji } });
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    onChange({ target: { value: newValue } });
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      const pos = start + emoji.length;
      textarea.setSelectionRange(pos, pos);
    });
    setShowEmoji(false);
  };

  // Handle file selected from AttachmentMenu
  const handleFileSelected = (file, type) => {
    const isImage = type === 'image';
    const isVideo = type === 'video';
    const previewUrl = (isImage || isVideo) ? URL.createObjectURL(file) : null;
    setAttachPreview({ file, type, previewUrl });
    setShowAttach(false);
  };

  const removeAttachment = () => {
    if (attachPreview?.previewUrl) URL.revokeObjectURL(attachPreview.previewUrl);
    setAttachPreview(null);
  };

  // Send with optional attachment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!value.trim() && !attachPreview) || disabled || uploading) return;

    if (attachPreview) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: attachPreview.file });
      const attachType = attachPreview.file.type.startsWith('image/') ? 'image'
        : attachPreview.file.type.startsWith('video/') ? 'video'
        : attachPreview.file.name.endsWith('.pdf') ? 'pdf'
        : 'document';
      await onSendAttachment?.({
        content: value.trim() || attachPreview.file.name,
        attachment_url: file_url,
        attachment_type: attachType,
        attachment_name: attachPreview.file.name,
      });
      removeAttachment();
      onChange({ target: { value: '' } });
      setUploading(false);
    } else {
      onSubmit(e);
    }
    refocusInput();
  };

  // Handle voice message send
  const handleVoiceSend = async (voiceData) => {
    await onSendAttachment?.(voiceData);
    setShowVoice(false);
  };

  // Close popovers on outside click
  useEffect(() => {
    if (!showEmoji && !showAttach) return;
    const handler = (e) => {
      if (!e.target.closest('[data-composer-popover]')) {
        setShowEmoji(false);
        setShowAttach(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji, showAttach]);

  if (showVoice) {
    return (
      <div className="flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm p-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoice(false)} />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', touchAction: 'manipulation' }}
    >
      {/* Attachment preview strip */}
      {attachPreview && (
        <div className="flex items-center gap-2 px-3 pt-2">
          <div className="relative flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-sm max-w-[calc(100%-2rem)]">
            {attachPreview.previewUrl && attachPreview.type === 'image' ? (
              <img src={attachPreview.previewUrl} alt="preview" className="h-12 w-12 object-cover rounded-lg flex-shrink-0" />
            ) : attachPreview.previewUrl && attachPreview.type === 'video' ? (
              <video src={attachPreview.previewUrl} className="h-12 w-12 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
            )}
            <span className="truncate text-xs">{attachPreview.file.name}</span>
            <button type="button" onClick={removeAttachment} className="ml-auto flex-shrink-0 text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        {/* Plus / Attachment button */}
        <div className="relative flex-shrink-0" data-composer-popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 transition-colors", showAttach ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}
            disabled={disabled}
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setShowAttach(s => !s); setShowEmoji(false); }}
            style={{ touchAction: 'manipulation' }}
          >
            <Plus className="w-4 h-4" />
          </Button>
          {showAttach && (
            <AttachmentMenu onFileSelected={handleFileSelected} onClose={() => setShowAttach(false)} />
          )}
        </div>

        {/* Text input */}
        <div className={cn(
          'flex-1 rounded-2xl px-4 py-2',
          'bg-muted/70 border border-muted',
          'focus-within:border-primary/30 focus-within:bg-muted',
          'focus-within:ring-2 focus-within:ring-primary/10'
        )}>
          <textarea
            ref={handleTextareaRef}
            value={value}
            onChange={onChange}
            onFocus={() => { onFocusChange?.(true); setShowEmoji(false); setShowAttach(false); }}
            onBlur={() => onFocusChange?.(false)}
            placeholder="Message..."
            disabled={disabled || uploading}
            className={cn(
              'w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none',
              'placeholder:text-muted-foreground/50 disabled:opacity-50'
            )}
            rows={1}
            style={{ maxHeight: '100px' }}
            inputMode="text"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Emoji button */}
        <div className="relative flex-shrink-0" data-composer-popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 transition-colors", showEmoji ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}
            disabled={disabled}
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setShowEmoji(s => !s); setShowAttach(false); }}
            style={{ touchAction: 'manipulation' }}
          >
            <Smile className="w-4 h-4" />
          </Button>
          {showEmoji && (
            <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
          )}
        </div>

        {/* Send / Mic button */}
        {hasMessage ? (
          <Button
            type="submit"
            size="icon"
            className={cn('h-9 w-9 gradient-brand flex-shrink-0', 'hover:shadow-lg hover:shadow-primary/20 active:scale-95')}
            disabled={disabled || uploading}
            onMouseDown={e => e.preventDefault()}
            style={{ touchAction: 'manipulation' }}
          >
            {(disabled || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-primary flex-shrink-0"
            disabled={disabled}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowVoice(true)}
            style={{ touchAction: 'manipulation' }}
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
      </form>
    </div>
  );
}