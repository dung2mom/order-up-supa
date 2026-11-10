import React, { useState, useEffect, useRef } from 'react';
import { AppScreen, SentenceResult, DialogueItem } from './types';
import { DIALOGUE_DATA } from './data/dialogue';
import { StartScreen } from './components/StartScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { ActivitySummaryScreen } from './components/ActivitySummaryScreen';
import { BrowserNoticeModal } from './components/BrowserNoticeModal';
import { isInAppBrowser, isSpeechRecognitionSupported } from './utils/speech';
import { ExternalLink } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [activeQueue, setActiveQueue] = useState<DialogueItem[]>(DIALOGUE_DATA);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [results, setResults] = useState<Record<number, SentenceResult>>({});
  const [noticeType, setNoticeType] = useState<'not_supported' | 'mic_denied' | 'in_app' | null>(null);
  const [showInAppBanner, setShowInAppBanner] = useState<boolean>(false);

  const { isAuthenticated } = useAuth();
  const prevAuthRef = useRef<boolean>(isAuthenticated);

  // Navigate to main (start) page whenever login occurs
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      setScreen('start');
      // Clean up OAuth fragment from URL if present
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Check browser capabilities on startup
  useEffect(() => {
    if (isInAppBrowser()) {
      setShowInAppBanner(true);
    }
  }, []);

  const handleStart = () => {
    if (!isSpeechRecognitionSupported()) {
      setNoticeType('not_supported');
    }
    setActiveQueue(DIALOGUE_DATA);
    setCurrentTurnIndex(0);
    setScreen('practice');
  };

  const handleSentenceComplete = (result: SentenceResult) => {
    setResults((prev) => ({
      ...prev,
      [result.dialogueId]: result,
    }));

    if (currentTurnIndex + 1 < activeQueue.length) {
      setCurrentTurnIndex(currentTurnIndex + 1);
    } else {
      setScreen('result');
    }
  };

  const handleStartOver = () => {
    setResults({});
    setActiveQueue(DIALOGUE_DATA);
    setCurrentTurnIndex(0);
    setScreen('start');
  };

  const handlePracticeSkipped = () => {
    const skippedItems = DIALOGUE_DATA.filter(
      (item) => results[item.id]?.skipped
    );

    if (skippedItems.length > 0) {
      setActiveQueue(skippedItems);
      setCurrentTurnIndex(0);
      setScreen('practice');
    } else {
      handleStartOver();
    }
  };

  const currentDialogue = activeQueue[currentTurnIndex] || DIALOGUE_DATA[0];

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EF] to-[#FDF1E2] flex flex-col justify-center items-center font-sans antialiased text-[#4A3831] px-3 py-3 sm:px-6 sm:py-8 selection:bg-[#FED7AA] overflow-x-hidden">
      {/* In-app Browser Notice Banner */}
      {showInAppBanner && (
        <div className="w-full max-w-lg bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white text-sm font-bold py-3 px-4 flex flex-wrap items-center justify-between gap-2 shadow-xs sticky top-0 z-40 rounded-2xl mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span className="leading-snug break-keep text-left">
              For best voice recognition, tap the menu (&#8942;) and select &apos;Open in Chrome&apos;.
            </span>
          </div>
          <button
            onClick={() => setShowInAppBanner(false)}
            className="text-white hover:bg-black/10 px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Responsive Soft-Edge Container */}
      <div className="w-full max-w-lg min-h-[90vh] sm:min-h-[820px] bg-gradient-to-b from-[#FFFDF9]/95 via-[#FFF9F2]/95 to-[#FFF2E4]/95 rounded-[32px] sm:rounded-[36px] shadow-[0_20px_50px_-12px_rgba(180,83,9,0.08)] border border-[#FCE7D2] flex flex-col relative overflow-x-hidden backdrop-blur-xs">
        {screen === 'start' && (
          <StartScreen
            onStart={handleStart}
            onShowHelp={() => setNoticeType('not_supported')}
            onViewSummary={() => setScreen('summary')}
          />
        )}

        {screen === 'practice' && (
          <PracticeScreen
            dialogue={currentDialogue}
            currentIndex={currentTurnIndex}
            totalCount={activeQueue.length}
            onSentenceComplete={handleSentenceComplete}
            onOpenNotice={(type) => setNoticeType(type)}
          />
        )}

        {screen === 'result' && (
          <ResultScreen
            results={results}
            onStartOver={handleStartOver}
            onPracticeSkipped={handlePracticeSkipped}
            onViewSummary={() => setScreen('summary')}
          />
        )}

        {screen === 'summary' && (
          <ActivitySummaryScreen
            onBack={() => setScreen(Object.keys(results).length > 0 ? 'result' : 'start')}
            onStartPractice={handleStart}
          />
        )}
      </div>

      {/* Guidance Notice Modal */}
      <BrowserNoticeModal
        type={noticeType}
        onClose={() => setNoticeType(null)}
        onEnableKeyboardMode={() => {
          // Handled inside modal
        }}
      />
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

