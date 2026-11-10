import React from 'react';
import { Chrome, ExternalLink, MicOff, X } from 'lucide-react';

interface BrowserNoticeModalProps {
  type: 'not_supported' | 'mic_denied' | 'in_app' | null;
  onClose: () => void;
  onEnableKeyboardMode?: () => void;
}

export const BrowserNoticeModal: React.FC<BrowserNoticeModalProps> = ({
  type,
  onClose,
  onEnableKeyboardMode,
}) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFF7ED] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(251,146,60,0.2)] border-2 border-[#FBD9BF] text-[#431407] my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 text-[#A8958E] hover:text-[#431407] rounded-full hover:bg-[#FFF0E2] transition min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Close notice"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'in_app' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF0E2] text-[#EA580C] flex items-center justify-center mb-4 shadow-2xs border border-[#FCD8C1]">
              <ExternalLink className="w-7 h-7" />
            </div>

            {/* Center-aligned heading */}
            <h3 className="text-xl sm:text-2xl font-bold text-[#431407] mb-2 text-center leading-snug">
              Open in External Browser
            </h3>

            {/* Left-aligned body copy (>=16px, line-height 1.6) */}
            <div className="w-full bg-[#FFF8F0] p-4 rounded-2xl border border-[#FCE3D0] mb-5">
              <p className="text-left text-base text-[#7D665E] leading-[1.6] break-keep">
                Tap the menu icon (&#8942;) at the top right of your screen and select <strong className="text-[#431407]">&apos;Open in Chrome&apos;</strong> or <strong className="text-[#431407]">&apos;Open in Browser&apos;</strong> for proper microphone access.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 text-white font-bold text-base shadow-md transition active:scale-95"
            >
              Got it
            </button>
          </div>
        )}

        {type === 'mic_denied' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mb-4 shadow-2xs border border-[#FECDD3]">
              <MicOff className="w-7 h-7" />
            </div>

            {/* Center-aligned heading */}
            <h3 className="text-xl sm:text-2xl font-bold text-[#431407] mb-2 text-center leading-snug">
              Microphone Access
            </h3>

            {/* Left-aligned body copy (>=16px, line-height 1.6) */}
            <div className="w-full bg-[#FFF8F0] p-4 rounded-2xl border border-[#FCE3D0] mb-5">
              <p className="text-left text-base text-[#7D665E] leading-[1.6] break-keep">
                Microphone permission is needed to recognize your spoken sentences. You can allow access from the lock or settings icon in your browser address bar.
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <button
                onClick={onClose}
                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 text-white font-bold text-base shadow-md transition active:scale-95"
              >
                Try Again
              </button>
              {onEnableKeyboardMode && (
                <button
                  onClick={() => {
                    onEnableKeyboardMode();
                    onClose();
                  }}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-[#FFF0E2] hover:bg-[#FFE6D4] text-[#9A3412] font-semibold text-sm sm:text-base border border-[#FCD8C1] transition"
                >
                  Type with Keyboard Instead
                </button>
              )}
            </div>
          </div>
        )}

        {type === 'not_supported' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-4 shadow-2xs border border-[#BAE6FD]">
              <Chrome className="w-7 h-7" />
            </div>

            {/* Center-aligned heading */}
            <h3 className="text-xl sm:text-2xl font-bold text-[#431407] mb-2 text-center leading-snug">
              Google Chrome Recommended
            </h3>

            {/* Left-aligned body copy (>=16px, line-height 1.6) */}
            <div className="w-full bg-[#FFF8F0] p-4 rounded-2xl border border-[#FCE3D0] mb-5">
              <p className="text-left text-base text-[#7D665E] leading-[1.6] break-keep">
                Speech recognition is natively supported in Google Chrome. For the best speaking practice without audio issues, please open this app in Chrome.
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <button
                onClick={onClose}
                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 text-white font-bold text-base shadow-md transition active:scale-95"
              >
                Continue
              </button>
              {onEnableKeyboardMode && (
                <button
                  onClick={() => {
                    onEnableKeyboardMode();
                    onClose();
                  }}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-[#FFF0E2] hover:bg-[#FFE6D4] text-[#9A3412] font-semibold text-sm sm:text-base border border-[#FCD8C1] transition"
                >
                  Enable Keyboard Test Mode
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
