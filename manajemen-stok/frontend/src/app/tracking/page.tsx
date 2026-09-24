'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockJourneyCard } from '@/components/tracking/StockJourneyCard';
import {
  getPartTracking,
  getMasterParts,
  getCurrentUser,
} from '@/utils/api';
import { MasterPart, StockLot, StockTransaction, User } from '@/types';
import {
  Search,
  AlertCircle,
  Clock,
  History,
} from 'lucide-react';

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPartNumber = searchParams.get('partNumber') || '';

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Search & Part Tracker State
  const [searchTerm, setSearchTerm] = useState(initialPartNumber);
  const [selectedPart, setSelectedPart] = useState<MasterPart | null>(null);
  const [partLots, setPartLots] = useState<StockLot[]>([]);
  const [partTransactions, setPartTransactions] = useState<StockTransaction[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [popularParts, setPopularParts] = useState<MasterPart[]>([]);

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
      const partsRes = await getMasterParts();
      setPopularParts(partsRes.slice(0, 8));
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
      setSearchError(res.error || `Part number "${clean}" tidak ditemukan di database WHFG.`);
    }
  };

  useEffect(() => {
    if (initialPartNumber) {
      setSearchTerm(initialPartNumber);
      executeSearch(initialPartNumber);
    }
  }, [initialPartNumber]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchTerm);
  };

  return (
    <AppLayout
      title="Lacak Part"
      subtitle="Tracking stok fisik & log mutasi transaksi"
    >
      <div className="space-y-4">
        {/* Search Bar & Quick Part Suggestions */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-sm space-y-3.5">
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Ketik Part Number (contoh: BIPACK-BANTOL0000, 45107-BZ010)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-950 font-mono text-sm font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={trackingLoading || !searchTerm.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              {trackingLoading ? 'Mencari...' : 'Lacak Part'}
            </button>
          </form>

          {/* Quick Part Suggestions */}
          {popularParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-1">
                Rekomendasi Part:
              </span>
              {popularParts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSearchTerm(p.partNumber);
                    executeSearch(p.partNumber);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                    selectedPart?.partNumber === p.partNumber
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  {p.partNumber}
                </button>
              ))}
            </div>
          )}
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
          />
        )}

        {/* Empty State when no part selected */}
        {!selectedPart && !trackingLoading && !searchError && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400 space-y-3">
            <History className="w-12 h-12 mx-auto text-blue-600 opacity-40" />
            <h3 className="text-base font-bold text-slate-900">
              Masukkan Part Number untuk Memulai Pelacakan
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              Sistem akan menampilkan ringkasan stok fisik terkini, ambang batas Min/Max per PT Customer, serta seluruh riwayat mutasi transaksi Scan IN dan Scan OUT secara lengkap.
            </p>
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
