'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScannerListener } from '@/components/scanner/ScannerListener';
import { FeedbackModal } from '@/components/scanner/FeedbackModal';
import { ManualInputModal } from '@/components/scanner/ManualInputModal';
import { getRecentTransactions, getCustomerPts, getCurrentUser } from '@/utils/api';
import { ScanResult, StockTransaction, User } from '@/types';
import { formatIndonesianDateTime } from '@/utils/dateUtils';
import { QrCode, ClipboardEdit, History, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([]);
  const [customerPts, setCustomerPts] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    loadRecent();
    loadPts();
  }, [router]);

  const loadRecent = async () => {
    const txs = await getRecentTransactions(15);
    setRecentTransactions(txs);
  };

  const loadPts = async () => {
    const pts = await getCustomerPts();
    setCustomerPts(pts);
  };

  const handleScanResult = (result: ScanResult) => {
    setScanResult(result);
    setIsFeedbackOpen(true);
    if (result.success) {
      loadRecent();
    }
  };

  const handleManualSuccess = (result: ScanResult) => {
    setScanResult(result);
    setIsFeedbackOpen(true);
    loadRecent();
  };

  return (
    <AppLayout
      title="Terminal Scanner Barcode WHFG"
      subtitle="Scan Barcode / QR Kanban Barang Masuk (IN) & Barang Keluar (OUT) WHFG"
    >
          {/* Header Action Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                <QrCode className="w-4 h-4" />
                Live Barcode Scanner Engine
              </div>
              <h2 className="text-xl font-black">Scan Barcode / QR Kanban Part Finish Good</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Arahkan barcode scanner handheld ke kode Kanban. Sistem otomatis memproses transaksi dan menolak duplikasi barcode dengan pesan <em>"Gagal karena sudah discan"</em>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all flex-shrink-0"
            >
              <ClipboardEdit className="w-4 h-4" />
              Input Manual Fallback
            </button>
          </div>

          {/* Core Scanner Input Box */}
          <ScannerListener onScanResult={handleScanResult} />

          {/* Recent Scan History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Riwayat Scan Terakhir di Gudang WHFG
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Total {recentTransactions.length} aktivitas terbaru
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Part Number</th>
                    <th className="py-3 px-4">Customer PT</th>
                    <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
                    <th className="py-3 px-4">Asal / Tujuan</th>
                    <th className="py-3 px-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium text-xs">
                        Belum ada transaksi scan hari ini
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-xs font-medium text-slate-600">
                          {formatIndonesianDateTime(tx.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                              tx.type === 'IN'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.type === 'IN' ? (
                              <ArrowDownToLine className="w-3 h-3" />
                            ) : (
                              <ArrowUpFromLine className="w-3 h-3" />
                            )}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                          {tx.partNumber}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                          {tx.customerPt}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-xs">
                          {tx.qty} pcs
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {tx.type === 'IN'
                            ? tx.originLineOrVendor || '-'
                            : tx.destinationDoorOrPt || '-'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                          {tx.operatorName || 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* Instant Feedback Modal */}
      <FeedbackModal
        result={scanResult}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Fallback Manual Modal */}
      <ManualInputModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={handleManualSuccess}
        customerPts={customerPts}
      />
    </AppLayout>
  );
}
