'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StockInfoCard } from '@/components/tracking/StockInfoCard';
import { Timeline } from '@/components/tracking/Timeline';
import { getPartTracking, getMasterParts, getCurrentUser } from '@/utils/api';
import { MasterPart, StockLot, StockTransaction, User } from '@/types';
import { Search, Package, Clock, History, AlertCircle, ArrowRight } from 'lucide-react';

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPartNumber = searchParams.get('partNumber') || '';

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialPartNumber);
  const [selectedPart, setSelectedPart] = useState<MasterPart | null>(null);
  const [lots, setLots] = useState<StockLot[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popularParts, setPopularParts] = useState<MasterPart[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    loadPopularParts();
  }, [router]);

  const loadPopularParts = async () => {
    const parts = await getMasterParts();
    setPopularParts(parts.slice(0, 8));
  };

  const executeSearch = async (partNo: string) => {
    const clean = partNo.trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setError(null);

    const res = await getPartTracking(clean);
    setLoading(false);

    if (res.success && res.data) {
      setSelectedPart(res.data.part);
      setLots(res.data.lots);
      setTransactions(res.data.transactions);
      // Update URL without reload
      window.history.replaceState(null, '', `/tracking?partNumber=${encodeURIComponent(clean)}`);
    } else {
      setSelectedPart(null);
      setLots([]);
      setTransactions([]);
      setError(res.error || `Part number "${clean}" tidak ditemukan di database WHFG.`);
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
      title="Stock Journey & Aging Tracker"
      subtitle="Lacak siklus hidup stok part, waktu IN, asal line, operator, waktu OUT, tujuan PT, dan durasi simpan (Dwell Time)"
    >
          {/* Search Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik Part Number (contoh: 45107-BZ010, 45102-BZ020)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all flex-shrink-0"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Mencari...' : 'Lacak Siklus Stok'}
              </button>
            </form>

            {/* Quick Part Suggestions */}
            {popularParts.length > 0 && !selectedPart && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Rekomendasi Part Number Terdaftar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularParts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSearchTerm(p.partNumber);
                        executeSearch(p.partNumber);
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-mono font-semibold text-slate-700 transition-colors"
                    >
                      {p.partNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selected Part Detail & Timeline */}
          {selectedPart && (
            <div className="space-y-6">
              <StockInfoCard part={selectedPart} />
              <Timeline lots={lots} transactions={transactions} loading={loading} />
            </div>
          )}

          {/* Empty state when no part selected */}
          {!selectedPart && !loading && !error && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <Clock className="w-12 h-12 mx-auto opacity-30 text-blue-600" />
              <h3 className="text-base font-bold text-slate-700">
                Masukkan Part Number untuk Memulai Pelacakan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sistem akan menampilkan ringkasan stok per Customer PT dan kronologi riwayat masuk/keluar serta kalkulasi durasi simpan (Aging) di WHFG.
              </p>
            </div>
          )}
        </AppLayout>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          Memuat Tracking...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
