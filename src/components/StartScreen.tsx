import React, { useState } from 'react';
import { Coffee, Sparkles, Volume2, Mic, LogIn, BarChart2 } from 'lucide-react';
import { CafeIllustration } from './CafeIllustration';
import { LoginModal } from './LoginModal';
import { UserProfilePopover } from './UserProfilePopover';
import { useAuth } from '@/src/context/AuthContext';

interface StartScreenProps {
  onStart: () => void;
  onShowHelp?: () => void;
  onViewSummary?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onViewSummary }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoginOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-full flex-1 w-full px-4 sm:px-7 py-5 sm:py-7 space-y-5 relative">
      {/* Top Bar: Left Activity Summary Link + Right-aligned Login Link or User Profile */}
      <div className="w-full flex justify-between items-center">
        {onViewSummary ? (
          <button
            onClick={onViewSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-[#FFF3E8] text-[#7C5E54] hover:text-[#9A3412] text-xs sm:text-sm font-bold border border-[#FBD9BF] shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>활동 요약</span>
          </button>
        ) : <div />}

        {isAuthenticated ? (
          <UserProfilePopover />
        ) : (
          <a
            href="#login"
            onClick={handleLoginClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-[#FFF3E8] text-[#7C5E54] hover:text-[#9A3412] text-xs sm:text-sm font-bold border border-[#FBD9BF] shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Login</span>
          </a>
        )}
      </div>

      {/* Top Header - Center Aligned */}
      <div className="w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF1E6] text-[#9A3412] text-xs sm:text-sm font-bold tracking-wide uppercase shadow-2xs mb-3 border border-[#FCD8C1]">
          <Coffee className="w-4 h-4 text-[#EA580C]" />
          <span>English Speaking Practice</span>
        </div>

        <h1 className="text-fluid-title font-black text-[#431407] tracking-tight font-['Fredoka',sans-serif] leading-tight text-center">
          Order Up!
        </h1>
        <p className="text-lg sm:text-xl font-bold text-[#9A3412]/90 mt-1 text-center">
          Café Talk
        </p>
      </div>

      {/* Middle: Illustration and Guidance Card */}
      <div className="w-full flex flex-col items-center my-auto space-y-4 max-w-md">
        <div className="w-full transform hover:scale-[1.01] transition duration-300">
          <CafeIllustration size="md" />
        </div>

        {/* Soft-edge Guidance Card */}
        <div className="w-full bg-white/95 rounded-[28px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(251,146,60,0.06)] border border-[#FBE6D4]">
          {/* Centered sub-heading */}
          <h2 className="text-lg sm:text-xl font-extrabold text-[#431407] text-center leading-snug">
            &ldquo;Let&apos;s order drinks in English with Mia the barista!&rdquo;
          </h2>

          {/* Left-aligned body copy (>=16px, line-height 1.6) */}
          <p className="text-left text-base sm:text-[17px] text-[#7D665E] mt-3 leading-[1.6] break-keep">
            Practice ordering step by step: listen to the barista, speak your order clearly, and receive instant friendly feedback.
          </p>

          {/* 3 Steps responsive layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-[#F8E8DA]">
            <div className="flex items-center sm:flex-col sm:text-center gap-3 sm:gap-1.5 p-2.5 rounded-2xl bg-[#FFFDF9] border border-[#FCECDD]/80">
              <span className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#92400E] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Volume2 className="w-4 h-4" />
              </span>
              <span className="text-base font-bold text-[#6E554F]">1. Listen</span>
            </div>

            <div className="flex items-center sm:flex-col sm:text-center gap-3 sm:gap-1.5 p-2.5 rounded-2xl bg-[#FFFDF9] border border-[#FCECDD]/80">
              <span className="w-9 h-9 rounded-full bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Mic className="w-4 h-4" />
              </span>
              <span className="text-base font-bold text-[#6E554F]">2. Speak</span>
            </div>

            <div className="flex items-center sm:flex-col sm:text-center gap-3 sm:gap-1.5 p-2.5 rounded-2xl bg-[#FFFDF9] border border-[#FCECDD]/80">
              <span className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-base font-bold text-[#6E554F]">3. Feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Large Start Button + Privacy Notice */}
      <div className="w-full flex flex-col items-center space-y-3.5 max-w-md pt-2">
        <button
          onClick={onStart}
          className="w-full min-h-[54px] py-4 px-6 rounded-2xl bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FDBA74] hover:brightness-105 active:scale-98 text-white font-black text-lg sm:text-xl shadow-[0_12px_28px_-6px_rgba(249,115,22,0.35)] ring-4 ring-[#FFEAD8] transition duration-200 flex items-center justify-center gap-3 tracking-wide font-['Fredoka',sans-serif]"
        >
          <span>Start Ordering</span>
          <Coffee className="w-5 h-5 text-white drop-shadow-2xs shrink-0" />
        </button>

        {/* Privacy Notice - Left-aligned body text with 1.6 line height */}
        <div className="w-full px-2">
          <p className="text-left text-sm sm:text-base text-[#9C857D] leading-[1.6] break-keep">
            What you say is processed by the browser&apos;s speech recognition service to turn it into text. Your voice is not recorded or stored.
          </p>
        </div>
      </div>

      {/* In-page Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
};
