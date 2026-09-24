'use client';

import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle, Building2, Package, Check } from 'lucide-react';
import { createOrAssignPartAllocation } from '@/utils/api';
import { PartCustomerStock } from '@/types';

interface AddPartAllocationModalProps {
  customerPts: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddPartAllocationModal: React.FC<AddPartAllocationModalProps> = ({
  customerPts,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [category, setCategory] = useState('General');
  const [customerName, setCustomerName] = useState(customerPts[0] || 'PT. TOYOTA MOTOR MANUFACTURING INDONESIA');
  const [customPt, setCustomPt] = useState('');
  const [minStock, setMinStock] = useState<number>(50);
  const [maxStock, setMaxStock] = useState<number>(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPt = customerName === 'OTHER' ? customPt.trim() : customerName.trim();

    if (!partNumber.trim() || !partName.trim() || !finalPt) {
      setError('Mohon lengkapi Part Number, Nama Part, dan Customer PT.');
      return;
    }

    if (minStock < 0 || maxStock < 0) {
      setError('Nilai Min dan Max stok tidak boleh negatif.');
      return;
    }

    if (minStock >= maxStock) {
      setError('Nilai Min Stock harus lebih kecil dari Max Stock.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createOrAssignPartAllocation({
      partNumber: partNumber.trim(),
      partName: partName.trim(),
      category: category.trim(),
      customerName: finalPt,
      minStock,
      maxStock,
    });

    setLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Gagal menyimpan alokasi part PT.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <PlusCircle className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tambah / Alokasikan Part ke PT</h3>
              <p className="text-xs text-blue-200">Tentukan batas Min & Max spesifik untuk Part & PT Customer ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Part Number *
            </label>
            <input
              type="text"
              placeholder="Contoh: 45102-BZ020"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value.toUpperCase())}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Part / Deskripsi *
            </label>
            <input
              type="text"
              placeholder="Contoh: STEERING WHEEL ASSY"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <input
                type="text"
                placeholder="Contoh: Steering"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer PT Tujuan *
              </label>
              <select
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer truncate"
              >
                {customerPts.map((pt, idx) => (
                  <option key={idx} value={pt}>
                    {pt}
                  </option>
                ))}
                <option value="OTHER">+ Masukkan PT Baru...</option>
              </select>
            </div>
          </div>

          {customerName === 'OTHER' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama PT Baru *
              </label>
              <input
                type="text"
                placeholder="Contoh: PT. HYUNDAI MOTOR MANUFACTURING INDONESIA"
                value={customPt}
                onChange={(e) => setCustomPt(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Min & Max Inputs */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Batas Min (Kritis) *
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-[10px] text-red-600 font-medium mt-0.5 block">🔴 Warning jika &le; Min</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Batas Max (Overstock) *
              </label>
              <input
                type="number"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">🔴 Warning jika &ge; Max</span>
            </div>
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Alokasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartAllocationModal;
