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
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-600 text-white shadow-2xs whitespace-nowrap">
        Kritis (&le; {minStock})
      </span>
    );
  }

  if (status === 'OVER_MAX' || status === 'RED_MAX' || (maxStock > 0 && currentStock >= maxStock)) {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-white shadow-2xs whitespace-nowrap">
        Overstock (&ge; {maxStock})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
      Aman (Normal)
    </span>
  );
};

export default StockStatusBadge;
