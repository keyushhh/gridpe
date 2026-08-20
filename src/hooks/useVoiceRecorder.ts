import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceRecorderState = 'idle' | 'recording' | 'processing' | 'error';

export interface UseVoiceRecorderOptions {
  /** Optional max recording duration in milliseconds (defaults to 30,000 ms / 30s) */
  maxDurationMs?: number;
  /** Optional audio timeslice in milliseconds for MediaRecorder chunking */
  timeSliceMs?: number;
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecorderState;
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  reset: () => void;
  mimeType: string;
}

/**
 * Returns the best MIME type supported by the current browser / WebView environment.
 * Sarvam Saaras STT natively supports WAV, MP3, AAC, OGG, FLAC, and WebM (Opus).
 */
export const getSupportedAudioMimeType = (): string => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return '';
  }

  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/wav',
  ];

  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
};

/**
 * Reusable hook for capturing voice audio via Web MediaRecorder API.
 * Designed for cross-platform compatibility (Capacitor Android/iOS WebViews & Web).
 */
export const useVoiceRecorder = (options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn => {
  const { maxDurationMs = 30_000, timeSliceMs = 250 } = options;

  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      mediaStreamRef.current = null;
    }
  }, []);

  const cleanupTimers = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanupTimers();
    cleanupStream();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDurationMs(0);
    setError(null);
    setState('idle');
  }, [audioUrl, cleanupStream, cleanupTimers]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    reset();
    setError(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const errMsg = 'Microphone recording is not supported in this browser or environment.';
      setError(errMsg);
      setState('error');
      return false;
    }

    const selectedMimeType = getSupportedAudioMimeType();
    setMimeType(selectedMimeType);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      const recorderOptions: MediaRecorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupTimers();
        cleanupStream();

        const type = recorder.mimeType || selectedMimeType || 'audio/webm';
        const finalBlob = audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type })
          : null;

        if (finalBlob) {
          const url = URL.createObjectURL(finalBlob);
          setAudioBlob(finalBlob);
          setAudioUrl(url);
          setState('idle');
          if (stopResolverRef.current) {
            stopResolverRef.current(finalBlob);
            stopResolverRef.current = null;
          }
        } else {
          setState('idle');
          if (stopResolverRef.current) {
            stopResolverRef.current(null);
            stopResolverRef.current = null;
          }
        }
      };

      recorder.onerror = (event: Event) => {
        cleanupTimers();
        cleanupStream();
        const errMessage = (event as any)?.error?.message || 'Recording encountered an error.';
        setError(errMessage);
        setState('error');
        if (stopResolverRef.current) {
          stopResolverRef.current(null);
          stopResolverRef.current = null;
        }
      };

      recorder.start(timeSliceMs);
      startTimeRef.current = Date.now();
      setState('recording');

      durationTimerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 100);

      if (maxDurationMs > 0) {
        maxDurationTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopRecording();
          }
        }, maxDurationMs);
      }

      return true;
    } catch (err: unknown) {
      cleanupTimers();
      cleanupStream();

      let friendlyMsg = 'Failed to access microphone.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          friendlyMsg = 'Microphone permission was denied. Please allow microphone access in settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          friendlyMsg = 'No microphone device was found.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          friendlyMsg = 'Microphone is currently in use by another application.';
        }
      } else if (err instanceof Error) {
        friendlyMsg = err.message;
      }

      setError(friendlyMsg);
      setState('error');
      return false;
    }
  }, [reset, cleanupTimers, cleanupStream, timeSliceMs, maxDurationMs]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      cleanupTimers();

      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        cleanupStream();
        setState('idle');
        resolve(null);
        return;
      }

      setState('processing');
      stopResolverRef.current = resolve;

      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        cleanupStream();
        setError(err instanceof Error ? err.message : 'Error stopping recording');
        setState('error');
        resolve(null);
      }
    });
  }, [cleanupTimers, cleanupStream]);

  const cancelRecording = useCallback(() => {
    cleanupTimers();
    cleanupStream();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // detach onstop so we don't save the aborted recording
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (stopResolverRef.current) {
      stopResolverRef.current(null);
      stopResolverRef.current = null;
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setDurationMs(0);
    setState('idle');
  }, [cleanupTimers, cleanupStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
      cleanupStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanupTimers, cleanupStream, audioUrl]);

  return {
    state,
    isRecording: state === 'recording',
    audioBlob,
    audioUrl,
    durationMs,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    mimeType,
  };
};
