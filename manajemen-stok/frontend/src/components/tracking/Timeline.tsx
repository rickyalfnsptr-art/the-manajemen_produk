'use client';

import React, { useState, useMemo } from 'react';
import { StockLot, StockTransaction } from '@/types';
import { TimelineEvent } from './TimelineEvent';
import { History, Layers, Clock, Filter, ArrowUpDown, Sparkles, CheckCircle2 } from 'lucide-react';

interface TimelineProps {
  lots: StockLot[];
  transactions: StockTransaction[];
  loading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ lots, transactions, loading = false }) => {
  const [viewMode, setViewMode] = useState<'LOTS' | 'ALL_TRANSACTIONS'>('LOTS');
  const [lotStatusFilter, setLotStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_STOCK'>('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const filteredLots = useMemo(() => {
    let result = [...lots];
    if (lotStatusFilter !== 'ALL') {
      result = result.filter((l) => l.status === lotStatusFilter);
    }
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [lots, lotStatusFilter, sortOrder]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header with Switcher & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Riwayat Perjalanan Stok & Kronologi Aging (Stock Journey)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kronologi siklus hidup lot box dari waktu masuk (IN), line asal, durasi mengendap (dwell time), hingga pengiriman (OUT)
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
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
              Log Scan ({transactions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Lot Specific Filters & Sorting Toolbar */}
      {viewMode === 'LOTS' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'ALL', label: `Semua (${lots.length})` },
                  { id: 'IN_STOCK', label: `Di Gudang (${lots.filter((l) => l.status === 'IN_STOCK').length})` },
                  { id: 'OUT_STOCK', label: `Terkirim (${lots.filter((l) => l.status === 'OUT_STOCK').length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLotStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    lotStatusFilter === f.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Urutan:
            </span>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition-colors"
            >
              {sortOrder === 'DESC' ? '✨ Terbaru Masuk' : '⏳ Terlama (FIFO)'}
            </button>
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="pt-2">
        {viewMode === 'LOTS' ? (
          filteredLots.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Layers className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
              <p className="font-bold text-slate-700">Belum ada data Lot yang sesuai</p>
              <p className="text-xs text-slate-500">
                {lotStatusFilter !== 'ALL'
                  ? 'Coba ganti filter status lot ke "Semua"'
                  : 'Belum ada transaksi penerimaan (Scan IN) untuk part ini.'}
              </p>
            </div>
          ) : (
            <div>
              {filteredLots.map((lot) => (
                <TimelineEvent key={lot.id} lot={lot} isLotView={true} />
              ))}
            </div>
          )
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <History className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
            <p className="font-bold text-slate-700">Belum ada riwayat transaksi scan</p>
            <p className="text-xs text-slate-500">
              Belum ada pencatatan scan IN maupun scan OUT untuk part ini.
            </p>
          </div>
        ) : (
          <div>
            {transactions.map((tx) => (
              <TimelineEvent key={tx.id} transaction={tx} isLotView={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
