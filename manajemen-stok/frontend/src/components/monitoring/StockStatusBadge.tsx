'use client';

import React from 'react';
import { StockStatus } from '../../types';

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
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white shadow-2xs whitespace-nowrap">
        Kritis
      </span>
    );
  }

  if (status === 'OVER_MAX' || status === 'RED_MAX' || (maxStock > 0 && currentStock >= maxStock)) {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white shadow-2xs whitespace-nowrap">
        Overstock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
      Aman
    </span>
  );
};

export default StockStatusBadge;

