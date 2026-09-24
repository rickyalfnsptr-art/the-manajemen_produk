'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ClipboardEdit,
  AlertCircle,
  Save,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  RotateCcw,
  Building2,
  MapPin,
  Package,
} from 'lucide-react';
import { submitManualStock, getMasterParts } from '@/utils/api';
import { ScanResult, MasterPart } from '@/types';
import { SearchableCombobox, ComboboxOption } from '@/components/common/SearchableCombobox';

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
  'PT BILGOS SEJAHTERA INDONESIA',
  'PT MEKAR ARMADA JAYA',
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
  const [qty, setQty] = useState<number>(1);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [originLineOrVendor, setOriginLineOrVendor] = useState('');
  const [destinationDoorOrPt, setDestinationDoorOrPt] = useState('');
  const [manualTimestamp, setManualTimestamp] = useState<string>(getNowLocalDatetime());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterParts, setMasterParts] = useState<MasterPart[]>([]);

  // Load master parts list for autocomplete
  useEffect(() => {
    if (isOpen) {
      setManualTimestamp(getNowLocalDatetime());
      setError(null);
      setPartNumber('');
      setCustomerPt('');
      setOriginLineOrVendor('');
      setDestinationDoorOrPt('');
      setNotes('');
      setQty(1);

      getMasterParts().then((parts) => {
        if (parts && parts.length > 0) {
          setMasterParts(parts);
        }
      });
    }
  }, [isOpen]);

  // Options for Part Number Combobox
  const partOptions: ComboboxOption[] = useMemo(() => {
    return masterParts.map((p) => ({
      value: p.partNumber,
      label: p.partNumber,
      sublabel: `${p.partName} ${p.standardBoxQty ? `• Std: ${p.standardBoxQty} pcs` : ''}`,
    }));
  }, [masterParts]);

  // Options for PT Customer Combobox
  const ptOptions: ComboboxOption[] = useMemo(() => {
    return customerPts.map((pt) => ({
      value: pt,
      label: pt,
    }));
  }, [customerPts]);

  // Options for Line Asal / Vendor
  const lineOptions: ComboboxOption[] = useMemo(() => {
    return FACTORY_LINES.map((line) => ({
      value: line,
      label: line,
    }));
  }, []);

  // Options for Dock Door / Destination
  const dockOptions: ComboboxOption[] = useMemo(() => {
    return DOCK_DESTINATIONS.map((dock) => ({
      value: dock,
      label: dock,
    }));
  }, []);

  if (!isOpen) return null;

  const handleSetCurrentTime = () => {
    setManualTimestamp(getNowLocalDatetime());
  };

  const handleQtyPreset = (amount: number) => {
    setQty(amount);
  };

  const handlePartSelect = (selectedPartNo: string) => {
    setPartNumber(selectedPartNo);
    // If the selected part has customer allocations and PT is not chosen yet, check if single PT
    const found = masterParts.find((p) => p.partNumber === selectedPartNo);
    if (found && found.customerStocks && found.customerStocks.length === 1 && !customerPt) {
      setCustomerPt(found.customerStocks[0].customerPt);
    }
  };

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
      originLineOrVendor: type === 'IN' ? (originLineOrVendor.trim() || undefined) : undefined,
      destinationDoorOrPt: type === 'OUT' ? (destinationDoorOrPt.trim() || undefined) : undefined,
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
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg shadow-inner">
              <ClipboardEdit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Input Manual Transaksi</h3>
              <p className="text-xs text-amber-100">Pencatatan transaksi fisik tanpa scanner</p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Tipe Transaksi (IN / OUT) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Arah Transaksi *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'IN'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                MASUK (IN)
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'OUT'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                KELUAR (OUT)
              </button>
            </div>
          </div>

          {/* 2. Part Number & Customer PT (Searchable & Scrollable Comboboxes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Part Number *
              </label>
              <SearchableCombobox
                value={partNumber}
                onChange={handlePartSelect}
                options={partOptions}
                placeholder="-- Pilih / Ketik Part No --"
                searchPlaceholder="Ketik Part No (misal: 45107, MFM)..."
                customPrefix="+ Input Part Baru"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer PT *
              </label>
              <SearchableCombobox
                value={customerPt}
                onChange={setCustomerPt}
                options={ptOptions}
                placeholder="-- Pilih / Ketik Customer PT --"
                searchPlaceholder="Cari PT (Toyota, Daihatsu, Isuzu...)"
                customPrefix="+ Gunakan PT"
                required
              />
            </div>
          </div>

          {/* 3. Qty dengan Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Jumlah Barang (Qty pcs) *
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
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 4. Asal Line / Dock Tujuan (Searchable & Scrollable Combobox) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {type === 'IN' ? 'Line Asal / Vendor' : 'Pintu / Dock Tujuan'}
            </label>
            {type === 'IN' ? (
              <SearchableCombobox
                value={originLineOrVendor}
                onChange={setOriginLineOrVendor}
                options={lineOptions}
                placeholder="-- Pilih / Ketik Line Asal / Vendor --"
                searchPlaceholder="Cari Line (Machining, Forging, Subcount...)"
                customPrefix="+ Gunakan Line"
              />
            ) : (
              <SearchableCombobox
                value={destinationDoorOrPt}
                onChange={setDestinationDoorOrPt}
                options={dockOptions}
                placeholder="-- Pilih / Ketik Pintu / Dock Tujuan --"
                searchPlaceholder="Cari Dock (Dock A, Staging, Container...)"
                customPrefix="+ Gunakan Dock"
              />
            )}
          </div>

          {/* 5. Waktu & Tanggal Transaksi (Auto Jam Sekarang + Bebas Pilih) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Waktu Transaksi *
              </label>
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                title="Reset kembali ke waktu saat ini"
              >
                <RotateCcw className="w-3 h-3" />
                Jam Sekarang
              </button>
            </div>

            <input
              type="datetime-local"
              value={manualTimestamp}
              onChange={(e) => setManualTimestamp(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono font-semibold focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              Waktu otomatis saat ini (WIB).
            </p>
          </div>

          {/* 6. Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Barcode rusak dari vendor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualInputModal;
