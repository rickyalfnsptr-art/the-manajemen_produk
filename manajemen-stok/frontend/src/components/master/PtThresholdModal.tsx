'use client';

import React, { useState } from 'react';
import { PartCustomerStock } from '@/types';
import { X, Save, AlertTriangle, Building2, Package } from 'lucide-react';
import { updatePtThreshold } from '@/utils/api';

interface PtThresholdModalProps {
  stock: PartCustomerStock | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: PartCustomerStock) => void;
}

export const PtThresholdModal: React.FC<PtThresholdModalProps> = ({
  stock,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !stock) return null;

  const [minStock, setMinStock] = useState<number>(stock.minStock);
  const [maxStock, setMaxStock] = useState<number>(stock.maxStock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const result = await updatePtThreshold(stock.id, { minStock, maxStock });
    setLoading(false);

    if (result.success && result.data) {
      onSuccess(result.data);
      onClose();
    } else {
      setError(result.error || 'Gagal memperbarui ambang batas stok.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Atur Ambang Batas Min / Max</h3>
              <p className="text-xs text-slate-300">Spesifik per kombinasi Part dan PT Customer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Part Number:</span>
              <span className="font-mono font-bold text-slate-900">{stock.partNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Nama Part:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[240px]">{stock.partName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Target Customer PT:</span>
              <span className="px-2 py-0.5 font-bold rounded bg-blue-100 text-blue-800">
                {stock.customerPt}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500">Stok Aktual Saat Ini:</span>
              <span className="font-mono font-black text-slate-900">{stock.currentStock} pcs</span>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Batas Min Stock (Kritis)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">🔴 Warning jika &le; Min</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Batas Max Stock (Overstock)
              </label>
              <input
                type="number"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">🔴 Warning jika &ge; Max</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <strong>Catatan:</strong> Scan IN tetap diizinkan walaupun stok melebihi Max Stock. Batas Max hanya sebagai visual warning pada Dashboard untuk tim PPIC.
          </div>

          {/* Buttons */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
