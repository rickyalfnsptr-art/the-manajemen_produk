'use client';

import React, { useState, useEffect } from 'react';
import { X, ClipboardEdit, AlertCircle, Save, Clock, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, RotateCcw } from 'lucide-react';
import { submitManualStock } from '@/utils/api';
import { ScanResult } from '@/types';

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ScanResult) => void;
  customerPts: string[];
}

const FACTORY_LINES = [
  'Line Machining 1',
  'Line Machining 2',
  'Line Forging 1',
  'Line Forging 2',
  'Line Die Rolling',
  'Line Subcount / Vendor Eksternal',
  'Line MPI (Magnetic Particle Inspection)',
  'Line Heat Treatment (HT)',
  'Line Press & Stamping',
  'Line Assembly Component',
];

const DOCK_DESTINATIONS = [
  'Dock Loading A (PT. ADM / TMMIN)',
  'Dock Loading B (PT. AHM / SIM)',
  'Dock Loading C (PT. HPM / MMKI)',
  'Dock Loading D (General Customer)',
  'Area Transit Staging Finished Goods',
  'Direct Delivery Container Gate',
];

export const ManualInputModal: React.FC<ManualInputModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerPts,
}) => {
  // Helper to get local datetime string (YYYY-MM-DDTHH:mm)
  const getNowLocalDatetime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [partNumber, setPartNumber] = useState('');
  const [customerPt, setCustomerPt] = useState('');
  const [customPt, setCustomPt] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  
  // Line & Dock states (no auto-fill, user chooses from list or custom)
  const [originLineOrVendor, setOriginLineOrVendor] = useState('');
  const [customOriginLine, setCustomOriginLine] = useState('');
  const [destinationDoorOrPt, setDestinationDoorOrPt] = useState('');
  const [customDestinationDoor, setCustomDestinationDoor] = useState('');

  const [manualTimestamp, setManualTimestamp] = useState<string>(getNowLocalDatetime());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh timestamp to current time when modal opens & reset selections
  useEffect(() => {
    if (isOpen) {
      setManualTimestamp(getNowLocalDatetime());
      setError(null);
      setPartNumber('');
      setCustomerPt('');
      setCustomPt('');
      setOriginLineOrVendor('');
      setCustomOriginLine('');
      setDestinationDoorOrPt('');
      setCustomDestinationDoor('');
      setNotes('');
      setQty(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSetCurrentTime = () => {
    setManualTimestamp(getNowLocalDatetime());
  };

  const handleQtyPreset = (amount: number) => {
    setQty(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPt = customerPt === 'OTHER' ? customPt.trim() : customerPt.trim();
    if (!partNumber.trim() || !selectedPt || qty <= 0) {
      setError('Part Number, Customer PT, dan Qty (>0) wajib diisi.');
      return;
    }

    const finalOriginLine = originLineOrVendor === 'OTHER' 
      ? customOriginLine.trim() 
      : originLineOrVendor.trim();

    const finalDestinationDoor = destinationDoorOrPt === 'OTHER' 
      ? customDestinationDoor.trim() 
      : destinationDoorOrPt.trim();

    setLoading(true);
    setError(null);

    const res = await submitManualStock({
      partNumber: partNumber.trim().toUpperCase(),
      customerPt: selectedPt,
      qty: Number(qty),
      type,
      originLineOrVendor: type === 'IN' ? (finalOriginLine || undefined) : undefined,
      destinationDoorOrPt: type === 'OUT' ? (finalDestinationDoor || undefined) : undefined,
      manualTimestamp: new Date(manualTimestamp).toISOString(),
      notes: notes.trim() || 'Input Manual Operator',
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
            <div className="p-2.5 bg-white/15 rounded-xl shadow-inner">
              <ClipboardEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Form Input Manual Transaksi</h3>
              <p className="text-xs text-amber-100">Gunakan jika barcode/QR rusak atau scanner tidak terhubung</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Tipe Transaksi (IN / OUT) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Arah Transaksi *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'IN'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                BARANG MASUK (IN)
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'OUT'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                BARANG KELUAR (OUT)
              </button>
            </div>
          </div>

          {/* 2. Part Number & Customer PT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Part Number *
              </label>
              <input
                type="text"
                placeholder="Ketik Part Number..."
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value.toUpperCase())}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none uppercase transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Customer PT *
              </label>
              <select
                value={customerPt}
                onChange={(e) => setCustomerPt(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all cursor-pointer truncate"
              >
                <option value="">-- Pilih Customer PT --</option>
                {customerPts.map((pt, i) => (
                  <option key={i} value={pt}>
                    {pt}
                  </option>
                ))}
                <option value="OTHER">+ Ketik PT Lainnya...</option>
              </select>
            </div>
          </div>

          {customerPt === 'OTHER' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama PT Lainnya *
              </label>
              <input
                type="text"
                placeholder="Contoh: PT. HYUNDAI MOTOR MANUFACTURING INDONESIA"
                value={customPt}
                onChange={(e) => setCustomPt(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          {/* 3. Qty dengan Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Jumlah Barang (Qty pcs) *
              </label>
              {/* Quick Qty Chips */}
              <div className="flex items-center gap-1">
                {[10, 20, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleQtyPreset(preset)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 transition-colors"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-base font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 4. Asal Line / Dock Tujuan (Pilihan Dropdown) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {type === 'IN' ? '5. Line Asal / Vendor' : '5. Pintu / Dock Loading Tujuan'}
            </label>
            {type === 'IN' ? (
              <>
                <select
                  value={originLineOrVendor}
                  onChange={(e) => setOriginLineOrVendor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Line Asal / Vendor --</option>
                  {FACTORY_LINES.map((line, idx) => (
                    <option key={idx} value={line}>
                      {line}
                    </option>
                  ))}
                  <option value="OTHER">+ Line / Vendor Lainnya...</option>
                </select>
                {originLineOrVendor === 'OTHER' && (
                  <input
                    type="text"
                    placeholder="Ketik Line / Vendor Asal..."
                    value={customOriginLine}
                    onChange={(e) => setCustomOriginLine(e.target.value)}
                    required
                    className="w-full mt-2 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                )}
              </>
            ) : (
              <>
                <select
                  value={destinationDoorOrPt}
                  onChange={(e) => setDestinationDoorOrPt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                >
                  <option value="">-- Pilih Pintu / Dock Tujuan --</option>
                  {DOCK_DESTINATIONS.map((dock, idx) => (
                    <option key={idx} value={dock}>
                      {dock}
                    </option>
                  ))}
                  <option value="OTHER">+ Pintu / Dock Lainnya...</option>
                </select>
                {destinationDoorOrPt === 'OTHER' && (
                  <input
                    type="text"
                    placeholder="Ketik Pintu / Dock Loading Tujuan..."
                    value={customDestinationDoor}
                    onChange={(e) => setCustomDestinationDoor(e.target.value)}
                    required
                    className="w-full mt-2 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                )}
              </>
            )}
          </div>

          {/* 5. Waktu & Tanggal Transaksi (Auto Jam Sekarang + Bebas Pilih) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                6. Tanggal & Jam Transaksi *
              </label>
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                title="Reset kembali ke waktu saat ini"
              >
                <RotateCcw className="w-3 h-3" />
                Set Jam Sekarang
              </button>
            </div>
            
            <input
              type="datetime-local"
              value={manualTimestamp}
              onChange={(e) => setManualTimestamp(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-semibold focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              Otomatis terisi waktu saat ini (WIB). Anda tetap bebas memilih tanggal & jam lain jika diperlukan.
            </p>
          </div>

          {/* 6. Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alasan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Barcode rusak dari vendor / label basah"
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
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

export default ManualInputModal;
