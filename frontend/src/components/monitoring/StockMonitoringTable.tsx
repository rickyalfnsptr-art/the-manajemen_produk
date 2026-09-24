'use client';

import React, { useState } from 'react';
import { PartCustomerStock } from '../../types';
import { StockStatusBadge } from './StockStatusBadge';
import { Search, Filter, ExternalLink, Settings, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface StockMonitoringTableProps {
  stocks: PartCustomerStock[];
  loading?: boolean;
  onEditThreshold?: (stock: PartCustomerStock) => void;
  userRole?: string;
}

export const StockMonitoringTable: React.FC<StockMonitoringTableProps> = ({
  stocks,
  loading = false,
  onEditThreshold,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter items
  const filtered = stocks.filter((item) => {
    const matchesSearch =
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerPt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || item.stockStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const canEdit = userRole === 'ADMIN' || userRole === 'PPIC';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Search and Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-50/50">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari part number, nama part, customer PT..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="NORMAL">🟢 Normal (Min &lt; Stok &lt; Max)</option>
              <option value="UNDER_MIN">🔴 Warning: &le; Min (Kritis)</option>
              <option value="OVER_MAX">🔴 Warning: &ge; Max (Overstock)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Part Number & Deskripsi</th>
              <th className="py-3 px-4">Customer PT</th>
              <th className="py-3 px-4 text-center">Batas Min</th>
              <th className="py-3 px-4 text-center">Batas Max</th>
              <th className="py-3 px-4 text-center">Stok Saat Ini</th>
              <th className="py-3 px-4 text-center">Status Stok</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="py-4 px-4 bg-slate-50/50">
                    <div className="h-5 bg-slate-200 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  Tidak ada data part yang cocok dengan pencarian / filter
                </td>
              </tr>
            ) : (
              paginated.map((item) => {
                const stockPercent =
                  item.maxStock > 0 ? Math.min(100, Math.round((item.currentStock / item.maxStock) * 100)) : 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
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

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.customerPt}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-600">
                      {item.minStock.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-600">
                      {item.maxStock.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono font-black text-base text-slate-900">
                        {item.currentStock.toLocaleString('id-ID')}
                      </div>
                      <div className="w-24 mx-auto bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.stockStatus === 'UNDER_MIN'
                              ? 'bg-red-500'
                              : item.stockStatus === 'OVER_MAX'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(5, Math.min(100, stockPercent))}%` }}
                        />
                      </div>
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
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/tracking?partNumber=${encodeURIComponent(item.partNumber)}`}
                          title="Lihat Tracking Timeline"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {canEdit && onEditThreshold && (
                          <button
                            type="button"
                            onClick={() => onEditThreshold(item)}
                            title="Atur Min/Max Stok PT Ini"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-slate-600">
        <div>
          Menampilkan <span className="font-bold text-slate-900">{paginated.length}</span> dari{' '}
          <span className="font-bold text-slate-900">{filtered.length}</span> alokasi part-PT
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
