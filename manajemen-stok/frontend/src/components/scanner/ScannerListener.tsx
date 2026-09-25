'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ArrowDownToLine, ArrowUpFromLine, Radio, MapPin } from 'lucide-react';
import { processScan } from '@/utils/api';
import { ScanResult } from '@/types';

interface ScannerListenerProps {
  onScanResult: (result: ScanResult) => void;
}

export const ScannerListener: React.FC<ScannerListenerProps> = ({
  onScanResult,
}) => {
  const [doorOrLine, setDoorOrLine] = useState<string>('PINTU-1');
  const [barcodeInputIn, setBarcodeInputIn] = useState<string>('');
  const [barcodeInputOut, setBarcodeInputOut] = useState<string>('');
  const [isProcessingIn, setIsProcessingIn] = useState(false);
  const [isProcessingOut, setIsProcessingOut] = useState(false);

  const inputInRef = useRef<HTMLInputElement>(null);
  const inputOutRef = useRef<HTMLInputElement>(null);

  // Focus IN input automatically on mount
  useEffect(() => {
    inputInRef.current?.focus();
  }, []);

  const handleScanSubmit = async (code: string, type: 'IN' | 'OUT') => {
    const trimmed = code.trim();
    if (!trimmed) return;

    if (type === 'IN') {
      if (isProcessingIn) return;
      setIsProcessingIn(true);
    } else {
      if (isProcessingOut) return;
      setIsProcessingOut(true);
    }

    const result = await processScan({
      rawQrCode: trimmed,
      type: type,
      doorOrLineLocation: doorOrLine,
    });

    if (type === 'IN') {
      setIsProcessingIn(false);
      setBarcodeInputIn('');
      inputInRef.current?.focus();
    } else {
      setIsProcessingOut(false);
      setBarcodeInputOut('');
      inputOutRef.current?.focus();
    }

    onScanResult(result);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Pintu / Lokasi Gudang Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pintu / Lokasi Gudang
            </label>
          </div>
        </div>

        <select
          value={doorOrLine}
          onChange={(e) => setDoorOrLine(e.target.value)}
          className="w-full sm:w-80 py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all cursor-pointer shadow-2xs"
        >
          <option value="PINTU-1">Pintu 1 (Line Machining A)</option>
          <option value="PINTU-2">Pintu 2 (Line Machining B)</option>
          <option value="PINTU-3">Pintu 3 (Line Stamping)</option>
          <option value="PINTU-VENDOR">Pintu Penerimaan Vendor</option>
          <option value="DOCK-DELIVERY-1">Dock 1 (Toyota / TAM)</option>
          <option value="DOCK-DELIVERY-2">Dock 2 (ADM / Suzuki / Honda)</option>
        </select>
      </div>

      {/* 1. KOTAK SCAN IN (ATAS - HIJAU) */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 space-y-2.5 transition-all focus-within:border-emerald-500 focus-within:bg-emerald-50/50">
        <div className="flex items-center gap-2 text-emerald-700 font-black text-xs sm:text-sm uppercase tracking-wider">
          <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
            <ArrowDownToLine className="w-4 h-4" />
          </span>
          SCAN IN (BARANG MASUK)
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <QrCode className={`w-5 h-5 ${isProcessingIn ? 'text-emerald-600 animate-spin' : 'text-emerald-500'}`} />
          </div>
          <input
            ref={inputInRef}
            type="text"
            value={barcodeInputIn}
            onChange={(e) => setBarcodeInputIn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleScanSubmit(barcodeInputIn, 'IN');
              }
            }}
            disabled={isProcessingIn}
            placeholder="Scan barcode Kanban untuk SCAN IN (Barang Masuk)..."
            className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 font-mono text-sm sm:text-base rounded-xl border border-emerald-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 outline-none placeholder-slate-400 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* 2. KOTAK SCAN OUT (BAWAH - MERAH) */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-red-200 bg-red-50/30 space-y-2.5 transition-all focus-within:border-red-500 focus-within:bg-red-50/50">
        <div className="flex items-center gap-2 text-red-700 font-black text-xs sm:text-sm uppercase tracking-wider">
          <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-2xs">
            <ArrowUpFromLine className="w-4 h-4" />
          </span>
          SCAN OUT (BARANG KELUAR)
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <QrCode className={`w-5 h-5 ${isProcessingOut ? 'text-red-600 animate-spin' : 'text-red-500'}`} />
          </div>
          <input
            ref={inputOutRef}
            type="text"
            value={barcodeInputOut}
            onChange={(e) => setBarcodeInputOut(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleScanSubmit(barcodeInputOut, 'OUT');
              }
            }}
            disabled={isProcessingOut}
            placeholder="Scan barcode Kanban untuk SCAN OUT (Barang Keluar)..."
            className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 font-mono text-sm sm:text-base rounded-xl border border-red-300 focus:border-red-600 focus:ring-4 focus:ring-red-500/15 outline-none placeholder-slate-400 transition-all shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};
