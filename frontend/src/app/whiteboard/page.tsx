'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PpicWhiteboardView } from '@/components/monitoring/PpicWhiteboardView';
import { PtThresholdModal } from '@/components/master/PtThresholdModal';
import { getStockMonitoring, getCustomerPts, getCurrentUser } from '@/utils/api';
import { PartCustomerStock, User } from '@/types';
import { LayoutGrid, Building2, RefreshCw, Search } from 'lucide-react';

export default function WhiteboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [selectedPt, setSelectedPt] = useState<string>('');
  const [stocks, setStocks] = useState<PartCustomerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStock, setEditingStock] = useState<PartCustomerStock | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ptsData, stocksData] = await Promise.all([
      getCustomerPts(),
      getStockMonitoring(selectedPt || undefined),
    ]);
    setCustomerPts(ptsData || []);
    setStocks(stocksData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
  }, [selectedPt]);

  const fetchStocks = async () => {
    setLoading(true);
    const stocksData = await getStockMonitoring(selectedPt || undefined);
    setStocks(stocksData || []);
    setLoading(false);
  };

  const handlePtThresholdSuccess = (updated: PartCustomerStock) => {
    setStocks((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
    fetchStocks();
  };

  // Filter stocks by search term
  const filteredStocks = stocks.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const pNo = (item.partNumber || '').toLowerCase();
    const pName = (item.partName || '').toLowerCase();
    const cPt = (item.customerPt || (item as any).customerName || '').toLowerCase();
    return pNo.includes(term) || pName.includes(term) || cPt.includes(term);
  });

  return (
    <AppLayout
      title="Papan Kontrol PPIC (WHFG Whiteboard)"
      subtitle="Visualisasi papan kontrol stok fisik vs ambang batas Min/Max per Customer PT (Standar Whiteboard Pabrik MTM)"
    >
      {/* Top Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                Papan Kontrol PPIC WHFG per Customer PT
              </h2>
              <p className="text-[11px] text-slate-500">
                Pilih Customer PT atau gunakan pencarian untuk memantau papan kontrol spesifik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dropdown */}
            <select
              value={selectedPt}
              onChange={(e) => setSelectedPt(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate shadow-xs cursor-pointer"
            >
              <option value="">🏢 Semua Customer ({customerPts.length} PT)</option>
              {customerPts.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={fetchStocks}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Chips & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin flex-1">
            {[
              { label: 'Semua PT', val: '' },
              { label: 'Toyota (TMMIN)', val: 'PT. TOYOTA MOTOR MANUFACTURING INDONESIA' },
              { label: 'Daihatsu (ADM)', val: 'PT. ASTRA DAIHATSU MOTOR' },
              { label: 'Honda (HPPM)', val: 'PT. HONDA PRECISION PARTS MANUFACTURING' },
              { label: 'Suzuki (SIM)', val: 'PT. SUZUKI INDOMOBIL MOTOR' },
              { label: 'Isuzu (IAMI)', val: 'PT. ISUZU ASTRA MOTOR INDONESIA' },
              { label: 'Aisin', val: 'PT. AISIN INDONESIA' },
            ].map((item, idx) => {
              const isSelected = selectedPt === item.val;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPt(item.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari part di whiteboard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Whiteboard View */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <PpicWhiteboardView
          stocks={filteredStocks}
          selectedPt={selectedPt}
          onEditThreshold={(stock) => setEditingStock(stock)}
          userRole={currentUser?.role}
        />
      )}

      {/* Threshold Modal */}
      {editingStock && (
        <PtThresholdModal
          stock={editingStock}
          isOpen={!!editingStock}
          onClose={() => setEditingStock(null)}
          onSuccess={handlePtThresholdSuccess}
        />
      )}
    </AppLayout>
  );
}
