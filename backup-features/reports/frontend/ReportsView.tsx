'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Filter, Calendar, Building2, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MUTATION' | 'STOCK_HEALTH' | 'AGING' | 'AUDIT'>('MUTATION');
  const [selectedPt, setSelectedPt] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = () => {
    setIsExporting(true);
    // Simulates download or triggers API if active
    setTimeout(() => {
      alert(`Memulai unduhan Laporan format CSV untuk tipe: ${activeTab}`);
      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Modul Ekspor & Pelaporan WHFG (Backup Ready)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor rekap mutasi bulanan, evaluasi batas min/max, analisis dwell time/aging, dan audit log scan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Mengekspor...' : 'Unduh Laporan (.CSV)'}
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'MUTATION',
            title: '1. Mutasi Bulanan',
            desc: 'Rekap total IN, OUT, & Net per Part & PT',
            icon: Layers,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
          },
          {
            id: 'STOCK_HEALTH',
            title: '2. Evaluasi Min / Max',
            desc: 'Daftar part kritis & overstock',
            icon: AlertTriangle,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
          },
          {
            id: 'AGING',
            title: '3. Aging & Dwell Time',
            desc: 'Durasi simpan lot di gudang WHFG',
            icon: Clock,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
          },
          {
            id: 'AUDIT',
            title: '4. Audit Log & Scan',
            desc: 'Log scan berhasil/gagal & duplikat',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${tab.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">{tab.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter Customer PT
          </label>
          <select
            value={selectedPt}
            onChange={(e) => setSelectedPt(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">Semua Customer PT</option>
            <option value="PT. TOYOTA MOTOR MANUFACTURING INDONESIA">PT. TOYOTA MOTOR MFG ID</option>
            <option value="PT. ASTRA DAIHATSU MOTOR">PT. ASTRA DAIHATSU MOTOR</option>
            <option value="PT. HONDA PRECISION PARTS MANUFACTURING">PT. HONDA PRECISION PARTS</option>
            <option value="PT. SUZUKI INDOMOBIL MOTOR">PT. SUZUKI INDOMOBIL MOTOR</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Periode Tanggal Mulai
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Periode Tanggal Selesai
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none font-mono"
          />
        </div>
      </div>

      {/* Preview Container */}
      <div className="border border-slate-200 rounded-xl p-8 text-center text-slate-400 bg-slate-50/50">
        <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-600" />
        <h4 className="text-sm font-bold text-slate-700">Preview Data Siap Diekspor</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Klik tombol <strong>"Unduh Laporan (.CSV)"</strong> di pojok kanan atas untuk mengunduh laporan format CSV/Excel yang dapat dibuka langsung di spreadsheet.
        </p>
      </div>
    </div>
  );
};
