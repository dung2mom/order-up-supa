import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, CheckCircle2 } from 'lucide-react';
import { speechSynthesizer, SpeechRecognitionSession } from '../utils/speech';
import { normalizeSentence, tokenizeWords } from '../utils/textComparison';

interface ChunkingPracticeProps {
  chunks: string[];
  onComplete: () => void;
  onCancel: () => void;
}

export const ChunkingPractice: React.FC<ChunkingPracticeProps> = ({
  chunks,
  onComplete,
  onCancel,
}) => {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [completedChunks, setCompletedChunks] = useState<boolean[]>(
    new Array(chunks.length).fill(false)
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chunkFeedback, setChunkFeedback] = useState<string | null>(null);

  const sessionRef = useRef<SpeechRecognitionSession | null>(null);

  useEffect(() => {
    return () => {
      speechSynthesizer.stop();
      sessionRef.current?.abort();
    };
  }, []);

  const currentChunk = chunks[currentChunkIndex] || '';

  const handleListenChunk = (chunkText: string) => {
    speechSynthesizer.speak(chunkText, { rate: 0.85 });
  };

  const handleStartChunkMic = () => {
    if (isListening) {
      sessionRef.current?.stop();
      setIsListening(false);
      return;
    }

    speechSynthesizer.stop();
    setTranscript('');
    setChunkFeedback(null);
    setIsListening(true);

    const session = new SpeechRecognitionSession({
      onInterim: (text) => setTranscript(text),
      onFinal: (finalText) => {
        setIsListening(false);
        const spoken = finalText || transcript;
        evaluateChunk(spoken);
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    sessionRef.current = session;
    session.start();
  };

  const evaluateChunk = (spoken: string) => {
    const normSpoken = normalizeSentence(spoken);
    const targetTokens = tokenizeWords(currentChunk);
    const spokenTokens = tokenizeWords(spoken);

    const matchedCount = targetTokens.filter(t => spokenTokens.includes(t) || normSpoken.includes(t)).length;
    const isChunkSuccess = matchedCount >= Math.max(1, Math.ceil(targetTokens.length * 0.5));

    if (isChunkSuccess || normSpoken.length > 0) {
      const nextCompleted = [...completedChunks];
      nextCompleted[currentChunkIndex] = true;
      setCompletedChunks(nextCompleted);

      setChunkFeedback('Great job!');

      setTimeout(() => {
        if (currentChunkIndex + 1 < chunks.length) {
          setCurrentChunkIndex(currentChunkIndex + 1);
          setTranscript('');
          setChunkFeedback(null);
          handleListenChunk(chunks[currentChunkIndex + 1]);
        } else {
          onComplete();
        }
      }, 1000);
    } else {
      setChunkFeedback("Let's try this part again!");
    }
  };

  useEffect(() => {
    if (chunks.length > 0) {
      handleListenChunk(chunks[0]);
    }
  }, []);

  return (
    <div className="w-full rounded-[28px] bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F2] to-[#FFF1E6] border-2 border-[#FBD9BF] p-4 sm:p-5 shadow-[0_8px_25px_rgb(251,146,60,0.06)] animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white text-xs sm:text-sm font-bold shadow-2xs">
            Step by Step 🧩
          </span>
          <span className="text-sm sm:text-base font-bold text-[#6E4B3E]">
            Chunk by Chunk
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-xs sm:text-sm text-[#9C857D] hover:text-[#431407] underline transition py-1"
        >
          Back to full sentence
        </button>
      </div>

      {/* Chunks Progress - Responsive and word-break: keep-all */}
      <div className="space-y-2.5 mb-4">
        {chunks.map((chunk, idx) => {
          const isDone = completedChunks[idx];
          const isCurrent = idx === currentChunkIndex;

          return (
            <div
              key={idx}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-white border-[#FB923C] shadow-md ring-2 ring-[#FED7AA]'
                  : isDone
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                  : 'bg-[#FFFDFB]/60 border-[#FDE6D2] opacity-70 text-[#7D665E]'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs ${
                    isDone
                      ? 'bg-[#10B981] text-white'
                      : isCurrent
                      ? 'bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white'
                      : 'bg-[#EADBCE] text-[#7D665E]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </span>
                <span
                  className={`text-base sm:text-lg font-bold text-left leading-[1.5] break-keep ${
                    isCurrent ? 'text-[#431407] font-black' : isDone ? 'text-[#14532D]' : 'text-[#7D665E]'
                  }`}
                >
                  {chunk}
                </span>
              </div>

              <div className="shrink-0 pt-0.5">
                <button
                  onClick={() => handleListenChunk(chunk)}
                  className="p-2 rounded-xl bg-[#FFF3E8] hover:bg-[#FFE8D6] text-[#9A3412] border border-[#FCD5BA] transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Listen to this chunk"
                  aria-label="Listen to chunk"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Chunk Mic Interaction */}
      <div className="flex flex-col items-center justify-center pt-1 pb-1">
        <p className="text-left sm:text-center text-base text-[#7D665E] font-semibold mb-3 leading-[1.6] break-keep w-full">
          Now say just: <strong className="text-[#431407]">&quot;{currentChunk}&quot;</strong>
        </p>

        <button
          onClick={handleStartChunkMic}
          disabled={isListening}
          className={`min-h-[48px] px-6 py-3 rounded-full flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base shadow-md transition transform active:scale-95 ${
            isListening
              ? 'bg-gradient-to-r from-[#FB7185] to-[#F43F5E] text-white animate-pulse'
              : 'bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 text-white ring-2 ring-[#FFEDD5]'
          }`}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
          <span>{isListening ? "Listening…" : "Tap to speak this part"}</span>
        </button>

        {transcript && (
          <p className="mt-2.5 text-base text-[#5C453E] bg-white/95 px-4 py-1.5 rounded-full border border-[#FBE0C8] shadow-2xs text-left leading-[1.6] break-keep">
            Heard: &quot;{transcript}&quot;
          </p>
        )}

        {chunkFeedback && (
          <p className="mt-2 text-base font-bold text-[#9A3412] text-center leading-[1.5]">
            {chunkFeedback}
          </p>
        )}
      </div>
    </div>
  );
};
