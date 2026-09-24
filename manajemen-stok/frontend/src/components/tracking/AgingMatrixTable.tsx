'use client';

import React, { useState, useMemo } from 'react';
import { StockLot } from '@/types';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import {
  Layers,
  Search,
  Filter,
  Building2,
  Clock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

interface AgingMatrixTableProps {
  lots: StockLot[];
  customerPts: string[];
  selectedPt: string;
  onSelectPt: (pt: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onTrackPart: (partNumber: string) => void;
  loading?: boolean;
}

export const AgingMatrixTable: React.FC<AgingMatrixTableProps> = ({
  lots,
  customerPts,
  selectedPt,
  onSelectPt,
  selectedCategory,
  onSelectCategory,
  onTrackPart,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_STOCK'>('IN_STOCK');
  const [sortBy, setSortBy] = useState<'OLDEST_FIFO' | 'NEWEST' | 'QTY_DESC'>('OLDEST_FIFO');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyTag = (tag: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tag);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      // PT Filter
      if (selectedPt && selectedPt !== 'ALL' && lot.customerPt !== selectedPt) {
        return false;
      }
      // Status Filter
      if (statusFilter !== 'ALL' && lot.status !== statusFilter) {
        return false;
      }
      // Category Filter
      if (selectedCategory && selectedCategory !== 'ALL' && lot.agingCategory !== selectedCategory) {
        return false;
      }
      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchPartNo = lot.partNumber.toLowerCase().includes(term);
        const matchPartName = (lot.partName || '').toLowerCase().includes(term);
        const matchCustPart = (lot.customerPartNumber || '').toLowerCase().includes(term);
        const matchLot = lot.lotNumber.toLowerCase().includes(term);
        const matchPt = lot.customerPt.toLowerCase().includes(term);
        if (!matchPartNo && !matchPartName && !matchCustPart && !matchLot && !matchPt) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'OLDEST_FIFO') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'QTY_DESC') {
        return b.qty - a.qty;
      }
      return 0;
    });
  }, [lots, selectedPt, statusFilter, selectedCategory, searchTerm, sortBy]);

  const getAgingBadge = (cat?: string, dwellFormatted?: string) => {
    switch (cat) {
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-600 text-white">
            <Sparkles className="w-3 h-3" />
            {dwellFormatted || '< 24 Jam'}
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-600 text-white">
            <Clock className="w-3 h-3" />
            {dwellFormatted || '1-3 Hari'}
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white">
            <AlertTriangle className="w-3 h-3" />
            {dwellFormatted || '3-7 Hari'}
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-600 text-white">
            <Flame className="w-3 h-3 text-white" />
            {dwellFormatted || '> 7 Hari'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-700 text-white">
            {dwellFormatted || '-'}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Matriks Aging &amp; FIFO Lot
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar lot tersimpan dan durasi aging di gudang
            </p>
          </div>

          {/* Quick Sort dropdown */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Urutan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OLDEST_FIFO">⏳ Terlama (FIFO)</option>
              <option value="NEWEST">✨ Terbaru Masuk</option>
              <option value="QTY_DESC">📦 Qty Terbanyak</option>
            </select>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* 1. Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Part No / Tag Lot / PT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* 2. PT Customer Selector */}
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedPt}
              onChange={(e) => onSelectPt(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="ALL">🏢 Semua PT Customer</option>
              {customerPts.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Category Aging Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="ALL">⏱️ Semua Rentang Aging</option>
              <option value="FRESH">🟢 Baru Masuk (&lt; 24 Jam)</option>
              <option value="NORMAL">🔵 Normal (1 - 3 Hari)</option>
              <option value="WARNING">🟡 Perhatian (3 - 7 Hari)</option>
              <option value="CRITICAL">🔴 Kritis (&gt; 7 Hari)</option>
            </select>
          </div>

          {/* 4. Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="IN_STOCK">📦 Di Gudang (Aktif)</option>
              <option value="OUT_STOCK">🚚 Sudah Keluar (OUT)</option>
              <option value="ALL">📋 Semua Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">No</th>
              <th className="py-3 px-4">Tag Lot</th>
              <th className="py-3 px-4">Part Number &amp; Nama</th>
              <th className="py-3 px-4">Customer PT</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4">Masuk (IN)</th>
              <th className="py-3 px-4">Durasi Aging</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="font-semibold text-xs">Memuat data lot & aging...</p>
                </td>
              </tr>
            ) : filteredLots.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                  <Layers className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                  <p className="font-bold text-slate-700">Tidak ada data Lot yang sesuai dengan filter</p>
                  <p className="text-[11px] text-slate-500">Coba ubah kriteria pencarian atau pilih PT Customer lain</p>
                </td>
              </tr>
            ) : (
              filteredLots.map((lot, idx) => {
                const isStillIn = lot.status === 'IN_STOCK';
                return (
                  <tr
                    key={lot.id || idx}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onTrackPart(lot.partNumber)}
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Lot Tag */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {lot.lotNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyTag(lot.lotNumber, lot.id, e)}
                          title="Salin Barcode Tag"
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {copiedId === lot.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Part Number & Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-700">{lot.partNumber}</div>
                      <div className="text-slate-600 text-[11px] truncate max-w-[200px]" title={lot.partName}>
                        {lot.partName || '-'}
                      </div>
                    </td>

                    {/* PT Customer & Line Asal */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-[11px] truncate max-w-[180px]" title={lot.customerPt}>
                        {lot.customerPt}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Asal: <span className="font-semibold text-slate-700">{lot.originLineOrVendor || '-'}</span>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {lot.qty.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Waktu Scan IN */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium text-[11px] whitespace-nowrap">
                      {formatIndonesianDateTime(lot.createdAt)}
                    </td>

                    {/* Aging / Dwell Duration */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>{getAgingBadge(lot.agingCategory, lot.dwellFormatted)}</div>
                        {isStillIn && (
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                lot.agingCategory === 'CRITICAL'
                                  ? 'bg-red-600'
                                  : lot.agingCategory === 'WARNING'
                                  ? 'bg-amber-500'
                                  : lot.agingCategory === 'NORMAL'
                                  ? 'bg-blue-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${lot.agingPercentage || 20}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Lot */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isStillIn
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isStillIn ? 'Di Gudang' : 'Terkirim'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackPart(lot.partNumber);
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto"
                      >
                        <span>Lacak</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Menampilkan <b>{filteredLots.length}</b> dari <b>{lots.length}</b> total lot data
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt; 24 Jam
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> 1-3 Hari
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 3-7 Hari
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt; 7 Hari (Kritis)
          </span>
        </div>
      </div>
    </div>
  );
};
