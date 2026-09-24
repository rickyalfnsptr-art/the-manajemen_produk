'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  subtitle,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-slate-100 flex text-slate-900 font-sans antialiased overflow-hidden select-none">
      {/* 1. Desktop Fixed Sidebar (Stays permanently on left) */}
      <div className="hidden lg:block w-64 h-screen fixed top-0 left-0 z-40 bg-white border-r border-slate-200 shadow-sm flex-shrink-0">
        <Sidebar onCloseMobile={() => {}} />
      </div>

      {/* 2. Mobile Drawer Sidebar (with backdrop) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl z-50 flex flex-col animate-slide-right">
            <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* 3. Main Viewport Container (Header is fixed at top, only main content scrolls) */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 h-screen overflow-hidden">
        {/* Fixed Top Navbar (Never moves on scroll) */}
        <TopNavbar
          title={title}
          subtitle={subtitle}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Independent Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
