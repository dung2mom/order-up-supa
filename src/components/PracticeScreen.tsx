import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Mic, RotateCcw, ArrowRight, Snail, Check, Sparkles, Keyboard } from 'lucide-react';
import { DialogueItem, FeedbackData, MicState, SentenceResult } from '../types';
import { CafeIllustration } from './CafeIllustration';
import { ChunkingPractice } from './ChunkingPractice';
import {
  compareTranscript,
  generateElicitationHint,
  ComparisonEvaluation,
} from '../utils/textComparison';
import {
  speechSynthesizer,
  SpeechRecognitionSession,
  isSpeechRecognitionSupported,
  VoiceRecorder,
} from '../utils/speech';
import { FEEDBACK_FALLBACKS } from '../data/dialogue';
import { AudioPlaybackPlayer } from './AudioPlaybackPlayer';

interface PracticeScreenProps {
  dialogue: DialogueItem;
  currentIndex: number;
  totalCount: number;
  onSentenceComplete: (result: SentenceResult) => void;
  onOpenNotice: (type: 'not_supported' | 'mic_denied') => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  dialogue,
  currentIndex,
  totalCount,
  onSentenceComplete,
  onOpenNotice,
}) => {
  const [micState, setMicState] = useState<MicState>('ready');
  const [transcript, setTranscript] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [tapCount, setTapCount] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<ComparisonEvaluation | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isChunkingActive, setIsChunkingActive] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const currentSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Monitor SpeechSynthesizer state to disable mic
  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = speechSynthesizer.subscribe((speaking) => {
      setIsSynthesizing(speaking);
    });
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      speechSynthesizer.stop();
      currentSessionRef.current?.abort();
      voiceRecorderRef.current?.abort();
    };
  }, []);

  // Safety watchdog: ensure micState cannot stay stuck in 'checking' under any circumstance
  useEffect(() => {
    if (micState === 'checking') {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setMicState('ready');
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [micState]);

  // Play Mia's question automatically upon entering this turn
  useEffect(() => {
    speechSynthesizer.stop();
    currentSessionRef.current?.abort();
    voiceRecorderRef.current?.abort();
    setMicState('ready');
    setTranscript('');
    setAttemptCount(0);
    setTapCount(0);
    setEvaluation(null);
    setFeedback(null);
    setIsChunkingActive(false);
    setRecordedAudioUrl(null);

    const timer = setTimeout(() => {
      speechSynthesizer.speak(dialogue.miaQuestion, { rate: 0.9 });
    }, 400);

    return () => clearTimeout(timer);
  }, [dialogue.id]);

  // Audio Playback Handlers
  const handlePlayMiaQuestion = () => {
    speechSynthesizer.speak(dialogue.miaQuestion, { rate: 0.9 });
  };

  const handlePlayTargetNormal = () => {
    speechSynthesizer.speak(dialogue.targetSentence, { rate: 0.9 });
  };

  const handlePlayTargetSlow = () => {
    speechSynthesizer.speak(dialogue.targetSentence, { rate: 0.7 });
  };

  // Synchronous instant pedagogical rule feedback (switches immediately)
  const getInstantFeedback = (
    evalResult: ComparisonEvaluation,
    spoken: string,
    currentAttempt: number
  ): FeedbackData => {
    if (evalResult.isSuccess) {
      if (evalResult.hasMissingSmallWordsOnly) {
        const missingWord = evalResult.missingSmallWords[0] || 'please';
        return {
          text: FEEDBACK_FALLBACKS.smallWordMissing(missingWord),
          isAiGenerated: false,
          type: 'small_word_missing',
        };
      }
      return {
        text: FEEDBACK_FALLBACKS.success,
        isAiGenerated: false,
        type: 'success',
      };
    }

    if (!spoken.trim()) {
      return {
        text: FEEDBACK_FALLBACKS.silence,
        isAiGenerated: false,
        type: 'silence',
      };
    }

    if (currentAttempt === 1) {
      return {
        text: FEEDBACK_FALLBACKS.recast(dialogue.targetSentence),
        isAiGenerated: false,
        type: 'recast',
      };
    }

    if (currentAttempt === 2) {
      const { hintSentence, firstLetter } = generateElicitationHint(
        dialogue.targetSentence,
        evalResult.missingKeyWords.length > 0 ? evalResult.missingKeyWords : evalResult.missingWords
      );
      return {
        text: FEEDBACK_FALLBACKS.elicitation(hintSentence, firstLetter),
        isAiGenerated: false,
        type: 'elicitation',
      };
    }

    return {
      text: FEEDBACK_FALLBACKS.chunking,
      isAiGenerated: false,
      type: 'chunking',
    };
  };

  // Evaluate recognized speech with instant feedback and guaranteed quick release
  const handleEvaluateSpoken = useCallback(
    async (spoken: string) => {
      const cleanSpoken = (spoken || '').trim();
      const nextAttempt = attemptCount + 1;
      setAttemptCount(nextAttempt);

      // 1. Instant comparison against target sentence
      const evalResult = compareTranscript(
        dialogue.targetSentence,
        cleanSpoken,
        dialogue.keyWords
      );
      setEvaluation(evalResult);

      // 2. Immediate pedagogical feedback based on Krashen & Lyster-Ranta rules
      const instantFeedback = getInstantFeedback(evalResult, cleanSpoken, nextAttempt);
      setFeedback(instantFeedback);

      if (nextAttempt >= 3 && !evalResult.isSuccess) {
        setIsChunkingActive(true);
      }

      // 3. Quick visual feedback pulse (300ms) then GUARANTEE micState returns to 'ready'
      setMicState('checking');
      await new Promise((r) => setTimeout(r, 300));
      if (isMountedRef.current) {
        setMicState('ready');
      }

      // 4. Recast audio speak after feedback shown (attempt 1)
      if (nextAttempt === 1 && !evalResult.isSuccess && cleanSpoken) {
        setTimeout(() => {
          if (isMountedRef.current) {
            speechSynthesizer.speak(dialogue.targetSentence, { rate: 0.85 });
          }
        }, 400);
      }

      // 5. In background, asynchronously query Gemini for extra tip without blocking user or mic
      if (cleanSpoken && (!evalResult.isSuccess || evalResult.hasMissingSmallWordsOnly)) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: dialogue.targetSentence,
              recognized: cleanSpoken,
              missingWords:
                evalResult.missingKeyWords.length > 0
                  ? evalResult.missingKeyWords
                  : evalResult.missingWords,
              attempt: nextAttempt,
              isSuccess: evalResult.isSuccess,
              hasSmallWordMissingOnly: evalResult.hasMissingSmallWordsOnly,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data?.feedback && isMountedRef.current) {
              setFeedback((prev) =>
                prev ? { ...prev, text: data.feedback, isAiGenerated: true } : prev
              );
            }
          }
        } catch {
          // Gracefully retain pedagogical fallback
        }
      }
    },
    [attemptCount, dialogue]
  );

  // Mic Button Click Handler
  const handleMicToggle = () => {
    // If synthesizer is speaking, stop it immediately so student can speak
    if (isSynthesizing) {
      speechSynthesizer.stop();
      setIsSynthesizing(false);
    }

    if (!isSpeechRecognitionSupported()) {
      onOpenNotice('not_supported');
      return;
    }

    if (micState === 'listening') {
      currentSessionRef.current?.stop();
      voiceRecorderRef.current?.stop().then((url) => {
        if (url && isMountedRef.current) {
          setRecordedAudioUrl(url);
        }
      });
      return;
    }

    if (micState === 'checking') {
      // Force release if tapped during checking
      setMicState('ready');
      return;
    }

    speechSynthesizer.stop();
    setTapCount((prev) => prev + 1);
    setTranscript('');
    setRecordedAudioUrl(null);
    setMicState('listening');

    // Start recording user's audio
    const recorder = new VoiceRecorder();
    voiceRecorderRef.current = recorder;
    recorder.start();

    const session = new SpeechRecognitionSession({
      onInterim: (interimText) => {
        if (isMountedRef.current) setTranscript(interimText);
      },
      onFinal: (finalText) => {
        if (!isMountedRef.current) return;
        voiceRecorderRef.current?.stop().then((url) => {
          if (url && isMountedRef.current) {
            setRecordedAudioUrl(url);
          }
        });
        const textToEval = (finalText || transcript).trim();
        handleEvaluateSpoken(textToEval);
      },
      onError: (errCode) => {
        if (!isMountedRef.current) return;
        voiceRecorderRef.current?.abort();
        setMicState('ready');
        if (errCode === 'not-allowed') {
          onOpenNotice('mic_denied');
        } else if (errCode === 'not-supported') {
          onOpenNotice('not_supported');
        }
      },
      onEnd: () => {
        if (isMountedRef.current) {
          setMicState((prev) => (prev === 'listening' ? 'ready' : prev));
        }
      },
    });

    currentSessionRef.current = session;
    session.start();
  };

  const handleNext = () => {
    speechSynthesizer.stop();
    currentSessionRef.current?.abort();
    setMicState('ready');
    const recordedTaps = Math.max(tapCount, attemptCount, 1);
    onSentenceComplete({
      dialogueId: dialogue.id,
      completed: true,
      skipped: false,
      attempts: Math.max(1, attemptCount),
      tapCount: recordedTaps,
      bestTranscript: transcript || dialogue.targetSentence,
      hadMissingSmallWordsOnly: evaluation?.hasMissingSmallWordsOnly,
      audioBlobUrl: recordedAudioUrl || undefined,
    });
  };

  const handleSkip = () => {
    speechSynthesizer.stop();
    currentSessionRef.current?.abort();
    setMicState('ready');
    onSentenceComplete({
      dialogueId: dialogue.id,
      completed: false,
      skipped: true,
      attempts: attemptCount,
      tapCount: tapCount,
      bestTranscript: transcript,
    });
  };

  const handleChunkingComplete = () => {
    setIsChunkingActive(false);
    const fullEval = compareTranscript(
      dialogue.targetSentence,
      dialogue.targetSentence,
      dialogue.keyWords
    );
    setEvaluation(fullEval);
    setFeedback({
      text: "Wonderful! You said all parts clearly!",
      isAiGenerated: false,
      type: 'success',
    });
  };

  const isSuccess = evaluation?.isSuccess;

  return (
    <div className="flex flex-col justify-between min-h-full flex-1 w-full px-4 sm:px-7 py-5 sm:py-6 space-y-4">
      {/* 1. Very Top: Progress Indicator */}
      <div className="w-full pt-1 pb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold tracking-wide text-[#9A3412] bg-[#FFF0E2] px-3.5 py-1.5 rounded-full border border-[#FCD8C1] shadow-2xs whitespace-nowrap">
              Sentence {currentIndex + 1} of {totalCount}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#8C7A73] bg-white/85 px-3 py-1.5 rounded-full border border-[#F4E2D2] shadow-2xs whitespace-nowrap">
              Taps: <strong className="text-[#EA580C] font-black">{tapCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {Array.from({ length: totalCount }).map((_, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={idx}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-7 bg-gradient-to-r from-[#FB923C] to-[#F97316] shadow-2xs'
                      : isPast
                      ? 'w-2.5 bg-[#84A98C]'
                      : 'w-2.5 bg-[#EFE3D5]'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={() => setShowKeyboardInput(!showKeyboardInput)}
            className="p-2 text-[#B29D95] hover:text-[#9A3412] rounded-xl hover:bg-[#FFF3E8] transition min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
            title="Keyboard test mode"
            aria-label="Toggle keyboard test mode"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top: Barista Mia's Speech Bubble (Soft-Edge Container) */}
      <div className="w-full">
        <div className="relative flex items-start gap-3.5 bg-white/95 rounded-[26px] p-4.5 sm:p-5 shadow-[0_6px_25px_rgb(251,146,60,0.05)] border border-[#FBE6D4]">
          <button
            onClick={handlePlayMiaQuestion}
            className="shrink-0 relative group focus:outline-hidden min-w-[48px] min-h-[48px]"
            title="Listen again"
            aria-label="Listen to Mia's question"
          >
            <CafeIllustration variant="barista" />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FB923C] text-white flex items-center justify-center text-[10px] shadow-xs group-hover:scale-110 transition">
              <Volume2 className="w-3 h-3" />
            </span>
          </button>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs sm:text-sm font-black text-[#9A3412]">
                Barista Mia
              </span>
              <span className="text-[11px] sm:text-xs text-[#A8958E] font-medium whitespace-nowrap">
                Tap to listen
              </span>
            </div>

            {/* Left-aligned question body text with 1.6 line-height */}
            <p className="text-left text-lg sm:text-xl font-bold text-[#431407] leading-[1.6] break-keep">
              &ldquo;{dialogue.miaQuestion}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 3. Middle: Target Sentence (Soft-Edge Pillowy Card) */}
      <div className="w-full flex flex-col items-center my-auto py-1">
        <div className="w-full bg-gradient-to-br from-white via-[#FFFDFB] to-[#FFF6ED] rounded-[30px] p-5 sm:p-6 shadow-[0_10px_35px_rgb(251,146,60,0.06)] border-2 border-[#FBE3D0] relative overflow-hidden">
          {/* Centered Heading & Badge */}
          <div className="text-center w-full mb-2">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Expression</span>
            </div>
          </div>

          {/* Interactive target sentence - Center aligned, fluid clamp typography, word-break: keep-all */}
          <div className="py-2.5 sm:py-3.5 text-center">
            <h2 className="text-fluid-target font-black text-[#431407] tracking-tight leading-[1.35] break-keep text-center">
              {evaluation ? (
                evaluation.wordAnalysis.map((item, i) => (
                  <span
                    key={i}
                    className={`inline-block mr-1.5 my-0.5 transition ${
                      !item.isMatched
                        ? 'bg-[#FEF3C7] text-[#78350F] px-2 py-0.5 rounded-lg underline decoration-[#F59E0B] decoration-3 underline-offset-4 shadow-2xs'
                        : 'text-[#431407]'
                    }`}
                  >
                    {item.originalWord}
                  </span>
                ))
              ) : (
                dialogue.targetSentence
              )}
            </h2>
          </div>

          {/* Audio Buttons: Soft pastel chips with min 44px touch targets */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2.5 pt-3.5 border-t border-[#F8E8DA]">
            <button
              onClick={handlePlayTargetNormal}
              disabled={isSynthesizing}
              className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FFF4E8] text-[#5C453E] font-bold text-sm sm:text-base shadow-2xs border border-[#FBE0C8] transition active:scale-95 disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4 text-[#EA580C] shrink-0" />
              <span>Listen</span>
            </button>

            <button
              onClick={handlePlayTargetSlow}
              disabled={isSynthesizing}
              className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FFF4E8] text-[#5C453E] font-bold text-sm sm:text-base shadow-2xs border border-[#FBE0C8] transition active:scale-95 disabled:opacity-50"
            >
              <Snail className="w-4 h-4 text-[#EA580C] shrink-0" />
              <span>Slow</span>
            </button>
          </div>
        </div>

        {/* 3rd Attempt Scaffolding Mode */}
        {isChunkingActive && (
          <div className="w-full mt-3.5">
            <ChunkingPractice
              chunks={dialogue.chunks}
              onComplete={handleChunkingComplete}
              onCancel={() => setIsChunkingActive(false)}
            />
          </div>
        )}

        {/* Keyboard Input Fallback Box */}
        {showKeyboardInput && (
          <div className="w-full mt-3 p-4 bg-white/95 rounded-2xl border border-[#FBE2CD] shadow-2xs">
            <p className="text-left text-sm font-semibold text-[#6E554F] mb-2 leading-[1.6]">
              Type to test sentence:
            </p>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={dialogue.targetSentence}
                className="flex-1 min-h-[42px] px-3.5 py-2 text-sm sm:text-base rounded-xl border border-[#F0D5C0] bg-[#FFFDFB] focus:outline-hidden focus:border-[#FB923C]"
              />
              <button
                onClick={() => {
                  if (manualText.trim()) {
                    setTapCount((prev) => prev + 1);
                    setTranscript(manualText.trim());
                    handleEvaluateSpoken(manualText.trim());
                  }
                }}
                className="min-h-[42px] px-5 py-2 bg-[#FB923C] hover:bg-[#F97316] text-white text-sm sm:text-base font-bold rounded-xl transition shadow-2xs shrink-0"
              >
                Test
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom: Large Soft-Edge Mic Button */}
      {!isChunkingActive && (
        <div className="w-full flex flex-col items-center py-2">
          <div className="relative flex items-center justify-center">
            {micState === 'listening' && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-[#FB7185]/30 animate-ping" />
                <div className="absolute w-32 h-32 rounded-full bg-[#FDBA74]/35 animate-soft-ring" />
              </>
            )}

            <button
              onClick={handleMicToggle}
              disabled={micState === 'checking'}
              aria-label={micState === 'listening' ? 'Stop listening' : 'Tap to speak'}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-[0_12px_30px_rgba(251,146,60,0.3)] transition transform active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                micState === 'listening'
                  ? 'bg-gradient-to-br from-[#FB7185] to-[#F43F5E] text-white ring-4 ring-[#FFE4E6]'
                  : micState === 'checking'
                  ? 'bg-[#FDBA74] text-white animate-spin'
                  : 'bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#FDBA74] text-white ring-4 ring-[#FFEAD8]'
              }`}
            >
              {micState === 'listening' ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1.5 h-4 bg-white rounded-full animate-bounce" />
                    <span className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              ) : micState === 'checking' ? (
                <RotateCcw className="w-8 h-8 animate-spin text-white" />
              ) : (
                <Mic className="w-9 h-9 text-white drop-shadow-xs" />
              )}
            </button>
          </div>

          {/* Three States Labels - Center Aligned */}
          <div className="text-center mt-2.5">
            {micState === 'ready' && (
              <p className="text-base sm:text-lg font-extrabold text-[#431407] text-center leading-[1.5]">
                Tap to speak
              </p>
            )}
            {micState === 'listening' && (
              <p className="text-base sm:text-lg font-extrabold text-[#E11D48] animate-pulse text-center leading-[1.5]">
                Listening…
              </p>
            )}
            {micState === 'checking' && (
              <p className="text-base sm:text-lg font-extrabold text-[#C2410C] text-center leading-[1.5]">
                Checking…
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. Below the Mic: Feedback Area (Pillowy Card, Left-aligned body text at 16px+) */}
      {evaluation && !isChunkingActive && (
        <div className="w-full bg-white/95 rounded-[26px] p-4.5 sm:p-5 shadow-[0_6px_25px_rgb(251,146,60,0.06)] border border-[#FBE4D2] mt-2 space-y-3 animate-in fade-in duration-200">
          {/* What you said - Left aligned */}
          <div className="flex items-start gap-2.5 text-left">
            <span className="px-3 py-1 rounded-full bg-[#FFF2E6] text-[#9A3412] text-xs sm:text-sm font-bold shrink-0 border border-[#FCDAC3] mt-0.5">
              What you said
            </span>
            <p className="text-left text-base sm:text-[17px] font-semibold text-[#431407] leading-[1.6] break-keep">
              &ldquo;{transcript || '(No speech detected)'}&rdquo;
            </p>
          </div>

          {/* Mia's Feedback Bubble - Left aligned body copy */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isSuccess
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
                  : 'bg-[#FFF9F2] border-[#FED7AA] text-[#7C2D12]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-2xs mt-0.5 ${
                  isSuccess ? 'bg-[#10B981]' : 'bg-[#FB923C]'
                }`}
              >
                {isSuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-sm sm:text-base">Mia&apos;s Feedback</span>
                  {feedback.isAiGenerated && (
                    <span className="text-[11px] font-bold text-[#9A3412] bg-[#FFE8D6] px-2.5 py-0.5 rounded-full">
                      AI Tip
                    </span>
                  )}
                </div>
                {/* Left-aligned feedback body text (>= 16px, line-height 1.6) */}
                <p className="text-left text-base sm:text-[17px] font-medium leading-[1.6] break-keep">
                  {feedback.text}
                </p>
              </div>
            </div>
          )}

          {/* User's Audio Recording Playback Player */}
          {recordedAudioUrl && (
            <div className="pt-1">
              <AudioPlaybackPlayer
                audioUrl={recordedAudioUrl}
                modelText={dialogue.targetSentence}
              />
            </div>
          )}
        </div>
      )}

      {/* 6. Very Bottom Action Bar */}
      <div className="w-full flex items-center justify-between gap-3 pt-3 mt-auto">
        {/* Try Again */}
        <button
          onClick={() => {
            speechSynthesizer.stop();
            currentSessionRef.current?.abort();
            setMicState('ready');
            setTranscript('');
            setRecordedAudioUrl(null);
            setEvaluation(null);
            setFeedback(null);
            setIsChunkingActive(false);
          }}
          className="flex-1 min-h-[50px] py-3.5 px-4 rounded-2xl bg-white hover:bg-[#FFF9F2] text-[#6E554F] font-bold text-sm sm:text-base border border-[#F8DEC9] shadow-2xs flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4 text-[#9A3412] shrink-0" />
          <span>Try Again</span>
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className={`flex-1 min-h-[50px] py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition transform active:scale-95 whitespace-nowrap ${
            isSuccess
              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:brightness-105 text-white ring-4 ring-[#D1FAE5] scale-102 animate-bounce'
              : 'bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 text-white shadow-[0_8px_20px_-4px_rgba(249,115,22,0.3)]'
          }`}
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Skip Link */}
      <div className="text-center mt-1 pb-1">
        <button
          onClick={handleSkip}
          className="text-[#A8958E] hover:text-[#6E554F] text-sm font-semibold underline underline-offset-4 transition py-1 px-3"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
