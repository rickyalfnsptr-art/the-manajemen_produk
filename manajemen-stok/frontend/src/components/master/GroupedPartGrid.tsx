'use client';

import React, { useState } from 'react';
import { MasterPart, PartCustomerStock } from '@/types';
import { Package, Building2, Sliders, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { StockStatusBadge } from '../monitoring/StockStatusBadge';

interface GroupedPartGridProps {
  parts: MasterPart[];
  onEditThreshold: (stock: PartCustomerStock) => void;
  userRole?: string;
}

export const GroupedPartGrid: React.FC<GroupedPartGridProps> = ({
  parts,
  onEditThreshold,
  userRole,
}) => {
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({});

  const toggleExpand = (partId: string) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const canEdit = userRole === 'ADMIN' || userRole === 'PPIC';

  return (
    <div className="space-y-4">
      {parts.map((part) => {
        const isExpanded = !!expandedParts[part.id];
        const allocations = part.customerStocks || [];
        const totalStock = allocations.reduce((acc, curr) => acc + curr.currentStock, 0);

        return (
          <div
            key={part.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
          >
            {/* Header / Summary row */}
            <div
              onClick={() => toggleExpand(part.id)}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {part.partNumber}
                    </span>
                    {part.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {part.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{part.partName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Customer Terdaftar</div>
                  <div className="text-sm font-bold text-slate-800">
                    {allocations.length} PT Customer
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Total Stok WHFG</div>
                  <div className="font-mono font-black text-base text-blue-700">
                    {totalStock.toLocaleString('id-ID')} pcs
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Customer Allocations & Thresholds */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/40">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Rincian Stok & Batas Min/Max per Customer PT:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allocations.map((stock) => (
                    <div
                      key={stock.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-md text-xs font-black bg-blue-50 text-blue-800 border border-blue-100">
                            {stock.customerPt}
                          </span>
                          <StockStatusBadge
                            status={stock.stockStatus}
                            currentStock={stock.currentStock}
                            minStock={stock.minStock}
                            maxStock={stock.maxStock}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-lg my-2 font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Min</div>
                            <div className="text-xs font-bold text-slate-700">{stock.minStock}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Stok</div>
                            <div className="text-xs font-black text-slate-900">{stock.currentStock}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Max</div>
                            <div className="text-xs font-bold text-slate-700">{stock.maxStock}</div>
                          </div>
                        </div>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditThreshold({
                              ...stock,
                              partNumber: part.partNumber,
                              partName: part.partName,
                              category: part.category,
                            });
                          }}
                          className="mt-2 w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Ubah Min / Max PT Ini
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
