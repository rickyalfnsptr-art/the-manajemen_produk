'use client';

import React, { useState } from 'react';
import { StockLot, StockTransaction } from '@/types';
import { formatIndonesianDateTime, formatDuration } from '@/utils/dateUtils';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  User,
  Building2,
  MapPin,
  Tag,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Hourglass,
} from 'lucide-react';

interface TimelineEventProps {
  lot?: StockLot;
  transaction?: StockTransaction;
  isLotView?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ lot, transaction, isLotView = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLotView && lot) {
    const isStillInStock = lot.status === 'IN_STOCK';
    const inDate = new Date(lot.createdAt);
    const outDate = lot.outTimestamp ? new Date(lot.outTimestamp) : new Date();
    const duration = lot.dwellFormatted || formatDuration(inDate, outDate);
    const agingCat = lot.agingCategory || 'NORMAL';

    return (
      <div className="relative pl-8 pb-8 group">
        {/* Vertical connector line */}
        <div className="absolute left-3.5 top-3.5 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />

        {/* Node Icon */}
        <div
          className={`absolute left-0 top-2 w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md transition-transform group-hover:scale-110 ${
            isStillInStock
              ? agingCat === 'CRITICAL'
                ? 'bg-red-600'
                : agingCat === 'WARNING'
                ? 'bg-amber-500'
                : 'bg-blue-600'
              : 'bg-emerald-600'
          }`}
        >
          {isStillInStock ? (
            <ArrowDownToLine className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {lot.lotNumber}
              </span>
              <button
                type="button"
                onClick={() => handleCopyTag(lot.lotNumber)}
                title="Salin Barcode Tag"
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isStillInStock
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isStillInStock ? 'Sedang di WHFG' : 'Sudah Keluar (Delivered)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                Kuantitas: <b>{lot.qty.toLocaleString('id-ID')} pcs</b>
              </span>
            </div>
          </div>

          {/* 3-Step Journey Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Step 1: Penerimaan IN */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <ArrowDownToLine className="w-3 h-3 text-blue-600" /> 1. Penerimaan (Scan IN)
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>{formatIndonesianDateTime(lot.createdAt)}</span>
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Asal: <b>{lot.originLineOrVendor || '-'}</b></span>
              </div>
            </div>

            {/* Step 2: Durasi Simpan (Aging) */}
            <div
              className={`p-3.5 rounded-xl border space-y-1.5 ${
                agingCat === 'CRITICAL'
                  ? 'bg-red-50/80 border-red-200'
                  : agingCat === 'WARNING'
                  ? 'bg-amber-50/80 border-amber-200'
                  : 'bg-slate-50/80 border-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Hourglass className="w-3 h-3 text-amber-600" /> 2. Durasi Simpan (Aging)
              </span>
              <div
                className={`font-black text-sm flex items-center gap-1.5 ${
                  agingCat === 'CRITICAL'
                    ? 'text-red-700'
                    : agingCat === 'WARNING'
                    ? 'text-amber-700'
                    : 'text-blue-700'
                }`}
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{duration}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {isStillInStock ? 'Dihitung hingga saat ini' : 'Total durasi hingga pengiriman'}
              </div>
            </div>

            {/* Step 3: Pengeluaran OUT */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <ArrowUpFromLine className="w-3 h-3 text-emerald-600" /> 3. Pengiriman (Scan OUT)
              </span>
              {lot.outTimestamp ? (
                <>
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{formatIndonesianDateTime(lot.outTimestamp)}</span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5 truncate" title={lot.customerPt}>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Tujuan: <b>{lot.customerPt}</b></span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 italic py-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                  <span>Sedang disimpan di Gudang WHFG</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback Transaction Log view
  if (!transaction) return null;
  const isIn = transaction.type === 'IN' || transaction.type === 'SCAN_IN' || transaction.type === 'MANUAL_IN';

  return (
    <div className="relative pl-8 pb-6 group">
      <div className="absolute left-3.5 top-3.5 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />
      <div
        className={`absolute left-0 top-2 w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md ${
          isIn ? 'bg-blue-600' : 'bg-emerald-600'
        }`}
      >
        {isIn ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isIn ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              SCAN {transaction.type}
            </span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatIndonesianDateTime(transaction.createdAt)}
            </span>
          </div>
          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
            {transaction.qty.toLocaleString('id-ID')} pcs
          </span>
        </div>

        <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <div>Customer PT: <b>{transaction.customerPt}</b></div>
          <div>Operator: <b>{transaction.operatorName || 'System'}</b></div>
          {transaction.originLineOrVendor && (
            <div>Asal Line: <b>{transaction.originLineOrVendor}</b></div>
          )}
        </div>
      </div>
    </div>
  );
};
