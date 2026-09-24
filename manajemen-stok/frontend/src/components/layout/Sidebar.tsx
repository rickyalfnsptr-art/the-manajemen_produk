'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  LayoutGrid,
  QrCode,
  Clock,
  Boxes,
  LogOut,
  ShieldCheck,
  X
} from 'lucide-react';
import { User } from '@/types';

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, isMobile = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mtm_whfg_user') || localStorage.getItem('mtm_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mtm_token');
      localStorage.removeItem('mtm_whfg_user');
      localStorage.removeItem('mtm_user');
      router.push('/login');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase().substring(0, 2);
  };

  // Grouped Navigation following MTM Reference System
  const categories = [
    {
      title: 'MAIN MENU',
      items: [
        {
          name: 'Dashboard Statistik',
          href: '/statistics',
          icon: LayoutDashboard,
          desc: 'Grafik mutasi IN/OUT & analisis inventori',
        },
        {
          name: 'Monitoring Stok',
          href: '/dashboard',
          icon: Activity,
          desc: 'Pantauan realtime & prioritas part kritis',
        },
      ],
    },
    {
      title: 'ACTIVITY',
      items: [
        {
          name: 'Zebra Scanner',
          href: '/scan',
          icon: QrCode,
          desc: 'Scan IN/OUT Kanban & Manual Fallback',
        },
        {
          name: 'Tracking & Aging',
          href: '/tracking',
          icon: Clock,
          desc: 'Riwayat siklus hidup & durasi simpan',
        },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        {
          name: 'Papan Ambang Batas (Whiteboard PT)',
          href: '/master-parts',
          icon: Boxes,
          desc: 'Papan kontrol Min/Max per Part & per PT',
        },
      ],
    },
  ];

  return (
    <aside className="w-full h-full bg-white text-slate-800 flex flex-col select-none overflow-hidden">
      {/* Top Section: Official MTM Logo Banner */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex flex-col items-start">
          <img
            src="/images/logo-mtm.jpg"
            alt="PT Menara Terus Makmur"
            className="h-9 object-contain"
          />
          <span className="text-[9px] font-extrabold text-blue-700 tracking-wider mt-1 uppercase">
            WHFG Management System
          </span>
        </div>

        {/* Mobile Close Button */}
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Categorized Navigation (Smooth Independent Scroll) */}
      <nav className="flex-1 p-3.5 space-y-5 overflow-y-auto scrollbar-thin">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2.5 mb-1">
              {cat.title}
            </span>
            <div className="space-y-1">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (isMobile && onCloseMobile) onCloseMobile();
                    }}
                    className={`group flex items-start gap-3 px-3 py-2 rounded-xl transition-all duration-150 font-medium ${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                        }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{item.name}</div>
                      <div
                        className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer matching MTM Reference style */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-xs mb-2">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs border border-blue-200 flex-shrink-0">
            {getInitials(user?.fullName || user?.username)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user ? user.fullName : 'Operator MTM'}
            </p>
            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span>{user ? user.role : 'OPERATOR'}</span> &bull; <span>NPK: {user ? user.npk : 'MTM'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Sistem (Logout)
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
