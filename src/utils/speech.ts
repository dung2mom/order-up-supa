/**
 * Web Speech API wrappers for SpeechRecognition and SpeechSynthesis
 * Adheres strictly to Section 8 & 9 (Technical Requirements):
 * - SpeechRecognition en-US
 * - SpeechSynthesis en-US (normal: 0.9, slow: 0.7)
 * - Disable mic while model audio is speaking
 * - Silence detector (~1.5s)
 * - Safe detection of in-app browsers and Chrome recommendation
 */

type SpeechRecognitionType = any;

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const inAppPatterns = [
    /KAKAOTALK/i,
    /Instagram/i,
    /NAVER/i,
    /Line/i,
    /FB_IAB/i,
    /FB4A/i,
    /FBAV/i,
    /Twitter/i,
    /Snapchat/i,
  ];
  return inAppPatterns.some(pattern => pattern.test(ua));
}

export function isChromeBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isChromium = (window as any).chrome !== undefined;
  const isOpera = ua.includes('OPR') || ua.includes('Opera');
  const isEdge = ua.includes('Edg');
  const isBrave = (navigator as any).brave !== undefined;
  return isChromium && !isOpera && !isEdge && !isBrave;
}

class SpeechSynthesizer {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  private safetyTimer: any = null;

  public subscribe(listener: (speaking: boolean) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(speaking: boolean) {
    this.isSpeakingState = speaking;
    this.listeners.forEach(fn => fn(speaking));
  }

  public get isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public stop() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
      (window as any).__activeMiaUtterance = null;
      this.notify(false);
    }
  }

  public speak(
    text: string,
    options: {
      rate?: number; // default 0.9, slow 0.7
      pitch?: number;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1.0;

      // Select natural English voice if possible
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(
        v => (v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Jenny') || v.name.includes('Karen') || v.name.includes('Natural')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      let isFinished = false;
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        if (this.safetyTimer) {
          clearTimeout(this.safetyTimer);
          this.safetyTimer = null;
        }
        this.currentUtterance = null;
        (window as any).__activeMiaUtterance = null;
        this.notify(false);
        options.onEnd?.();
        resolve();
      };

      utterance.onstart = () => {
        this.notify(true);
        options.onStart?.();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      // Retain global reference to avoid GC drop in Chrome/Safari
      this.currentUtterance = utterance;
      (window as any).__activeMiaUtterance = utterance;

      // Fallback safety timer in case browser drops speech onend event
      const wordCount = text.trim().split(/\s+/).length;
      const maxDuration = Math.max(2500, Math.min(8000, wordCount * 650 + 1500));
      this.safetyTimer = setTimeout(finish, maxDuration);

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    });
  }
}

export const speechSynthesizer = new SpeechSynthesizer();

/**
 * Speech Recognition Controller with auto silence detection (1.5s)
 */
export class SpeechRecognitionSession {
  private recognition: SpeechRecognitionInstance | null = null;
  private silenceTimer: any = null;
  private maxDurationTimer: any = null;
  private stopSafetyTimer: any = null;
  private hasReceivedSpeech = false;
  private lastTranscript = '';
  private isRunning = false;
  private hasCompleted = false;

  private onInterimCallback?: (text: string) => void;
  private onFinalCallback?: (text: string) => void;
  private onErrorCallback?: (errCode: string, message: string) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;

  constructor(options: {
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
    onError?: (errCode: string, message: string) => void;
    onEnd?: () => void;
    onStart?: () => void;
  }) {
    this.onInterimCallback = options.onInterim;
    this.onFinalCallback = options.onFinal;
    this.onErrorCallback = options.onError;
    this.onEndCallback = options.onEnd;
    this.onStartCallback = options.onStart;

    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecConstructor: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecConstructor() as SpeechRecognitionInstance;
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false; // We use silence detector and single sentence practice
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isRunning = true;
      this.hasCompleted = false;
      this.hasReceivedSpeech = false;
      this.lastTranscript = '';
      this.onStartCallback?.();

      // Max total session duration (7.5s) to guarantee no indefinite listening
      this.maxDurationTimer = setTimeout(() => {
        if (this.isRunning) {
          this.stop();
        }
      }, 7500);
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptPart = item[0]?.transcript || '';
        if (item.isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const activeText = (final || interim).trim();
      if (activeText) {
        this.hasReceivedSpeech = true;
        this.lastTranscript = activeText;
        this.onInterimCallback?.(activeText);

        // Reset silence timer on every new speech chunk: ~1.4s auto stop
        this.resetSilenceTimer();
      }
    };

    this.recognition.onerror = (event: any) => {
      this.clearAllTimers();
      const error = event?.error || 'unknown';
      console.warn('SpeechRecognition error:', error);

      if (this.hasCompleted) return;

      if (error === 'no-speech') {
        // If user didn't speak in time, treat as empty final transcript cleanly
        this.finish(this.lastTranscript);
        return;
      }

      this.hasCompleted = true;
      this.isRunning = false;

      if (error === 'not-allowed' || error === 'service-not-allowed') {
        this.onErrorCallback?.(
          'not-allowed',
          'Please allow microphone access. You can change permissions from the site settings icon in the address bar.'
        );
      } else {
        this.onErrorCallback?.(error, event?.message || 'Speech recognition encountered an issue.');
      }
    };

    this.recognition.onend = () => {
      this.clearAllTimers();
      this.finish(this.lastTranscript);
    };
  }

  private finish(text: string) {
    if (this.hasCompleted) return;
    this.hasCompleted = true;
    this.clearAllTimers();
    this.isRunning = false;

    this.onFinalCallback?.(text);
    this.onEndCallback?.();
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.silenceTimer = setTimeout(() => {
      // 1.4 seconds of silence passed after speech was heard -> stop automatically
      if (this.isRunning) {
        this.stop();
      }
    }, 1400);
  }

  private clearAllTimers() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.stopSafetyTimer) {
      clearTimeout(this.stopSafetyTimer);
      this.stopSafetyTimer = null;
    }
  }

  public start() {
    if (!this.recognition) {
      this.onErrorCallback?.(
        'not-supported',
        "Microphone practice works best in Google Chrome. Please open this app in Chrome."
      );
      return;
    }

    try {
      this.hasCompleted = false;
      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start exception:', e);
      try {
        this.recognition.abort();
        setTimeout(() => {
          this.hasCompleted = false;
          this.recognition?.start();
        }, 150);
      } catch {
        // ignore
      }
    }
  }

  public stop() {
    this.clearAllTimers();
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }

      // If browser onend does not fire within 400ms after stop, force finish
      this.stopSafetyTimer = setTimeout(() => {
        this.finish(this.lastTranscript);
      }, 400);
    } else {
      this.finish(this.lastTranscript);
    }
  }

  public abort() {
    this.clearAllTimers();
    this.hasCompleted = true;
    this.isRunning = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }
  }
}

/**
 * In-memory client-side Voice Recorder for student playback
 * Records the user's voice during speaking turns and produces a local Blob URL.
 * Recordings remain strictly in browser memory and are never uploaded.
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  public async start(): Promise<boolean> {
    if (!VoiceRecorder.isSupported()) return false;

    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      return true;
    } catch (err) {
      console.warn('VoiceRecorder start error:', err);
      this.cleanup();
      return false;
    }
  }

  public stop(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      let isResolved = false;
      const finishResolve = (url: string | null) => {
        if (isResolved) return;
        isResolved = true;
        this.cleanup();
        resolve(url);
      };

      // 600ms safety timeout in case onstop never fires
      const timeoutId = setTimeout(() => {
        finishResolve(null);
      }, 600);

      this.mediaRecorder.onstop = () => {
        clearTimeout(timeoutId);
        try {
          if (this.audioChunks.length > 0) {
            const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
            const blob = new Blob(this.audioChunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            finishResolve(url);
          } else {
            finishResolve(null);
          }
        } catch {
          finishResolve(null);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        clearTimeout(timeoutId);
        finishResolve(null);
      }
    });
  }

  public abort() {
    this.cleanup();
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

