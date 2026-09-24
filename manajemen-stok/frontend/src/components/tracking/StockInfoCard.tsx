'use client';

import React, { useState } from 'react';
import { MasterPart, PartCustomerStock } from '@/types';
import {
  Package,
  Building2,
  Layers,
  Clock,
  MapPin,
  Box,
  Copy,
  Check,
  TrendingUp,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { StockStatusBadge } from '../monitoring/StockStatusBadge';

interface StockInfoCardProps {
  part: MasterPart;
}

export const StockInfoCard: React.FC<StockInfoCardProps> = ({ part }) => {
  const customerStocks = part.customerStocks || [];
  const totalStock = customerStocks.reduce((sum, s) => sum + s.currentStock, 0);
  const [copied, setCopied] = useState(false);

  const handleCopyPartNo = () => {
    navigator.clipboard.writeText(part.partNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-lg shadow-md flex-shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-mono font-black text-slate-900 tracking-tight">
                {part.partNumber}
              </h2>
              <button
                type="button"
                onClick={handleCopyPartNo}
                title="Salin Part Number"
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              {part.category && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  {part.category}
                </span>
              )}
            </div>
            <p className="text-base text-slate-700 font-semibold">{part.partName}</p>

            {/* Sub meta badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
              {part.standardBoxQty ? (
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-slate-700">
                  <Box className="w-3.5 h-3.5 text-slate-500" />
                  Std Qty: <b>{part.standardBoxQty} pcs/box</b>
                </span>
              ) : null}
              {part.location && (
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Lokasi: <b>{part.location}</b>
                </span>
              )}
              {part.defaultLine && (
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Line: <b>{part.defaultLine}</b>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Stock in WHFG KPI */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-lg flex items-center gap-4 self-start lg:self-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Stok di WHFG
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-3xl font-black text-blue-700">
                {totalStock.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-slate-500">pcs</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Teralokasi ke <b>{customerStocks.length} PT Customer</b>
            </span>
          </div>
        </div>
      </div>

      {/* Customer PT Allocations breakdown */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          Alokasi Stok & Ambang Batas Min/Max per Customer PT:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {customerStocks.map((stock) => {
            const maxVal = stock.maxStock || 200;
            const pct = Math.min(100, Math.round((stock.currentStock / maxVal) * 100));
            const isRed = stock.stockStatus === 'UNDER_MIN' || stock.stockStatus === 'OVER_MAX' || stock.stockStatus === 'RED_MIN' || stock.stockStatus === 'RED_MAX';

            return (
              <div
                key={stock.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate" title={stock.customerPt}>
                      {stock.customerPt}
                    </span>
                    <StockStatusBadge
                      status={stock.stockStatus}
                      currentStock={stock.currentStock}
                      minStock={stock.minStock}
                      maxStock={stock.maxStock}
                    />
                  </div>
                  {stock.customerPartNumber && (
                    <span className="text-[11px] font-mono text-slate-500 block">
                      Cust Part: <b>{stock.customerPartNumber}</b>
                    </span>
                  )}
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Min: {stock.minStock}</span>
                    <span className="font-bold text-slate-800">
                      Stok: <span className="font-black text-blue-700">{stock.currentStock}</span>
                    </span>
                    <span>Max: {stock.maxStock}</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isRed
                          ? stock.currentStock <= stock.minStock
                            ? 'bg-red-600'
                            : 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
