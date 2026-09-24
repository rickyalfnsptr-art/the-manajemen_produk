'use client';

import React, { useMemo } from 'react';
import { Building2, Filter } from 'lucide-react';
import { SearchableCombobox, ComboboxOption } from '@/components/common/SearchableCombobox';

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
    { label: 'Aisin', val: 'PT. AISIN INDONESIA' },
  ];

  const comboboxOptions: ComboboxOption[] = useMemo(() => {
    return [
      { value: '', label: `🏢 Semua Customer PT (${list.length} PT)` },
      ...list.map((pt) => ({ value: pt, label: pt })),
    ];
  }, [list]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Filter Alokasi PT Customer</h2>
            <p className="text-xs text-slate-500">
              Pantau status stok &amp; ambang batas khusus masing-masing PT Customer
            </p>
          </div>
        </div>

        {/* Searchable Combobox for PT selection */}
        <div className="w-full md:w-80">
          <SearchableCombobox
            value={selectedPt}
            onChange={onSelectPt}
            options={comboboxOptions}
            placeholder="-- Cari / Pilih Customer PT --"
            searchPlaceholder="Ketik PT (Toyota, Daihatsu...)"
            allowCustom={false}
          />
        </div>
      </div>

      {/* Quick Select Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin pt-1 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
          Akses Cepat:
        </span>
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
