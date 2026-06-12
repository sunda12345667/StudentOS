import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Send, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VoiceRecorder({ onSend, onCancel }) {
  const [phase, setPhase] = useState('recording'); // recording | preview | uploading
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const blobRef = useRef(null);

  // Start recording immediately on mount
  useEffect(() => {
    startRecording();
    return () => {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setPhase('preview');
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const handleSend = async () => {
    if (!blobRef.current) return;
    setPhase('uploading');
    const file = new File([blobRef.current], `voice-${Date.now()}.webm`, { type: blobRef.current.type });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onSend({ attachment_url: file_url, attachment_type: 'audio', attachment_name: `Voice message (${formatTime(seconds)})`, content: '🎤 Voice message' });
  };

  if (permissionDenied) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-2xl text-sm text-destructive">
        <Mic className="w-4 h-4 flex-shrink-0" />
        <span>Microphone access denied. Please allow it in your browser settings.</span>
        <button onClick={onCancel} className="ml-auto"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/70 border border-border rounded-2xl">
      {phase === 'recording' && (
        <>
          <div className="flex items-center gap-2 flex-1">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-mono text-destructive">{formatTime(seconds)}</span>
            <span className="text-xs text-muted-foreground">Recording...</span>
          </div>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={stopRecording}>
            <Square className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </>
      )}

      {phase === 'preview' && (
        <>
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
          )}
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={togglePlayback}>
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Voice • </span>
            <span className="font-mono">{formatTime(seconds)}</span>
          </div>
          <Button type="button" size="icon" className="h-8 w-8 gradient-brand" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </>
      )}

      {phase === 'uploading' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Sending voice message...</span>
        </>
      )}
    </div>
  );
}