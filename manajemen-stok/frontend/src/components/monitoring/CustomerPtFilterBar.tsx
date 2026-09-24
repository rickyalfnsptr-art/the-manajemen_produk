'use client';

import React from 'react';
import { Building, Filter } from 'lucide-react';

interface CustomerPtFilterBarProps {
  selectedPt: string;
  onSelectPt: (pt: string) => void;
  pts?: string[];
  ptList?: string[];
}

export const CustomerPtFilterBar: React.FC<CustomerPtFilterBarProps> = ({
  selectedPt,
  onSelectPt,
  pts,
  ptList,
}) => {
  const list = pts || ptList || [];
  const topPts = [
    { label: 'Semua PT', val: '' },
    { label: 'Toyota (TMMIN)', val: 'PT. TOYOTA MOTOR MANUFACTURING INDONESIA' },
    { label: 'Daihatsu (ADM)', val: 'PT. ASTRA DAIHATSU MOTOR' },
    { label: 'Honda (HPPM)', val: 'PT. HONDA PRECISION PARTS MANUFACTURING' },
    { label: 'Suzuki (SIM)', val: 'PT. SUZUKI INDOMOBIL MOTOR' },
    { label: 'Isuzu (IAMI)', val: 'PT. ISUZU ASTRA MOTOR INDONESIA' },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-bold text-slate-800">Filter Alokasi PT Customer</h2>
            <p className="text-[11px] text-slate-500">Pilih PT untuk memantau status stok & ambang batas khusus PT tersebut</p>
          </div>
        </div>

        {/* Dropdown for All 32 PTs */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPt}
            onChange={(e) => onSelectPt(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate shadow-sm cursor-pointer"
          >
            <option value="">🏢 Semua PT Customer ({list.length} PT Terdaftar)</option>
            {list.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Select Tabs for Top Automotive Customers */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {topPts.map((item, idx) => {
          const isSelected = selectedPt === item.val;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPt(item.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerPtFilterBar;
