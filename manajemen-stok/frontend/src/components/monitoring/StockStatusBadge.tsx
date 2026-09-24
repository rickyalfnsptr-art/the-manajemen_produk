import React from 'react';
import { StockStatus } from '../../types';
import { AlertTriangle, CheckCircle, Flame, TrendingDown, TrendingUp } from 'lucide-react';

interface StockStatusBadgeProps {
  status: StockStatus | string;
  currentStock: number;
  minStock: number;
  maxStock: number;
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  status,
  currentStock,
  minStock,
  maxStock,
}) => {
  if (status === 'UNDER_MIN' || status === 'RED_MIN' || (minStock > 0 && currentStock <= minStock)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
        <TrendingDown className="w-3.5 h-3.5 text-red-600" />
        <span>🔴 KRITIS (&le; {minStock})</span>
      </span>
    );
  }

  if (status === 'OVER_MAX' || status === 'RED_MAX' || (maxStock > 0 && currentStock >= maxStock)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
        <span>🔴 OVERSTOCK (&ge; {maxStock})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
      <span>🟢 NORMAL</span>
    </span>
  );
};

export default StockStatusBadge;
