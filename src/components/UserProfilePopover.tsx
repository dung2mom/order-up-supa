import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export const UserProfilePopover: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Student';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  const email = user?.email || profile?.email || '';

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button showing user profile photo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white/95 hover:bg-[#FFF3E8] border border-[#FBD9BF] shadow-2xs hover:shadow-xs transition duration-200 cursor-pointer active:scale-95 group focus:outline-hidden"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Account Profile"
      >
        {/* Profile Avatar Image */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#FDBA74] bg-[#FFEAD8] flex items-center justify-center shrink-0 shadow-2xs">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // If avatar fails to load, fallback
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <UserIcon className="w-4 h-4 text-[#EA580C]" />
          )}
        </div>

        {/* Display Name */}
        <span className="text-xs sm:text-sm font-bold text-[#5C423A] group-hover:text-[#9A3412] max-w-[100px] sm:max-w-[130px] truncate">
          {displayName}
        </span>
      </button>

      {/* Popover Dropdown (Appears on hover below profile) */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-b from-[#FFFDF9] via-[#FFF8F0] to-[#FFF4EA] rounded-2xl p-4 shadow-[0_16px_36px_rgba(251,146,60,0.18)] border-2 border-[#FBD9BF] z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
          role="menu"
        >
          {/* Popover Header with Avatar & Details */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#F5E2D2]">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#FB923C] bg-[#FFEAD8] flex items-center justify-center shrink-0 shadow-xs">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-[#EA580C]" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-extrabold text-[#431407] truncate leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-[#8C7A73] truncate leading-tight mt-0.5">
                {email}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#15803D] text-[10px] font-bold border border-[#BBF7D0]">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Google Verified</span>
              </span>
            </div>
          </div>

          {/* Action: Sign out button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full min-h-[38px] px-3 py-2 rounded-xl bg-white hover:bg-[#FEF2F2] text-[#B91C1C] hover:text-[#991B1B] text-xs sm:text-sm font-bold border border-[#FEE2E2] hover:border-[#FECACA] shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 group/signout"
            >
              <LogOut className="w-4 h-4 text-[#DC2626] group-hover/signout:scale-110 transition shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
