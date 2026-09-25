'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockJourneyCard } from '@/components/tracking/StockJourneyCard';
import {
  getPartTracking,
  getMasterParts,
  getCustomerPts,
  getCurrentUser,
} from '@/utils/api';
import { MasterPart, StockLot, StockTransaction, User } from '@/types';
import {
  AlertCircle,
  History,
} from 'lucide-react';

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPartNumber = searchParams.get('partNumber') || '';

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [allParts, setAllParts] = useState<MasterPart[]>([]);
  const [selectedPt, setSelectedPt] = useState<string>('ALL');
  const [selectedPartNo, setSelectedPartNo] = useState<string>(initialPartNumber);
  const [selectedPart, setSelectedPart] = useState<MasterPart | null>(null);
  const [partLots, setPartLots] = useState<StockLot[]>([]);
  const [partTransactions, setPartTransactions] = useState<StockTransaction[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    loadInitialData();
  }, [router]);

  const loadInitialData = async () => {
    try {
      const [partsRes, ptsRes] = await Promise.all([
        getMasterParts(),
        getCustomerPts(),
      ]);
      setAllParts(partsRes || []);
      setCustomerPts(ptsRes || []);

      // If initial part number is present in URL, select it, otherwise select the first part
      const targetPartNo = initialPartNumber || (partsRes.length > 0 ? partsRes[0].partNumber : '');
      if (targetPartNo) {
        setSelectedPartNo(targetPartNo);
        executeSearch(targetPartNo);
      }
    } catch (err) {
      console.error('Failed to load initial tracking data', err);
    }
  };

  const executeSearch = async (partNo: string) => {
    const clean = partNo.trim().toUpperCase();
    if (!clean) return;

    setTrackingLoading(true);
    setSearchError(null);

    const res = await getPartTracking(clean);
    setTrackingLoading(false);

    if (res.success && res.data) {
      setSelectedPart(res.data.part);
      setPartLots(res.data.lots);
      setPartTransactions(res.data.transactions);
      window.history.replaceState(null, '', `/tracking?partNumber=${encodeURIComponent(clean)}`);
    } else {
      setSelectedPart(null);
      setPartLots([]);
      setPartTransactions([]);
      setSearchError(res.error || `Part "${clean}" tidak ditemukan di database WHFG.`);
    }
  };

  // Filter parts list by selected PT
  const availableParts = React.useMemo(() => {
    if (!selectedPt || selectedPt === 'ALL') {
      return allParts;
    }
    return allParts.filter((p) => {
      const stocks = p.customerStocks || [];
      return stocks.some((s) => (s.customerPt || '').toLowerCase() === selectedPt.toLowerCase());
    });
  }, [allParts, selectedPt]);

  const handlePtChange = (pt: string) => {
    setSelectedPt(pt);
    let matchedParts = allParts;
    if (pt !== 'ALL') {
      matchedParts = allParts.filter((p) => {
        const stocks = p.customerStocks || [];
        return stocks.some((s) => (s.customerPt || '').toLowerCase() === pt.toLowerCase());
      });
    }
    if (matchedParts.length > 0) {
      const nextPart = matchedParts[0].partNumber;
      setSelectedPartNo(nextPart);
      executeSearch(nextPart);
    }
  };

  const handlePartSelect = (partNo: string) => {
    setSelectedPartNo(partNo);
    executeSearch(partNo);
  };

  return (
    <AppLayout title="Lacak Part">
      <div className="space-y-4">
        {/* Dropdown Selectors: Customer PT & Part Name */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Dropdown Customer PT */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Pilih Customer PT
              </label>
              <select
                value={selectedPt}
                onChange={(e) => handlePtChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">🏢 Semua Customer PT ({customerPts.length} PT)</option>
                {customerPts.map((pt, idx) => (
                  <option key={idx} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Scroll-down Dropdown Pilih Part (Nama Part & No Part) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Pilih Part ({availableParts.length} Tersedia)
              </label>
              <select
                value={selectedPartNo}
                onChange={(e) => handlePartSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="" disabled>-- Pilih Part / Komponen --</option>
                {availableParts.map((p) => (
                  <option key={p.id} value={p.partNumber}>
                    {p.partName} - [{p.partNumber}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {searchError && (
          <div className="p-4 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-white" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Selected Part Detail & Single Unified Stock Journey Card */}
        {selectedPart && (
          <StockJourneyCard
            part={selectedPart}
            lots={partLots}
            transactions={partTransactions}
            loading={trackingLoading}
            selectedPt={selectedPt}
          />
        )}

        {/* Empty State when no part selected */}
        {!selectedPart && !trackingLoading && !searchError && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <History className="w-12 h-12 mx-auto text-blue-600 opacity-40" />
            <h3 className="text-base font-bold text-slate-900">
              Pilih Part dari Menu Dropdown di Atas
            </h3>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium">
          Memuat Lacak Part...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
