import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * Standardized SmartSphere Unified Loader Component
 *
 * Variants:
 *  - "full" / "page": Full-screen or viewport centered loader with glowing background and title
 *  - "section": Centered inside a card or container section with padding
 *  - "inline": Inline horizontal spinner with text (e.g., status messages, AI thinking)
 *  - "button": Ultra-compact spinner designed for action buttons
 *  - "badge": Minimal indicator for real-time status
 */
export default function Loader({
  variant = 'section',
  size = 'md',
  text = '',
  className = '',
  color = 'text-blue-400',
  subtext = '',
}) {
  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 44,
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 24;

  // 1. Full Screen / Page Loader
  if (variant === 'full' || variant === 'page') {
    return (
      <div
        className={`min-h-[60vh] flex flex-col items-center justify-center p-8 w-full ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="relative flex items-center justify-center mb-5">
          {/* Ambient Glow */}
          <div className="absolute w-20 h-20 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <div className="absolute w-12 h-12 rounded-full bg-indigo-500/30 blur-md" />
          {/* Central Spinner */}
          <Loader2
            size={pixelSize >= 32 ? pixelSize : 36}
            className={`animate-spin ${color} relative z-10`}
          />
        </div>

        {text && (
          <h3 className="text-base font-semibold text-white tracking-wide mb-1 text-center">
            {text}
          </h3>
        )}
        {subtext && (
          <p className="text-xs text-gray-400 text-center max-w-sm">
            {subtext}
          </p>
        )}
      </div>
    );
  }

  // 2. Button Loader (for submit buttons, actions, small pills)
  if (variant === 'button') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} role="status">
        <Loader2
          size={pixelSize <= 18 ? pixelSize : 16}
          className={`animate-spin ${color || 'text-current'}`}
        />
        {text && <span>{text}</span>}
      </span>
    );
  }

  // 3. Inline Loader (e.g. in AI chat thinking bubble, search bar prompt, file row)
  if (variant === 'inline') {
    return (
      <div
        className={`inline-flex items-center gap-2 text-sm text-gray-300 ${className}`}
        role="status"
      >
        <Loader2
          size={pixelSize}
          className={`animate-spin ${color} flex-shrink-0`}
        />
        {text && <span className="truncate">{text}</span>}
      </div>
    );
  }

  // 4. Badge / Micro Loader
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 ${className}`}
        role="status"
      >
        <Loader2 size={12} className="animate-spin text-blue-400" />
        {text && <span>{text}</span>}
      </span>
    );
  }

  // 5. Section Loader (Default: inside cards, modals, file lists, tab panels)
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 w-full text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center mb-3">
        <div className="absolute w-10 h-10 rounded-full bg-blue-500/10 blur-sm" />
        <Loader2
          size={pixelSize}
          className={`animate-spin ${color} relative z-10`}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-300 mb-1">{text}</p>
      )}
      {subtext && (
        <p className="text-xs text-gray-500 max-w-xs">{subtext}</p>
      )}
    </div>
  );
}

