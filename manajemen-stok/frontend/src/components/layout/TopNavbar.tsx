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

  useEffect(() => {
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
    <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex justify-between items-center z-30 shadow-xs flex-shrink-0">
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
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none uppercase truncate">
            {title}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide mt-1 truncate">
            {subtitle || 'PT. MENARA TERUS MAKMUR • WAREHOUSE FINISHED GOODS PORTAL'}
          </p>
        </div>
      </div>

      {/* Right: Live WHFG Server Badge + Live Digital Clock (No duplicate profile/logout) */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        {/* Live WHFG Server Status */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">WHFG Online</span>
        </div>

        {/* Live Digital Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span suppressHydrationWarning>{timeStr || '--:--:-- WIB'}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
