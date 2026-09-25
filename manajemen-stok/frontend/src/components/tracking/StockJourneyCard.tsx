'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MasterPart, StockLot, StockTransaction } from '@/types';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { StockStatusBadge } from '../monitoring/StockStatusBadge';
import { Copy, Check, History, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface StockJourneyCardProps {
  part: MasterPart;
  lots?: StockLot[];
  transactions?: StockTransaction[];
  loading?: boolean;
  selectedPt?: string;
}

export const StockJourneyCard: React.FC<StockJourneyCardProps> = ({
  part,
  transactions = [],
  loading = false,
  selectedPt: initialSelectedPt = 'ALL',
}) => {
  const [copiedPart, setCopiedPart] = useState(false);
  const customerStocks = useMemo(() => part.customerStocks || [], [part.customerStocks]);

  // Selected PT name: controlled by prop or fallback
  const [selectedPt, setSelectedPt] = useState<string>(initialSelectedPt);

  useEffect(() => {
    if (initialSelectedPt) {
      setSelectedPt(initialSelectedPt);
    } else if (customerStocks.length > 0) {
      setSelectedPt(customerStocks[0].customerPt || 'ALL');
    }
  }, [initialSelectedPt, customerStocks]);

  // Active stock config (for the currently selected PT or aggregate)
  const activeStockConfig = useMemo(() => {
    if (customerStocks.length === 0) {
      return {
        customerPt: selectedPt && selectedPt !== 'ALL' ? selectedPt : 'Belum dialokasikan',
        customerPartNumber: null as string | null,
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
      };
    }

    if (selectedPt && selectedPt !== 'ALL') {
      const target = selectedPt.trim().toLowerCase();
      const found = customerStocks.find(
        (cs) => (cs.customerPt || '').trim().toLowerCase() === target
      );
      if (found) {
        return {
          customerPt: found.customerPt || selectedPt,
          customerPartNumber: found.customerPartNumber || null,
          currentStock: found.currentStock || 0,
          minStock: found.minStock || 0,
          maxStock: found.maxStock || 0,
        };
      }
    }

    // Aggregate (All PTs)
    const totalCurrent = customerStocks.reduce((sum, s) => sum + (s.currentStock || 0), 0);
    const totalMin = customerStocks.reduce((sum, s) => sum + (s.minStock || 0), 0);
    const totalMax = customerStocks.reduce((sum, s) => sum + (s.maxStock || 0), 0);

    return {
      customerPt: `Semua Customer (${customerStocks.length} PT)`,
      customerPartNumber: null as string | null,
      currentStock: totalCurrent,
      minStock: totalMin,
      maxStock: totalMax,
    };
  }, [customerStocks, selectedPt]);

  // Filter transactions according to selected PT
  const filteredTransactions = useMemo(() => {
    if (!selectedPt || selectedPt === 'ALL') {
      return transactions;
    }
    const target = selectedPt.trim().toLowerCase();
    return transactions.filter((tx) => {
      const txPt = (tx.customerPt || tx.destinationDoorOrPt || '').trim().toLowerCase();
      return txPt === target || txPt.includes(target) || target.includes(txPt);
    });
  }, [transactions, selectedPt]);

  // Real-time status calculation for the active stock
  const isUnderMin = activeStockConfig.minStock > 0 && activeStockConfig.currentStock <= activeStockConfig.minStock;
  const isOverMax = activeStockConfig.maxStock > 0 && activeStockConfig.currentStock >= activeStockConfig.maxStock;

  let calculatedStatus = 'NORMAL';
  if (isUnderMin) {
    calculatedStatus = 'UNDER_MIN';
  } else if (isOverMax) {
    calculatedStatus = 'OVER_MAX';
  }

  const stockPercent =
    activeStockConfig.maxStock > 0
      ? Math.min(100, Math.round((activeStockConfig.currentStock / activeStockConfig.maxStock) * 100))
      : 0;

  const handleCopyPart = () => {
    navigator.clipboard.writeText(part.partNumber);
    setCopiedPart(true);
    setTimeout(() => setCopiedPart(false), 1500);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const isSpecificPtSelected = selectedPt && selectedPt !== 'ALL';

  return (
    <div className="space-y-4">
      {/* 1. SINGLE UNIFIED HEADER: Part info & Customer Allocation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Part identity & PT Selector */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {part.partNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPart}
                  title="Salin Part Number"
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {copiedPart ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {part.category && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600 text-white shadow-2xs">
                    {part.category}
                  </span>
                )}
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <p className="text-sm sm:text-base font-bold text-slate-800 truncate">
                  {part.partName}
                </p>
              </div>

              {/* PT Allocation & Info Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {isSpecificPtSelected ? (
                  /* When specific PT is selected: show only that PT badge */
                  <>
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs inline-flex items-center gap-1">
                      <span>🏢 {activeStockConfig.customerPt}</span>
                      <span className="opacity-90 font-mono">({activeStockConfig.currentStock} pcs)</span>
                    </span>

                    {activeStockConfig.customerPartNumber && (
                      <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-xs text-slate-700 font-mono">
                        Cust Part: <b className="text-slate-900">{activeStockConfig.customerPartNumber}</b>
                      </span>
                    )}
                  </>
                ) : (
                  /* When 'Semua PT' is selected: show tabs to toggle between PTs */
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedPt('ALL')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                        selectedPt === 'ALL'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span>🏢 Semua PT ({customerStocks.length})</span>
                    </button>

                    {customerStocks.map((cs, idx) => {
                      const ptName = cs.customerPt || '';
                      const isSelected = selectedPt === ptName;

                      return (
                        <button
                          key={cs.id || idx}
                          type="button"
                          onClick={() => setSelectedPt(ptName)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span>{ptName}</span>
                          <span className="ml-1 opacity-90 font-mono font-bold">({cs.currentStock} pcs)</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {part.standardBoxQty ? (
                  <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-xs text-slate-600 font-medium">
                    Std: <b className="text-slate-900 font-bold">{part.standardBoxQty} pcs/box</b>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right: Stock Count & Min/Max Status Box */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs self-start lg:self-center min-w-[230px] sm:min-w-[250px] space-y-1.5 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  STATUS STOK WHFG
                </span>
                <StockStatusBadge
                  status={calculatedStatus}
                  currentStock={activeStockConfig.currentStock}
                  minStock={activeStockConfig.minStock}
                  maxStock={activeStockConfig.maxStock}
                />
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <span className="font-mono text-xl font-black text-slate-900">
                  {activeStockConfig.currentStock.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-bold text-slate-500">pcs</span>
                </span>
                <span className="text-xs text-slate-600 font-mono font-medium">
                  Min: <b className="text-red-600 font-bold">{activeStockConfig.minStock}</b> &bull; Max: <b className="text-slate-900 font-bold">{activeStockConfig.maxStock}</b>
                </span>
              </div>

              {/* Capacity Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isUnderMin
                      ? 'bg-red-600'
                      : isOverMax
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.max(5, stockPercent)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOG MUTASI TRANSAKSI (IN & OUT AUDIT TRAIL) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
              Log Mutasi Transaksi {isSpecificPtSelected ? `(${selectedPt})` : ''}
            </h3>
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-xs font-mono font-bold shadow-2xs">
              {filteredTransactions.length} Transaksi
            </span>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-1.5">
            <p className="text-sm font-bold text-slate-800">
              Belum ada catatan mutasi transaksi {selectedPt && selectedPt !== 'ALL' ? `untuk ${selectedPt}` : ''}
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Riwayat Scan IN, Scan OUT, dan Input Manual akan tercatat otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-10 text-center">No</th>
                  <th className="py-3 px-3.5">Waktu Transaksi</th>
                  <th className="py-3 px-3.5 text-center">Tipe Mutasi</th>
                  <th className="py-3 px-3.5 text-right">Jumlah (Qty)</th>
                  <th className="py-3 px-3.5 text-center">Perubahan Saldo</th>
                  <th className="py-3 px-3.5">Customer PT &amp; Line</th>
                  <th className="py-3 px-3.5">Operator &amp; Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.map((tx, idx) => {
                  const isIncoming = tx.type === 'IN' || tx.transactionType === 'SCAN_IN' || tx.transactionType === 'MANUAL_IN';

                  return (
                    <tr key={tx.id || idx} className="hover:bg-slate-50 transition-colors bg-white">
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800 text-xs">
                        {idx + 1}
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3.5 text-slate-950 font-bold whitespace-nowrap">
                        {formatIndonesianDateTime(tx.createdAt)}
                      </td>

                      {/* Tipe Badge */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase shadow-2xs ${
                            isIncoming
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isIncoming ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                          <span>{isIncoming ? 'MASUK (IN)' : 'KELUAR (OUT)'}</span>
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-3.5 text-right">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-md ${
                            isIncoming
                              ? 'text-blue-700 bg-blue-50 border border-blue-200'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {isIncoming ? `+${tx.qty.toLocaleString('id-ID')}` : `-${tx.qty.toLocaleString('id-ID')}`} pcs
                        </span>
                      </td>

                      {/* Saldo Stok Sebelum -> Sesudah */}
                      <td className="py-3 px-3.5 text-center font-mono font-black text-xs text-slate-950">
                        {tx.previousStock !== undefined && tx.currentStock !== undefined ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-slate-600 font-normal">{tx.previousStock}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="text-slate-950 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                              {tx.currentStock} pcs
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Customer PT & Line */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-950">{tx.customerPt}</div>
                        <div className="text-slate-700 text-[11px] font-medium">
                          Line/Tujuan: <b className="text-slate-900">{tx.originLineOrVendor || tx.destinationDoorOrPt || '-'}</b>
                        </div>
                      </td>

                      {/* Operator & Notes */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-950">
                          {tx.operatorName || 'Operator'}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-700 font-medium truncate max-w-[200px]" title={tx.notes}>
                            {tx.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockJourneyCard;
