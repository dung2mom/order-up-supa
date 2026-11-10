import React, { useState } from 'react';
import { Coffee, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuthCardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onSuccess, onCancel, isModal = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setMessage({
          type: 'error',
          text: error.message || 'Google login could not be completed. Please try again.',
        });
        setIsLoading(false);
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'An error occurred while connecting to Google.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#FFFDF9] via-[#FFF8F0] to-[#FFF2E4] rounded-[32px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(251,146,60,0.18)] border-2 border-[#FBD9BF] relative text-[#431407] overflow-hidden">
      {/* Soft Decorative Background Circles */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#FED7AA]/30 blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-[#FDBA74]/20 blur-lg pointer-events-none" />

      {/* Header Section matching Main Page aesthetic */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF1E6] text-[#9A3412] text-xs font-bold uppercase tracking-wider shadow-2xs mb-3 border border-[#FCD8C1]">
          <Coffee className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>Café Talk Auth</span>
        </div>

        <h2 className="text-2xl sm:text-[26px] font-black text-[#431407] font-['Fredoka',sans-serif] tracking-tight leading-tight">
          Welcome to Café Talk
        </h2>

        <p className="text-sm sm:text-base text-[#7D665E] mt-1.5 leading-relaxed break-keep max-w-xs">
          Sign in with Google to start your English speaking practice journey.
        </p>
      </div>

      {/* Status Message (if any) */}
      {message && (
        <div
          className={`mb-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in ${
            message.type === 'success'
              ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
              : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="leading-snug break-keep text-left">{message.text}</span>
        </div>
      )}

      {/* Benefits Card in Soft Warm Style */}
      <div className="bg-white/90 rounded-2xl p-4 border border-[#FCE5D2] shadow-2xs mb-5 space-y-2.5">
        <div className="flex items-center gap-2.5 text-left text-xs sm:text-sm font-bold text-[#5C423A]">
          <span className="w-6 h-6 rounded-full bg-[#FFF0E2] text-[#EA580C] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span>Save your speaking tap records &amp; practice stats</span>
        </div>

        <div className="flex items-center gap-2.5 text-left text-xs sm:text-sm font-bold text-[#5C423A]">
          <span className="w-6 h-6 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
          <span>Fast, safe &amp; secure 1-tap sign in</span>
        </div>
      </div>

      {/* Primary Action: Google Login Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full min-h-[52px] py-3.5 px-5 rounded-2xl bg-white hover:bg-[#FFFDFB] active:scale-98 text-[#374151] font-bold text-base shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(251,146,60,0.15)] border-2 border-[#E5E7EB] hover:border-[#FDBA74] ring-4 ring-transparent hover:ring-[#FFEDD5] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-[#9A3412]">
              <span className="w-4 h-4 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin" />
              <span>Connecting to Google…</span>
            </div>
          ) : (
            <>
              {/* Official Google 'G' Multi-color SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="tracking-wide">Continue with Google</span>
            </>
          )}
        </button>
      </div>

      {/* Footer / Cancel option */}
      {onCancel && (
        <div className="mt-5 pt-3.5 border-t border-[#F5E2D2] text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs sm:text-sm text-[#9C857D] hover:text-[#431407] font-semibold underline underline-offset-4 transition py-1 px-3 cursor-pointer"
          >
            {isModal ? 'Continue as Guest' : 'Back to Home'}
          </button>
        </div>
      )}
    </div>
  );
};
