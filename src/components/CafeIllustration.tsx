import React from 'react';

interface CafeIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'counter' | 'barista' | 'cup';
}

export const CafeIllustration: React.FC<CafeIllustrationProps> = ({
  className = '',
  size = 'md',
  variant = 'counter',
}) => {
  const heightMap = {
    sm: 'h-24',
    md: 'h-48',
    lg: 'h-56',
  };

  // Soft, sweet barista avatar
  if (variant === 'barista') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-12 h-12 rounded-full shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="softBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="100%" stopColor="#FED7AA" />
            </linearGradient>
            <radialGradient id="softCheek" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Soft outer frame */}
          <circle cx="50" cy="50" r="48" fill="url(#softBg)" stroke="#FDBA74" strokeWidth="2.5" />

          {/* Mia's Hair Back (Soft chestnut waves) */}
          <path
            d="M26 46C26 26 36 20 50 20C64 20 74 26 74 46C74 58 71 70 71 70H29C29 70 26 58 26 46Z"
            fill="#854D27"
          />

          {/* Face (Warm soft peach) */}
          <ellipse cx="50" cy="49" rx="20" ry="21" fill="#FFEDD5" />

          {/* Hair Front / Soft bangs */}
          <path
            d="M30 40C36 32 44 30 50 30C56 30 64 32 70 40C66 36 59 34 50 34C41 34 34 36 30 40Z"
            fill="#854D27"
          />

          {/* Eyes (Gentle crescent smile) */}
          <path d="M42 47C44 44 47 44 49 47" stroke="#431407" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M51 47C53 44 56 44 58 47" stroke="#431407" strokeWidth="2.2" strokeLinecap="round" />

          {/* Soft blushing cheeks */}
          <circle cx="39" cy="53" r="5" fill="url(#softCheek)" />
          <circle cx="61" cy="53" r="5" fill="url(#softCheek)" />

          {/* Sweet gentle smile */}
          <path d="M46 54C48 57 52 57 54 54" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Soft Apricot Beret */}
          <ellipse cx="50" cy="24" rx="21" ry="8" fill="#FB923C" />
          <circle cx="50" cy="16" r="2.5" fill="#EA580C" />

          {/* Soft Sage Linen Apron */}
          <path d="M36 68L42 63H58L64 68V95H36V68Z" fill="#84A98C" />
          <path d="M44 63L42 95M56 63L58 95" stroke="#52796F" strokeWidth="1.2" strokeOpacity="0.5" />
          <rect x="52" y="70" width="7" height="4" rx="1.5" fill="#FEF08A" />
        </svg>
      </div>
    );
  }

  // Soft steaming ceramic cup
  if (variant === 'cup') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 100 90" className="w-20 h-20 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mugGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>
            <linearGradient id="saucerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Gentle graceful steam */}
          <path d="M42 22C40 16 45 12 43 6" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5">
            <animate attributeName="d" values="M42 22C40 16 45 12 43 6; M42 22C44 16 39 12 43 6; M42 22C40 16 45 12 43 6" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M52 20C50 14 55 10 53 4" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5">
            <animate attributeName="d" values="M52 20C50 14 55 10 53 4; M52 20C54 14 49 10 53 4; M52 20C50 14 55 10 53 4" dur="3.5s" repeatCount="indefinite" />
          </path>

          {/* Ceramic Saucer */}
          <ellipse cx="50" cy="74" rx="34" ry="7" fill="url(#saucerGrad)" />

          {/* Ceramic Mug Body */}
          <path d="M28 34H72L67 66C67 70 60 73 50 73C40 73 33 70 33 66L28 34Z" fill="url(#mugGrad)" />
          {/* Mug Rim */}
          <ellipse cx="50" cy="34" rx="22" ry="5.5" fill="#9A3412" />
          {/* Velvety Milk Foam */}
          <ellipse cx="50" cy="35" rx="18" ry="4" fill="#FFFBEB" />
          {/* Delicate Latte Art Heart */}
          <path d="M50 33C48 31 44 32 45 35C46 37 50 39 50 39C50 39 54 37 55 35C56 32 52 31 50 33Z" fill="#C2410C" />

          {/* Mug Handle */}
          <path d="M70 40C79 40 81 54 70 59" stroke="#FB923C" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  // Full, soft, gentle café scene
  return (
    <div
      className={`relative w-full ${heightMap[size]} flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EE] to-[#FDEEDC] p-3 shadow-sm border border-amber-200/60 ${className}`}
    >
      <svg
        viewBox="0 0 400 240"
        className="w-full h-full max-h-56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Warm background gradient */}
          <linearGradient id="warmWall" x1="0" y1="0" x2="0" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="70%" stopColor="#FFF4E6" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>

          {/* Soft ambient lantern glow */}
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>

          {/* Gentle wood counter */}
          <linearGradient id="counterWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="15%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Soft cheek blush */}
          <radialGradient id="softCheekBig" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Cozy Wall */}
        <rect width="400" height="240" rx="20" fill="url(#warmWall)" />

        {/* Soft Decorative Arch Window */}
        <path
          d="M30 175V70C30 45 48 30 75 30C102 30 120 45 120 70V175H30Z"
          fill="#FEF3C7"
          fillOpacity="0.6"
        />
        <line x1="75" y1="35" x2="75" y2="175" stroke="#FDE68A" strokeWidth="1.5" />
        <line x1="30" y1="95" x2="120" y2="95" stroke="#FDE68A" strokeWidth="1.5" />

        {/* Potted Eucalyptus / Coffee Plant in window */}
        <path d="M64 175L68 150H82L86 175H64Z" fill="#F87171" fillOpacity="0.6" rx="2" />
        <path d="M75 150V125" stroke="#52796F" strokeWidth="2" strokeLinecap="round" />
        <circle cx="68" cy="138" r="5" fill="#84A98C" />
        <circle cx="82" cy="134" r="5.5" fill="#84A98C" />
        <circle cx="72" cy="122" r="5" fill="#A3B899" />
        <circle cx="80" cy="116" r="4.5" fill="#A3B899" />

        {/* Gentle Hanging Warm Lamps */}
        <g>
          <line x1="165" y1="0" x2="165" y2="35" stroke="#9A3412" strokeWidth="1.2" />
          <ellipse cx="165" cy="40" rx="14" ry="6" fill="#FDBA74" />
          <circle cx="165" cy="44" r="16" fill="url(#lanternGlow)" />
          <circle cx="165" cy="42" r="3.5" fill="#FFFBEB" />
        </g>
        <g>
          <line x1="245" y1="0" x2="245" y2="25" stroke="#9A3412" strokeWidth="1.2" />
          <ellipse cx="245" cy="30" rx="14" ry="6" fill="#FDBA74" />
          <circle cx="245" cy="34" r="16" fill="url(#lanternGlow)" />
          <circle cx="245" cy="32" r="3.5" fill="#FFFBEB" />
        </g>

        {/* Soft Chalkboard Menu */}
        <rect x="280" y="30" width="95" height="85" rx="10" fill="#292524" stroke="#92400E" strokeWidth="3" />
        <text x="295" y="50" fill="#FDE68A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">TODAY&apos;S CAFÉ</text>
        <text x="295" y="66" fill="#FFF7ED" fontSize="7.5" fontFamily="sans-serif">Hot Chocolate</text>
        <text x="355" y="66" fill="#FDBA74" fontSize="7.5" fontFamily="sans-serif">$4</text>
        <text x="295" y="80" fill="#E7E5E4" fontSize="7.5" fontFamily="sans-serif">Vanilla Latte</text>
        <text x="355" y="80" fill="#FDBA74" fontSize="7.5" fontFamily="sans-serif">$4</text>
        <text x="295" y="94" fill="#E7E5E4" fontSize="7.5" fontFamily="sans-serif">Warm Tea</text>
        <text x="355" y="94" fill="#FDBA74" fontSize="7.5" fontFamily="sans-serif">$3</text>
        <path d="M295 103C310 102 330 104 350 103" stroke="#A8A29E" strokeWidth="0.8" strokeDasharray="3 3" />

        {/* Barista Mia (Softer, gentler demeanor) */}
        <g transform="translate(145, 62)">
          {/* Soft Hair Back */}
          <path
            d="M-6 42C-6 12 16 0 50 0C84 0 106 12 106 42C106 68 96 85 96 85H4C4 85 -6 68 -6 42Z"
            fill="#854D27"
          />

          {/* Gentle Face */}
          <ellipse cx="50" cy="44" rx="27" ry="29" fill="#FFEDD5" />

          {/* Soft Hair Front / Wispy Bangs */}
          <path
            d="M24 26C34 16 46 15 52 15C62 15 74 19 78 32C71 27 61 24 50 24C38 24 29 27 24 26Z"
            fill="#854D27"
          />

          {/* Gentle Crescent Smiling Eyes */}
          <path d="M38 41C41 37 45 37 48 41" stroke="#431407" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M54 41C57 37 61 37 64 41" stroke="#431407" strokeWidth="2.8" strokeLinecap="round" />

          {/* Soft Rosy Cheeks */}
          <circle cx="35" cy="49" r="7" fill="url(#softCheekBig)" />
          <circle cx="67" cy="49" r="7" fill="url(#softCheekBig)" />

          {/* Warm, Kind Smile */}
          <path
            d="M45 51C48 56 54 56 57 51"
            stroke="#431407"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pastel Apricot Beret */}
          <ellipse cx="50" cy="12" rx="30" ry="11" fill="#FB923C" />
          <circle cx="50" cy="3" r="3" fill="#EA580C" />

          {/* Soft Sage Linen Apron & Cream Collar */}
          <path d="M26 73L36 66H66L76 73V115H26V73Z" fill="#84A98C" />
          <path d="M42 66L39 115M60 66L63 115" stroke="#52796F" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Cute Little Name Tag */}
          <rect x="54" y="78" width="12" height="6" rx="2" fill="#FEF08A" />
          <text x="56" y="83" fill="#92400E" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif">MIA</text>
        </g>

        {/* Counter Surface (Warm Gentle Wood) */}
        <rect x="0" y="165" width="400" height="75" fill="url(#counterWood)" />
        <rect x="0" y="160" width="400" height="10" fill="#F59E0B" fillOpacity="0.85" rx="3" />
        <line x1="0" y1="185" x2="400" y2="185" stroke="#78350F" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="0" y1="210" x2="400" y2="210" stroke="#78350F" strokeWidth="1" strokeOpacity="0.4" />

        {/* Steaming Mug on Counter */}
        <g transform="translate(195, 126)">
          {/* Steam */}
          <path d="M14 -6C12 -12 16 -18 13 -24" stroke="#FDBA74" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
            <animate attributeName="d" values="M14 -6C12 -12 16 -18 13 -24; M14 -6C16 -12 11 -18 13 -24; M14 -6C12 -12 16 -18 13 -24" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M23 -8C21 -14 25 -20 22 -26" stroke="#FDBA74" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
            <animate attributeName="d" values="M23 -8C25 -14 20 -20 22 -26; M23 -8C21 -14 25 -20 22 -26; M23 -8C25 -14 20 -20 22 -26" dur="3.5s" repeatCount="indefinite" />
          </path>

          {/* Saucer */}
          <ellipse cx="20" cy="34" rx="20" ry="4.5" fill="#E2E8F0" />
          {/* Mug */}
          <path d="M6 9H34L31 28C31 32 26 34 20 34C14 34 9 32 9 28L6 9Z" fill="#FDBA74" />
          <ellipse cx="20" cy="9" rx="14" ry="3.5" fill="#9A3412" />
          {/* Heart foam */}
          <circle cx="16" cy="8.5" r="2.8" fill="#FFFBEB" />
          <circle cx="23" cy="9" r="2.4" fill="#FFFBEB" />
          {/* Handle */}
          <path d="M33 13C38 13 40 22 32 24" stroke="#FB923C" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {/* Soft Pastel Takeout Cup with kraft sleeve on right */}
        <g transform="translate(325, 118)">
          <path d="M8 15H34L30 46H12L8 15Z" fill="#FFFDF8" stroke="#E2E8F0" strokeWidth="1.2" />
          <rect x="6" y="10" width="30" height="6" rx="2.5" fill="#E2E8F0" />
          {/* Kraft sleeve */}
          <path d="M10 24H32L31 35H11L10 24Z" fill="#D97706" />
          <circle cx="21" cy="29.5" r="3" fill="#FEF3C7" />
        </g>
      </svg>
    </div>
  );
};
