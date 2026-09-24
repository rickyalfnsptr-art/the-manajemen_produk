'use client';

import React from 'react';
import { Package, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { StockSummaryStats } from '@/types';

interface KpiSummaryCardsProps {
  stats: StockSummaryStats | null;
  selectedPt?: string;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({ stats, selectedPt }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 bg-slate-100 rounded-xl"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Part Terdaftar',
      value: stats.totalParts.toLocaleString('id-ID'),
      subtitle: selectedPt ? `Alokasi PT: ${selectedPt}` : `${stats.totalAllocations} Alokasi Part-PT`,
      icon: Package,
      color: 'blue',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-600',
    },
    {
      title: 'Stok Normal (Aman)',
      value: stats.normalStockCount.toLocaleString('id-ID'),
      subtitle: `${((stats.normalStockCount / (stats.totalAllocations || 1)) * 100).toFixed(1)}% dari total alokasi`,
      icon: CheckCircle2,
      color: 'emerald',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-600',
    },
    {
      title: 'Warning: Di Bawah Min (Kritis)',
      value: stats.underMinCount.toLocaleString('id-ID'),
      subtitle: 'Perlu restock segera (🔴)',
      icon: TrendingDown,
      color: 'red',
      bgLight: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-600',
    },
    {
      title: 'Warning: Melebihi Max (Overstock)',
      value: stats.overMaxCount.toLocaleString('id-ID'),
      subtitle: 'Kapasitas berlebih (🔴)',
      icon: TrendingUp,
      color: 'amber',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl border ${card.borderColor} p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {card.title}
                </p>
                <h3 className={`text-2xl font-black ${card.textColor}`}>
                  {card.value}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgLight} ${card.textColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
