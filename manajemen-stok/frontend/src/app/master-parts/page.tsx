'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { GroupedPartGrid } from '@/components/master/GroupedPartGrid';
import { PtThresholdModal } from '@/components/master/PtThresholdModal';
import { AddPartAllocationModal } from '@/components/master/AddPartAllocationModal';
import { PpicWhiteboardView } from '@/components/monitoring/PpicWhiteboardView';
import { StockStatusQuickFilter } from '@/components/monitoring/StockStatusQuickFilter';
import { StockStatusBadge } from '@/components/monitoring/StockStatusBadge';
import { getMasterParts, getCustomerPts, getCurrentUser } from '@/utils/api';
import { MasterPart, PartCustomerStock, User } from '@/types';
import { 
  Package, 
  Search, 
  Filter, 
  Sliders, 
  Building2, 
  Layers, 
  Table as TableIcon,
  LayoutGrid,
  PlusCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function MasterPartsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [parts, setParts] = useState<MasterPart[]>([]);
  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [selectedPt, setSelectedPt] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'WHITEBOARD' | 'TABLE' | 'CARDS'>('WHITEBOARD');
  const [editingStock, setEditingStock] = useState<PartCustomerStock | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [partsData, ptsData] = await Promise.all([
      getMasterParts(),
      getCustomerPts(),
    ]);
    setParts(partsData || []);
    setCustomerPts(ptsData || []);
    setLoading(false);
  };

  // Flatten all allocations for direct Part-PT table view safely
  const allAllocations: PartCustomerStock[] = [];
  parts.forEach((part) => {
    if (part.customerStocks && Array.isArray(part.customerStocks)) {
      part.customerStocks.forEach((cs) => {
        const ptName = cs.customerPt || (cs as any).customerName || 'PT LAINNYA';
        allAllocations.push({
          ...cs,
          customerPt: ptName,
          partNumber: part.partNumber || '',
          partName: part.partName || '',
          category: part.category || 'General',
        });
      });
    }
  });

  // Unique categories
  const categories = Array.from(
    new Set(parts.map((p) => p.category).filter(Boolean) as string[])
  ).sort();

  // Counts for status quick filter
  const underMinCount = allAllocations.filter(
    (s) => s.stockStatus === 'RED_MIN' || s.stockStatus === 'UNDER_MIN' || s.currentStock <= s.minStock
  ).length;
  const overMaxCount = allAllocations.filter(
    (s) => s.stockStatus === 'RED_MAX' || s.stockStatus === 'OVER_MAX' || s.currentStock >= s.maxStock
  ).length;
  const normalCount = allAllocations.length - underMinCount - overMaxCount;

  // Filter allocations safely by search, PT, category, and status
  const filteredAllocations = allAllocations.filter((item) => {
    const pNo = (item.partNumber || '').toLowerCase();
    const pName = (item.partName || '').toLowerCase();
    const cPt = (item.customerPt || '').toLowerCase();
    const sTerm = searchTerm.toLowerCase();

    const matchesSearch =
      !sTerm || pNo.includes(sTerm) || pName.includes(sTerm) || cPt.includes(sTerm);

    const matchesPt = selectedPt === 'ALL' || item.customerPt === selectedPt;
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;

    const isUnderMin =
      item.stockStatus === 'RED_MIN' ||
      item.stockStatus === 'UNDER_MIN' ||
      item.currentStock <= item.minStock;
    const isOverMax =
      item.stockStatus === 'RED_MAX' ||
      item.stockStatus === 'OVER_MAX' ||
      item.currentStock >= item.maxStock;
    const isNormal = !isUnderMin && !isOverMax;

    let matchesStatus = true;
    if (statusFilter === 'RED_MIN') matchesStatus = isUnderMin;
    else if (statusFilter === 'RED_MAX') matchesStatus = isOverMax;
    else if (statusFilter === 'GREEN_NORMAL') matchesStatus = isNormal;

    return matchesSearch && matchesPt && matchesCat && matchesStatus;
  });

  // Filter parts for grouped view
  const filteredParts = parts.filter((part) => {
    const pNo = (part.partNumber || '').toLowerCase();
    const pName = (part.partName || '').toLowerCase();
    const sTerm = searchTerm.toLowerCase();

    const matchesSearch =
      !sTerm ||
      pNo.includes(sTerm) ||
      pName.includes(sTerm) ||
      (part.customerStocks &&
        part.customerStocks.some((cs) =>
          ((cs.customerPt || (cs as any).customerName || '').toLowerCase()).includes(sTerm)
        ));

    const matchesPt =
      selectedPt === 'ALL' ||
      (part.customerStocks &&
        part.customerStocks.some(
          (cs) => (cs.customerPt || (cs as any).customerName) === selectedPt
        ));

    const matchesCat = categoryFilter === 'ALL' || part.category === categoryFilter;

    return matchesSearch && matchesPt && matchesCat;
  });

  const handleThresholdSuccess = (updated: PartCustomerStock) => {
    setParts((prev) =>
      prev.map((part) => ({
        ...part,
        customerStocks: part.customerStocks?.map((cs) =>
          cs.id === updated.id ? { ...cs, ...updated } : cs
        ),
      }))
    );
    loadData();
  };

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'PPIC';

  return (
    <AppLayout
      title="Ambang Batas"
      subtitle="Kontrol batas stok per Part &amp; Customer PT"
    >
      {/* 1. Main Clarity Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Ambang Batas Stok Part &amp; PT
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              Batas stok <strong>Min</strong> dan <strong>Max</strong> per alokasi Part &amp; Customer PT.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center flex-shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              + Alokasi Part
            </button>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('WHITEBOARD')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'WHITEBOARD'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Papan Kontrol
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabel Rinci
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Grup Part
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Status Quick Filters (🔴 Kritis / 🟡 Overstock / 🟢 Normal) */}
      <StockStatusQuickFilter
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        counts={{
          total: allAllocations.length,
          normal: normalCount,
          underMin: underMinCount,
          overMax: overMaxCount,
        }}
      />

      {/* 3. PT Customer Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Customer PT:
            </span>
          </div>

          {/* PT Dropdown */}
          <select
            value={selectedPt}
            onChange={(e) => setSelectedPt(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 max-w-sm truncate cursor-pointer shadow-xs"
          >
            <option value="ALL">🏢 Semua PT ({customerPts.length} Customer)</option>
            {customerPts.map((pt, idx) => (
              <option key={idx} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>

        {/* PT Quick Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { label: 'Semua PT', val: 'ALL' },
            { label: 'Toyota (TMMIN)', val: 'PT. TOYOTA MOTOR MANUFACTURING INDONESIA' },
            { label: 'Toyota Astra (TAM)', val: 'PT. TOYOTA ASTRA MOTOR' },
            { label: 'Daihatsu (ADM)', val: 'PT. ASTRA DAIHATSU MOTOR' },
            { label: 'Honda (HPPM)', val: 'PT. HONDA PRECISION PARTS MANUFACTURING' },
            { label: 'Suzuki (SIM)', val: 'PT. SUZUKI INDOMOBIL MOTOR' },
            { label: 'Isuzu (IAMI)', val: 'PT. ISUZU ASTRA MOTOR INDONESIA' },
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
      </div>

      {/* 4. Search & Category Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Part No, Nama Part, atau Customer PT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs"
          />
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer shadow-xs"
          >
            <option value="ALL">Semua Kategori ({categories.length})</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'WHITEBOARD' ? (
        /* WHITEBOARD VIEW WITH INSTANT STATUS FILTERING */
        <PpicWhiteboardView
          stocks={filteredAllocations}
          selectedPt={selectedPt}
          statusFilter={statusFilter}
          onEditThreshold={(stock) => setEditingStock(stock)}
          userRole={currentUser?.role}
        />
      ) : viewMode === 'TABLE' ? (
        /* FLAT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-600" />
              <span>
                Daftar Ambang Batas ({filteredAllocations.length} Alokasi)
              </span>
            </div>
            <span className="text-slate-500 text-[11px] font-normal">
              {canEdit ? 'Klik Ubah Min/Max untuk memperbarui batas' : 'Mode Hanya Lihat'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer PT</th>
                  <th className="py-3 px-4">Part Number &amp; Nama</th>
                  <th className="py-3 px-4 text-center">Min</th>
                  <th className="py-3 px-4 text-center">Max</th>
                  <th className="py-3 px-4 text-center">Stok Fisik</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-xs">
                      Tidak ada data alokasi part-PT yang cocok dengan filter
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.customerPt}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {item.partNumber}
                        </div>
                        <div className="text-xs text-slate-500 font-medium line-clamp-1">
                          {item.partName}
                        </div>
                        {item.category && (
                          <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {item.category}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                          {item.minStock} pcs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {item.maxStock} pcs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm">
                        {item.currentStock} pcs
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StockStatusBadge
                          status={item.stockStatus}
                          currentStock={item.currentStock}
                          minStock={item.minStock}
                          maxStock={item.maxStock}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => setEditingStock(item)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold border border-blue-200 transition-all flex items-center justify-center gap-1 mx-auto shadow-xs"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Ubah Min/Max
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GROUPED CARD VIEW */
        <GroupedPartGrid
          parts={filteredParts}
          onEditThreshold={(stock) => setEditingStock(stock)}
          userRole={currentUser?.role}
        />
      )}

      {/* Edit Threshold Modal */}
      {editingStock && (
        <PtThresholdModal
          stock={editingStock}
          isOpen={!!editingStock}
          onClose={() => setEditingStock(null)}
          onSuccess={handleThresholdSuccess}
        />
      )}

      {/* Add Part Allocation Modal */}
      <AddPartAllocationModal
        customerPts={customerPts}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </AppLayout>
  );
}
