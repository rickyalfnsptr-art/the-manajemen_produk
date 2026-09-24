'use client';

import React from 'react';
import { PartCustomerStock } from '@/types';
import { Building2, Sliders } from 'lucide-react';

interface PpicWhiteboardViewProps {
  stocks: PartCustomerStock[];
  selectedPt?: string;
  statusFilter?: string; // 'ALL' | 'RED_MIN' | 'RED_MAX' | 'GREEN_NORMAL'
  onEditThreshold?: (stock: PartCustomerStock) => void;
  userRole?: string;
  onTrackPart?: (partNumber: string) => void;
}

export const PpicWhiteboardView: React.FC<PpicWhiteboardViewProps> = ({
  stocks,
  selectedPt,
  statusFilter = 'ALL',
  onEditThreshold,
  userRole,
  onTrackPart,
}) => {
  // Apply status filter if active
  const filteredStocks = stocks.filter((item) => {
    const isUnderMin =
      item.stockStatus === 'RED_MIN' ||
      item.stockStatus === 'UNDER_MIN' ||
      item.currentStock <= item.minStock;
    const isOverMax =
      item.stockStatus === 'RED_MAX' ||
      item.stockStatus === 'OVER_MAX' ||
      item.currentStock >= item.maxStock;
    const isNormal = !isUnderMin && !isOverMax;

    if (statusFilter === 'RED_MIN') return isUnderMin;
    if (statusFilter === 'RED_MAX') return isOverMax;
    if (statusFilter === 'GREEN_NORMAL' || statusFilter === 'NORMAL') return isNormal;
    return true;
  });

  // Group stocks by Customer PT
  const ptGroups: { [pt: string]: PartCustomerStock[] } = {};

  filteredStocks.forEach((s) => {
    const pt = s.customerPt || (s as any).customerName || 'PT LAINNYA';
    if (!ptGroups[pt]) {
      ptGroups[pt] = [];
    }
    ptGroups[pt].push(s);
  });

  const ptKeys = Object.keys(ptGroups).sort();
  const canEdit = userRole === 'ADMIN' || userRole === 'PPIC';

  if (ptKeys.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
        <Building2 className="w-10 h-10 mx-auto mb-2.5 text-slate-300" />
        <p className="font-semibold text-xs">
          Tidak ada data part yang cocok dengan filter{' '}
          {statusFilter !== 'ALL' && <strong className="text-blue-600">[{statusFilter}]</strong>}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Whiteboard Header Bar */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide">
              PAPAN KONTROL PPIC WHFG (WHITEBOARD DIGITAL PER PT)
            </h3>
            <p className="text-[11px] text-slate-300">
              Monitoring ketersediaan stok fisik vs batas Min & Max (Menampilkan {filteredStocks.length} Part di {ptKeys.length} Customer PT)
            </p>
          </div>
        </div>

        {/* Static Magnet Status Tags */}
        <div className="flex items-center gap-3 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl">
          <span className="text-slate-300 text-[10px] uppercase tracking-wider">Status:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">🟢 AMAN</span>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[11px] font-bold">🔴 KRITIS (&le; Min)</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold">🟡 OVER (&ge; Max)</span>
        </div>
      </div>

      {/* Grid of PT Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {ptKeys.map((ptName) => {
          const items = ptGroups[ptName];
          const redCount = items.filter(
            (i) => i.stockStatus === 'RED_MIN' || i.stockStatus === 'UNDER_MIN' || i.currentStock <= i.minStock
          ).length;
          const yellowCount = items.filter(
            (i) => i.stockStatus === 'RED_MAX' || i.stockStatus === 'OVER_MAX' || i.currentStock >= i.maxStock
          ).length;
          const normalCount = items.length - redCount - yellowCount;

          return (
            <div
              key={ptName}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* PT Section Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2.5 py-1 bg-blue-700 text-white rounded-lg text-xs font-black tracking-wide truncate max-w-[260px]">
                    {ptName}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 flex-shrink-0">
                    ({items.length} Part)
                  </span>
                </div>

                {/* Status summary tags */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold flex-shrink-0">
                  {redCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">
                      🔴 {redCount} Kritis
                    </span>
                  )}
                  {yellowCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold">
                      🟡 {yellowCount} Over
                    </span>
                  )}
                  {normalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold">
                      🟢 {normalCount} Aman
                    </span>
                  )}
                </div>
              </div>

              {/* Whiteboard Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-8 text-center">No</th>
                      <th className="py-2.5 px-3">Part Name & Part No</th>
                      <th className="py-2.5 px-2 text-center">Stok FG</th>
                      <th className="py-2.5 px-2 text-center bg-red-50/40 text-red-800">Min</th>
                      <th className="py-2.5 px-2 text-center bg-amber-50/40 text-amber-800">Max</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                      const isUnderMin =
                        item.stockStatus === 'RED_MIN' ||
                        item.stockStatus === 'UNDER_MIN' ||
                        item.currentStock <= item.minStock;
                      const isOverMax =
                        item.stockStatus === 'RED_MAX' ||
                        item.stockStatus === 'OVER_MAX' ||
                        item.currentStock >= item.maxStock;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isUnderMin ? 'bg-red-50/20' : isOverMax ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]" title={item.partName}>
                              {item.partName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 font-semibold">
                              {item.partNumber}
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono font-black text-sm">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                isUnderMin
                                  ? 'text-red-700 bg-red-100 font-black'
                                  : isOverMax
                                  ? 'text-amber-700 bg-amber-100 font-black'
                                  : 'text-slate-800'
                              }`}
                            >
                              {item.currentStock}
                            </span>
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono font-bold text-red-600 bg-red-50/30">
                            {item.minStock}
                          </td>

                          <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-600 bg-amber-50/30">
                            {item.maxStock}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {isUnderMin ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[10px]"
                                title="Stok Kritis <= Min"
                              >
                                🔴 KRITIS
                              </span>
                            ) : isOverMax ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px]"
                                title="Overstock >= Max"
                              >
                                🟡 OVER
                              </span>
                            ) : (
                              <span
                                className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]"
                                title="Stok Aman"
                              >
                                🟢 AMAN
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {canEdit && onEditThreshold ? (
                              <button
                                type="button"
                                onClick={() => onEditThreshold(item)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Ubah Batas Min / Max"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PpicWhiteboardView;
