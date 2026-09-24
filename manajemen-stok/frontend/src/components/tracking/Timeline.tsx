'use client';

import React, { useState } from 'react';
import { StockLot, StockTransaction } from '@/types';
import { TimelineEvent } from './TimelineEvent';
import { History, Layers, Clock, AlertCircle } from 'lucide-react';

interface TimelineProps {
  lots: StockLot[];
  transactions: StockTransaction[];
  loading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ lots, transactions, loading = false }) => {
  const [viewMode, setViewMode] = useState<'LOTS' | 'ALL_TRANSACTIONS'>('LOTS');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Riwayat Pergerakan & Durasi Simpan (Stock Journey)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan siklus hidup stok dari barang masuk (IN) hingga pengiriman ke customer (OUT)
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('LOTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'LOTS'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Siklus Lot & Aging ({lots.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ALL_TRANSACTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'ALL_TRANSACTIONS'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Semua Scan ({transactions.length})
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div>
        {viewMode === 'LOTS' ? (
          lots.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Belum ada data Lot untuk part ini</p>
            </div>
          ) : (
            <div className="pt-2">
              {lots.map((lot) => (
                <TimelineEvent key={lot.id} lot={lot} isLotView={true} />
              ))}
            </div>
          )
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Belum ada riwayat transaksi scan untuk part ini</p>
          </div>
        ) : (
          <div className="pt-2">
            {transactions.map((tx) => (
              <TimelineEvent key={tx.id} transaction={tx} isLotView={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
