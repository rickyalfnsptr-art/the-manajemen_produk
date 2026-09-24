'use client';

import React from 'react';
import { StockLot, StockTransaction } from '@/types';
import { formatIndonesianDateTime, formatDuration } from '@/utils/dateUtils';
import { ArrowDownToLine, ArrowUpFromLine, Clock, User, Building2, MapPin, Tag } from 'lucide-react';

interface TimelineEventProps {
  lot?: StockLot;
  transaction?: StockTransaction;
  isLotView?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ lot, transaction, isLotView = false }) => {
  if (isLotView && lot) {
    const isStillInStock = lot.status === 'IN_STOCK';
    const inDate = new Date(lot.createdAt);
    const outDate = lot.outTimestamp ? new Date(lot.outTimestamp) : new Date();
    const duration = formatDuration(inDate, outDate);

    return (
      <div className="relative pl-8 pb-8 group">
        {/* Vertical connector line */}
        <div className="absolute left-3.5 top-3.5 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />

        {/* Node Icon */}
        <div
          className={`absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm ${
            isStillInStock ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          {isStillInStock ? (
            <ArrowDownToLine className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpFromLine className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900">
                Lot: {lot.lotNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  isStillInStock
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isStillInStock ? 'Sedang di Gudang WHFG' : 'Sudah Keluar (Delivered)'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              Qty: {lot.qty} pcs
            </span>
          </div>

          {/* Grid of details following MTM template format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Kapan IN & Asal */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kapan Masuk (IN) & Asal
              </span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {formatIndonesianDateTime(lot.createdAt)}
              </div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Asal: <b>{lot.originLineOrVendor || '-'}</b>
              </div>
            </div>

            {/* Kapan OUT & Tujuan */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kapan Keluar (OUT) & PT Tujuan
              </span>
              {lot.outTimestamp ? (
                <>
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {formatIndonesianDateTime(lot.outTimestamp)}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Tujuan: <b>{lot.customerPt}</b>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 italic py-1">Belum ada transaksi OUT</div>
              )}
            </div>

            {/* Dwell Time / Berapa Lama IN */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Berapa Lama IN (Durasi Simpan)
              </span>
              <div className="font-bold text-amber-700 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                {duration}
              </div>
              <div className="text-slate-500 text-[11px]">
                {isStillInStock ? 'Dihitung hingga saat ini' : 'Durasi total hingga keluar'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback transaction view
  if (!transaction) return null;
  const isIn = transaction.type === 'IN';

  return (
    <div className="relative pl-8 pb-6 group">
      <div className="absolute left-3.5 top-3.5 bottom-0 w-0.5 bg-slate-200 group-last:hidden" />
      <div
        className={`absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm ${
          isIn ? 'bg-blue-600' : 'bg-emerald-600'
        }`}
      >
        {isIn ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                isIn ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              SCAN {transaction.type}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {formatIndonesianDateTime(transaction.createdAt)}
            </span>
          </div>
          <span className="font-mono font-bold text-sm text-slate-900">
            {transaction.qty} pcs
          </span>
        </div>

        <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <div>Customer PT: <b>{transaction.customerPt}</b></div>
          <div>Operator: <b>{transaction.operatorName || 'System'}</b></div>
          {transaction.originLineOrVendor && (
            <div>Asal: <b>{transaction.originLineOrVendor}</b></div>
          )}
          {transaction.destinationDoorOrPt && (
            <div>Tujuan: <b>{transaction.destinationDoorOrPt}</b></div>
          )}
        </div>
      </div>
    </div>
  );
};
