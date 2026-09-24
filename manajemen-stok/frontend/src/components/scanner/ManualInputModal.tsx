'use client';

import React, { useState } from 'react';
import { X, ClipboardEdit, AlertCircle, Save, Calendar, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { submitManualStock } from '@/utils/api';
import { ScanResult } from '@/types';

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ScanResult) => void;
  customerPts: string[];
}

export const ManualInputModal: React.FC<ManualInputModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerPts,
}) => {
  const [partNumber, setPartNumber] = useState('');
  const [customerPt, setCustomerPt] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [originLineOrVendor, setOriginLineOrVendor] = useState('');
  const [destinationDoorOrPt, setDestinationDoorOrPt] = useState('');
  const [manualTimestamp, setManualTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumber.trim() || !customerPt.trim() || qty <= 0) {
      setError('Part Number, Customer PT, dan Qty (>0) wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await submitManualStock({
      partNumber: partNumber.trim().toUpperCase(),
      customerPt: customerPt.trim(),
      qty: Number(qty),
      type,
      originLineOrVendor: type === 'IN' ? originLineOrVendor : undefined,
      destinationDoorOrPt: type === 'OUT' ? destinationDoorOrPt : undefined,
      manualTimestamp: new Date(manualTimestamp).toISOString(),
      notes: notes.trim() || 'Input Manual Fallback',
    });

    setLoading(false);

    if (res.success) {
      onSuccess(res);
      onClose();
    } else {
      setError(res.error || res.message || 'Gagal menyimpan transaksi input manual.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl">
              <ClipboardEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Form Input Manual Fallback</h3>
              <p className="text-xs text-amber-100">Gunakan jika barcode rusak / scanner bermasalah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Tipe Transaksi (IN / OUT) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Tipe Transaksi (Wajib)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'IN'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                BARANG MASUK (IN)
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'OUT'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                BARANG KELUAR (OUT)
              </button>
            </div>
          </div>

          {/* 2. Part Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Part Number (Wajib)
            </label>
            <input
              type="text"
              placeholder="Contoh: 45107-BZ010"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none uppercase"
            />
          </div>

          {/* 3. Customer PT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Customer PT Tujuan / Alokasi (Wajib)
            </label>
            <input
              list="customerPtList"
              placeholder="Pilih atau ketik nama PT Customer..."
              value={customerPt}
              onChange={(e) => setCustomerPt(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            <datalist id="customerPtList">
              {customerPts.map((pt, i) => (
                <option key={i} value={pt} />
              ))}
            </datalist>
          </div>

          {/* 4. Qty & Asal / Tujuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Jumlah (Qty pcs)
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {type === 'IN' ? '5. Line Asal / Vendor' : '5. Pintu / Dock Tujuan'}
              </label>
              {type === 'IN' ? (
                <input
                  type="text"
                  placeholder="Contoh: Line Machining 2"
                  value={originLineOrVendor}
                  onChange={(e) => setOriginLineOrVendor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Contoh: Dock Loading A"
                  value={destinationDoorOrPt}
                  onChange={(e) => setDestinationDoorOrPt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* 5. Waktu Manual & Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6. Waktu Aktual Transaksi Manual (Wajib)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={manualTimestamp}
                onChange={(e) => setManualTimestamp(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alasan Input Manual / Catatan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Label barcode kanban sobek dari Line Machining"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Transaksi Manual'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
