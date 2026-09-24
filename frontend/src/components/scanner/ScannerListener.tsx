'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ArrowDownToLine, ArrowUpFromLine, Zap, CheckCircle, Radio } from 'lucide-react';
import { processScan } from '@/utils/api';
import { ScanResult } from '@/types';

interface ScannerListenerProps {
  onScanResult: (result: ScanResult) => void;
  defaultMode?: 'IN' | 'OUT';
}

export const ScannerListener: React.FC<ScannerListenerProps> = ({
  onScanResult,
  defaultMode = 'IN',
}) => {
  const [scanType, setScanType] = useState<'IN' | 'OUT'>(defaultMode);
  const [doorOrLine, setDoorOrLine] = useState<string>('PINTU-1');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on mount & click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScanSubmit = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || isProcessing) return;

    setIsProcessing(true);
    const result = await processScan({
      rawQrCode: trimmed,
      type: scanType,
      doorOrLineLocation: doorOrLine,
    });
    setIsProcessing(false);
    setBarcodeInput('');
    onScanResult(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanSubmit(barcodeInput);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Scan Mode Toggle & Door Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IN / OUT Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Mode Transaksi Scan
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setScanType('IN');
                inputRef.current?.focus();
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all ${
                scanType === 'IN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowDownToLine className="w-5 h-5" />
              SCAN IN (Masuk)
            </button>
            <button
              type="button"
              onClick={() => {
                setScanType('OUT');
                inputRef.current?.focus();
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm transition-all ${
                scanType === 'OUT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowUpFromLine className="w-5 h-5" />
              SCAN OUT (Keluar)
            </button>
          </div>
        </div>

        {/* Door / Line Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Posisi / Pintu Gudang (Multi-Door)
          </label>
          <select
            value={doorOrLine}
            onChange={(e) => setDoorOrLine(e.target.value)}
            className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all cursor-pointer"
          >
            <option value="PINTU-1">Pintu 1 (Line Machining A)</option>
            <option value="PINTU-2">Pintu 2 (Line Machining B)</option>
            <option value="PINTU-3">Pintu 3 (Line Stamping)</option>
            <option value="PINTU-VENDOR">Pintu Penerimaan Vendor Subcont</option>
            <option value="DOCK-DELIVERY-1">Dock Delivery 1 (Toyota / TAM)</option>
            <option value="DOCK-DELIVERY-2">Dock Delivery 2 (ADM / HPM / Suzuki)</option>
          </select>
        </div>
      </div>

      {/* Main Barcode Scan Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <QrCode className={`w-6 h-6 ${isProcessing ? 'text-blue-500 animate-spin' : 'text-slate-400'}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder="Arahkan Barcode Scanner ke sini atau ketik kode Kanban..."
          className="w-full pl-12 pr-28 py-4 bg-slate-900 text-white font-mono text-base sm:text-lg rounded-2xl border-2 border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none placeholder-slate-500 transition-all shadow-inner"
        />
        <button
          type="button"
          onClick={() => handleScanSubmit(barcodeInput)}
          disabled={!barcodeInput.trim() || isProcessing}
          className="absolute right-2 top-2 bottom-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Zap className="w-4 h-4" />
          {isProcessing ? 'Proses...' : 'Kirim'}
        </button>
      </div>

      {/* Quick Test Barcode Buttons */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            Contoh Format Barcode Kanban MTM (Klik untuk Simulasi):
          </span>
          <span className="text-[10px] text-slate-400">Barcode QR / Code128</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: 'Kanban Part 45107-BZ010 (Toyota)',
              code: 'PART:45107-BZ010|PT:PT. TOYOTA MOTOR MANUFACTURING INDONESIA|QTY:50|LOT:LOT-2026-09-01|EXP:2027-01-01',
            },
            {
              label: 'Kanban Part 45102-BZ020 (ADM)',
              code: 'PART:45102-BZ020|PT:PT. ASTRA DAIHATSU MOTOR|QTY:100|LOT:LOT-2026-09-02',
            },
            {
              label: 'Kanban Part 45110-BZ030 (Suzuki)',
              code: 'PART:45110-BZ030|PT:PT. SUZUKI INDOMOBIL MOTOR|QTY:25|LOT:LOT-2026-09-03',
            },
            {
              label: 'Simpel Part Only: 45107-BZ010',
              code: '45107-BZ010',
            },
          ].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setBarcodeInput(sample.code);
                inputRef.current?.focus();
              }}
              className="text-xs px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 font-mono transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
