'use client';

import React from 'react';
import { PartCustomerStock } from '@/types';
import { AlertTriangle, TrendingDown, TrendingUp, ArrowUpRight, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CriticalStockAlertTableProps {
  stocks: PartCustomerStock[];
}

export const CriticalStockAlertTable: React.FC<CriticalStockAlertTableProps> = ({ stocks }) => {
  // Filter for critical (<= Min) and overstock (>= Max)
  const criticalItems = stocks
    .filter(
      (s) =>
        s.stockStatus === 'RED_MIN' ||
        s.stockStatus === 'UNDER_MIN' ||
        s.currentStock <= s.minStock ||
        s.stockStatus === 'RED_MAX' ||
        s.stockStatus === 'OVER_MAX' ||
        s.currentStock >= s.maxStock
    )
    .sort((a, b) => {
      // Prioritize under min first, sorted by biggest shortage
      const deficitA = a.minStock - a.currentStock;
      const deficitB = b.minStock - b.currentStock;
      return deficitB - deficitA;
    });

  const underMinItems = criticalItems.filter((i) => i.currentStock <= i.minStock);
  const overMaxItems = criticalItems.filter((i) => i.currentStock >= i.maxStock);

  if (criticalItems.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Semua Stok Berada dalam Batas Ideal</h3>
            <p className="text-xs text-slate-500">
              Tidak ada part number yang berada di bawah ambang batas Min atau melebihi batas Max saat ini.
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Status Inventori Aman
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-orange-50 to-white border-b border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Peringatan Dini Part Kritis (Early Warning System)
              </h3>
              <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-xs">
                {underMinItems.length} Kritis Menipis &bull; {overMaxItems.length} Overstock
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Part dengan stok $\le$ batas Min memerlukan suplai produksi segera untuk mencegah hambatan pengiriman customer.
            </p>
          </div>
        </div>

        <Link
          href="/scan"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all self-end sm:self-center flex-shrink-0"
        >
          <span>Scan Masuk (IN)</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Customer PT</th>
              <th className="py-2.5 px-4">Part Number &amp; Deskripsi</th>
              <th className="py-2.5 px-3 text-center">Stok Terkini</th>
              <th className="py-2.5 px-3 text-center">Batas Min</th>
              <th className="py-2.5 px-3 text-center">Batas Max</th>
              <th className="py-2.5 px-3 text-center">Selisih</th>
              <th className="py-2.5 px-3 text-center">Status Peringatan</th>
              <th className="py-2.5 px-4 text-center">Aksi Pelacakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criticalItems.slice(0, 6).map((item) => {
              const isUnderMin = item.currentStock <= item.minStock;
              const deficit = item.minStock - item.currentStock;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-blue-50/30 transition-colors ${
                    isUnderMin ? 'bg-red-50/20' : 'bg-amber-50/20'
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 px-2.5 py-1 rounded-lg bg-white border border-slate-200 inline-block text-[11px] shadow-2xs">
                      {item.customerPt}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-blue-700 text-xs">
                      {item.partNumber}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium truncate max-w-[220px]">
                      {item.partName}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-black text-sm">
                    <span
                      className={`px-2.5 py-0.5 rounded-md ${
                        isUnderMin ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.currentStock.toLocaleString('id-ID')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-red-600 bg-red-50/40">
                    {item.minStock} pcs
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                    {item.maxStock} pcs
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {isUnderMin ? (
                      <span className="text-red-700 font-black">-{deficit} pcs</span>
                    ) : (
                      <span className="text-amber-700">+{item.currentStock - item.maxStock} pcs</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isUnderMin ? (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] shadow-xs">
                        🔴 STOK MENIPIS
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] shadow-xs">
                        🟡 OVERSTOCK
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/tracking?partNumber=${encodeURIComponent(item.partNumber)}`}
                      className="px-3 py-1.5 bg-white hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold border border-blue-200 transition-all inline-flex items-center justify-center gap-1 shadow-2xs"
                      title="Lacak Siklus & Riwayat Part Ini"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Lacak</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {criticalItems.length > 6 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
          Menampilkan 6 dari total <strong>{criticalItems.length}</strong> part yang memerlukan perhatian. Gunakan tabel di bawah untuk melihat daftar lengkap.
        </div>
      )}
    </div>
  );
};

export default CriticalStockAlertTable;
