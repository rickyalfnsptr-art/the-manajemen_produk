'use client';

import React from 'react';
import { MasterPart, PartCustomerStock } from '@/types';
import { Package, Building2, Layers, Clock } from 'lucide-react';
import { StockStatusBadge } from '../monitoring/StockStatusBadge';

interface StockInfoCardProps {
  part: MasterPart;
}

export const StockInfoCard: React.FC<StockInfoCardProps> = ({ part }) => {
  const customerStocks = part.customerStocks || [];
  const totalStock = customerStocks.reduce((sum, s) => sum + s.currentStock, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-mono font-black text-slate-900">{part.partNumber}</h2>
              {part.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                  {part.category}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 font-medium">{part.partName}</p>
          </div>
        </div>

        <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Total Stok di WHFG</span>
          <span className="font-mono text-2xl font-black text-blue-700">
            {totalStock.toLocaleString('id-ID')} <span className="text-sm font-sans font-bold text-slate-500">pcs</span>
          </span>
        </div>
      </div>

      {/* Breakdown per PT */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-slate-400" />
          Alokasi Stok & Status Kesehatan per Customer PT:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customerStocks.map((stock) => (
            <div
              key={stock.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 truncate" title={stock.customerPt}>
                  {stock.customerPt}
                </span>
                <StockStatusBadge
                  status={stock.stockStatus}
                  currentStock={stock.currentStock}
                  minStock={stock.minStock}
                  maxStock={stock.maxStock}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Min: <b>{stock.minStock}</b></span>
                <span className="text-slate-900 font-black">Stok: <b>{stock.currentStock}</b></span>
                <span className="text-slate-500">Max: <b>{stock.maxStock}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
