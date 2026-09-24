'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertOctagon, ArrowRight, X } from 'lucide-react';
import { ScanResult } from '@/types';

interface FeedbackModalProps {
  result: ScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  autoCloseMs?: number;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  result,
  isOpen,
  onClose,
  autoCloseMs = 2800,
}) => {
  useEffect(() => {
    if (isOpen && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen || !result) return null;

  const isSuccess = result.success;
  const isDuplicate = !isSuccess && (
    result.message?.toLowerCase().includes('sudah discan') ||
    result.error?.toLowerCase().includes('sudah discan')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-lg p-6 sm:p-8 text-center shadow-2xl border-2 transition-all transform scale-100 ${
          isSuccess
            ? 'bg-white border-emerald-500 shadow-emerald-500/20'
            : 'bg-white border-red-500 shadow-red-500/20'
        }`}
      >
        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-pulse">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Big Status Heading */}
        <h2
          className={`text-2xl sm:text-3xl font-black uppercase tracking-wider mb-2 ${
            isSuccess ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {isSuccess ? 'BERHASIL' : 'GAGAL'}
        </h2>

        {/* Message / Duplicate Error Text */}
        <p className="text-sm sm:text-base font-bold text-slate-800 mb-6">
          {isDuplicate
            ? 'Gagal karena sudah discan'
            : result.message || result.error || (isSuccess ? 'Transaksi Scan Berhasil Dicatat' : 'Gagal memproses scan')}
        </p>

        {/* Scanned Details (if available) */}
        {result.transaction && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left space-y-2 mb-6 font-medium text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Tipe Transaksi:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                  result.transaction.type === 'IN'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                SCAN {result.transaction.type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Part Number:</span>
              <span className="font-mono font-black text-slate-900">
                {result.transaction.partNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer PT:</span>
              <span className="font-bold text-blue-700">
                {result.transaction.customerPt}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Jumlah (Qty):</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {result.transaction.qty} pcs
              </span>
            </div>
            {result.transaction.originLineOrVendor && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Asal Line/Vendor:</span>
                <span className="text-slate-800">{result.transaction.originLineOrVendor}</span>
              </div>
            )}
            {result.transaction.destinationDoorOrPt && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tujuan:</span>
                <span className="text-slate-800">{result.transaction.destinationDoorOrPt}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full py-2.5 px-5 rounded-lg font-bold text-xs sm:text-sm text-white shadow-sm transition-all ${
            isSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Tutup &amp; Lanjutkan Scan
        </button>
      </div>
    </div>
  );
};
