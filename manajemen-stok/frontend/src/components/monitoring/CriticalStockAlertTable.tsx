'use client';

import React from 'react';
import { PartCustomerStock } from '@/types';
import { AlertTriangle, TrendingDown, TrendingUp, Sliders, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface CriticalStockAlertTableProps {
  stocks: PartCustomerStock[];
  onEditThreshold?: (stock: PartCustomerStock) => void;
  userRole?: string;
}

export const CriticalStockAlertTable: React.FC<CriticalStockAlertTableProps> = ({
  stocks,
  onEditThreshold,
  userRole,
}) => {
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
  const canEdit = userRole === 'ADMIN' || userRole === 'PPIC';

  if (criticalItems.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Semua Stok Sesuai Ambang Batas Ideal</h3>
            <p className="text-xs text-slate-500">Tidak ada part yang berada di bawah Min Stock atau di atas Max Stock saat ini.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
          🟢 Status Prima
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Daftar Part Kritis & Memerlukan Perhatian PPIC
              </h3>
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full">
                {underMinItems.length} Kritis &bull; {overMaxItems.length} Overstock
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Part dengan stok $\le$ batas Min memerlukan suplai produksi/vendor segera untuk mencegah <em>line stop</em> delivery.
            </p>
          </div>
        </div>

        <Link
          href="/scan"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-end sm:self-center"
        >
          <span>Scan Barang Masuk (IN)</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Customer PT</th>
              <th className="py-2.5 px-4">Part Number & Deskripsi</th>
              <th className="py-2.5 px-3 text-center">Stok Terkini</th>
              <th className="py-2.5 px-3 text-center">Batas Min</th>
              <th className="py-2.5 px-3 text-center">Batas Max</th>
              <th className="py-2.5 px-3 text-center">Kekurangan (Defisit)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criticalItems.slice(0, 8).map((item) => {
              const isUnderMin = item.currentStock <= item.minStock;
              const deficit = item.minStock - item.currentStock;

              return (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isUnderMin ? 'bg-red-50/20' : 'bg-amber-50/20'}`}>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 px-2 py-0.5 rounded bg-white border border-slate-200 inline-block text-[11px]">
                      {item.customerPt}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {item.partNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">
                      {item.partName}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-black text-sm">
                    <span className={`px-2 py-0.5 rounded ${isUnderMin ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                      {item.currentStock}
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
                      <span className="text-red-700 font-black">
                        -{deficit} pcs
                      </span>
                    ) : (
                      <span className="text-amber-700">
                        +{item.currentStock - item.maxStock} pcs
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isUnderMin ? (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-[10px] shadow-xs">
                        🔴 KRITIS
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] shadow-xs">
                        🟡 OVERSTOCK
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {canEdit && onEditThreshold ? (
                      <button
                        type="button"
                        onClick={() => onEditThreshold(item)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-bold border border-blue-200 transition-all flex items-center justify-center gap-1 mx-auto shadow-2xs"
                      >
                        <Sliders className="w-3 h-3" />
                        Ubah
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

      {criticalItems.length > 8 && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
          Menampilkan 8 dari total <strong>{criticalItems.length}</strong> part yang memerlukan perhatian. Lihat selengkapnya pada Papan Kontrol Whiteboard di bawah.
        </div>
      )}
    </div>
  );
};

export default CriticalStockAlertTable;
