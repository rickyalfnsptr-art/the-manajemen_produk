'use client';

import React, { useState, useMemo } from 'react';
import { PartCustomerStock } from '../../types';
import { StockStatusBadge } from './StockStatusBadge';
import { SearchableCombobox, ComboboxOption } from '@/components/common/SearchableCombobox';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Package,
  Clock,
  ChevronRight as ChevronRightIcon,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface StockMonitoringTableProps {
  stocks: PartCustomerStock[];
  customerPts: string[];
  selectedPt: string;
  onSelectPt: (pt: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export const StockMonitoringTable: React.FC<StockMonitoringTableProps> = ({
  stocks,
  customerPts,
  selectedPt,
  onSelectPt,
  statusFilter,
  onStatusChange,
  loading = false,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 12;

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [stocks]);

  // PT Combobox options
  const ptOptions: ComboboxOption[] = useMemo(() => {
    return [
      { value: '', label: `🏢 Semua PT Customer (${customerPts.length} PT)` },
      ...customerPts.map((pt) => ({ value: pt, label: pt })),
    ];
  }, [customerPts]);

  // Handle Copy Part Number
  const handleCopyPartNo = (partNo: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(partNo);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter items
  const filtered = useMemo(() => {
    return stocks.filter((item) => {
      // PT filter
      if (selectedPt && item.customerPt !== selectedPt) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchPartNo = item.partNumber.toLowerCase().includes(q);
        const matchPartName = item.partName.toLowerCase().includes(q);
        const matchCustPt = item.customerPt.toLowerCase().includes(q);
        const matchCustPartNo = (item.customerPartNumber || '').toLowerCase().includes(q);
        if (!matchPartNo && !matchPartName && !matchCustPt && !matchCustPartNo) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const isUnderMin =
          item.stockStatus === 'RED_MIN' ||
          item.stockStatus === 'UNDER_MIN' ||
          item.currentStock <= item.minStock;
        const isOverMax =
          item.stockStatus === 'RED_MAX' ||
          item.stockStatus === 'OVER_MAX' ||
          item.currentStock >= item.maxStock;
        const isNormal = !isUnderMin && !isOverMax;

        if (statusFilter === 'NORMAL' || statusFilter === 'GREEN_NORMAL') {
          if (!isNormal) return false;
        }
        if (statusFilter === 'UNDER_MIN' || statusFilter === 'RED_MIN') {
          if (!isUnderMin) return false;
        }
        if (statusFilter === 'OVER_MAX' || statusFilter === 'RED_MAX') {
          if (!isOverMax) return false;
        }
      }

      return true;
    });
  }, [stocks, selectedPt, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* 1. Header Toolbar: Title + Refresh Button */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Daftar Stok WHFG
            </h2>
            <p className="text-xs text-slate-500">
              Status stok fisik &amp; batas Min/Max PT
            </p>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Muat ulang data stok"
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors shadow-2xs self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* 2. Filter Inputs Grid: PT Selector + Search + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-4">
          {/* Customer PT Dropdown (Searchable Combobox) */}
          <div className="lg:col-span-4">
            <SearchableCombobox
              value={selectedPt}
              onChange={(val) => {
                onSelectPt(val);
                setCurrentPage(1);
              }}
              options={ptOptions}
              placeholder="🏢 Semua PT Customer"
              searchPlaceholder="Cari PT (Toyota, Daihatsu...)"
              allowCustom={false}
            />
          </div>

          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Part No, Nama Part, CPN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Table Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-xs font-black text-slate-900 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              <th className="py-3.5 px-4">Part Number &amp; Nama</th>
              <th className="py-3.5 px-4">Customer PT</th>
              <th className="py-3.5 px-4 text-center">Min</th>
              <th className="py-3.5 px-4 text-center">Max</th>
              <th className="py-3.5 px-4 text-center">Stok Fisik</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-6 bg-slate-100 rounded-lg w-full" />
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400 space-y-2">
                  <Package className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
                  <p className="font-bold text-slate-900 text-sm">Tidak ada data part yang cocok</p>
                  <p className="text-xs text-slate-600 font-medium">
                    Coba ubah kata kunci pencarian atau ganti filter Customer PT / Status.
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                const maxVal = item.maxStock || 200;
                const stockPercent =
                  maxVal > 0 ? Math.min(100, Math.round((item.currentStock / maxVal) * 100)) : 0;
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
                    className="hover:bg-blue-50/50 transition-colors group bg-white"
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 text-xs">
                      {globalIdx}
                    </td>

                    {/* Part Number & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-blue-700 text-xs">
                          {item.partNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPartNo(item.partNumber, item.id, e)}
                          title="Salin Part Number"
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-slate-950 font-bold truncate max-w-[240px]" title={item.partName}>
                        {item.partName}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        {item.category && (
                          <span className="font-bold uppercase px-2 py-0.5 bg-slate-900 text-white rounded text-[10px]">
                            {item.category}
                          </span>
                        )}
                        {item.customerPartNumber && (
                          <span className="font-mono text-slate-700 font-semibold">
                            CPN: <b>{item.customerPartNumber}</b>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer PT */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-900 border border-slate-300 shadow-2xs">
                        {item.customerPt}
                      </span>
                    </td>

                    {/* Batas Min */}
                    <td className="py-3.5 px-4 text-center font-mono font-black text-red-700 text-xs">
                      {item.minStock.toLocaleString('id-ID')}
                    </td>

                    {/* Batas Max */}
                    <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-xs">
                      {item.maxStock.toLocaleString('id-ID')}
                    </td>

                    {/* Stok Saat Ini & Progress Gauge */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono font-black text-sm text-slate-950">
                        {item.currentStock.toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-bold text-slate-700">pcs</span>
                      </div>
                      <div className="w-24 mx-auto bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isUnderMin
                              ? 'bg-red-600'
                              : isOverMax
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(5, Math.min(100, stockPercent))}%` }}
                        />
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <StockStatusBadge
                        status={item.stockStatus}
                        currentStock={item.currentStock}
                        minStock={item.minStock}
                        maxStock={item.maxStock}
                      />
                    </td>

                    {/* Direct Tracking Action */}
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/tracking?partNumber=${encodeURIComponent(item.partNumber)}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1 shadow-2xs group"
                        title="Lacak Part Ini"
                      >
                        <Search className="w-3.5 h-3.5 text-white" />
                        <span>Lacak</span>
                        <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-bold text-slate-900">{paginated.length}</span> dari{' '}
          <span className="font-bold text-slate-900">{filtered.length}</span> total alokasi part
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-700 px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockMonitoringTable;
