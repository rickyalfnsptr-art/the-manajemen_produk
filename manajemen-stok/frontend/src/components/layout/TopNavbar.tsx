'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Clock, Menu } from 'lucide-react';

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  onToggleMobileSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  title,
  subtitle,
  onToggleMobileSidebar,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex justify-between items-center z-30 shadow-xs flex-shrink-0">
      {/* Left: Mobile Toggle + Portal Title & Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors flex-shrink-0"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none uppercase truncate">
            {title}
          </h1>
          {subtitle && (
            <span className="hidden md:inline-block text-slate-300 font-light text-sm">|</span>
          )}
          {subtitle && (
            <p className="hidden md:block text-xs text-slate-500 font-medium tracking-wide truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Live Digital Clock */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-xs">
          <Clock className="w-4 h-4 text-slate-300" />
          <span suppressHydrationWarning>{mounted ? (timeStr || '--:--:-- WIB') : '--:--:-- WIB'}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
