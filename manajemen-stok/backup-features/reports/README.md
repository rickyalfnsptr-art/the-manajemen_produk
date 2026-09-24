# Modul Laporan WHFG PT MTM (Fitur Cadangan / Backup Module)

Folder ini berisi seluruh source code Backend, Frontend, dan contoh hasil ekspor CSV untuk **Modul Pelaporan Gudang Finished Goods (WHFG) PT Menara Terus Makmur**.

Sesuai permintaan kebutuhan sistem, fitur ini disimpan sebagai **backup mandiri** agar sistem utama tetap ramping dan berfokus pada *Monitoring Dashboard*, *Barcode Scanner Kanban*, dan *Stock Lifecycle Tracking*.

---

## 📂 Struktur Folder Backup

```
backup-features/reports/
├── README.md                      <-- Panduan aktivasi modul
├── backend/
│   ├── dto/
│   │   └── export-report.dto.ts   <-- Validasi parameter ekspor
│   ├── reports.controller.ts      <-- Endpoint POST /api/reports/export
│   ├── reports.service.ts         <-- Logika rekap data & generator CSV
│   └── reports.module.ts          <-- Modul NestJS
├── frontend/
│   └── ReportsView.tsx            <-- Komponen UI Tab & Form Filter Ekspor
└── sample-exports/
    ├── 1_laporan_mutasi_stok_bulanan_sample.csv
    ├── 2_laporan_audit_log_sample.csv
    ├── 3_laporan_evaluasi_min_max_sample.csv
    └── 4_laporan_aging_dwell_time_sample.csv
```

---

## 📊 4 Jenis Laporan yang Tersedia

| No | Nama Laporan | Deskripsi & Informasi yang Dihasilkan | Format Sample |
|:---|:---|:---|:---|
| 1 | **Laporan Mutasi Stok Bulanan** | Rekapitulasi volume barang masuk (IN), barang keluar (OUT), dan saldo mutasi bersih (*Net Mutation*) per kombinasi Part Number dan Customer PT. | `1_laporan_mutasi_stok_bulanan_sample.csv` |
| 2 | **Laporan Evaluasi Min / Max Stok** | Analisis kesehatan stok gudang WHFG. Mengidentifikasi part yang berstatus 🔴 Kritis ($\le \text{Min}$) untuk segera direstock, serta part 🔴 Overstock ($\ge \text{Max}$) untuk diprioritaskan delivery OUT ke customer. | `3_laporan_evaluasi_min_max_sample.csv` |
| 3 | **Laporan Aging / Dwell Time Stok** | Menghitung durasi penyimpanan part (*Dwell Time*) di gudang WHFG sejak scan IN dari line/vendor hingga scan OUT delivery. Mengelompokkan part ke dalam kategori *Fast Moving* (< 24 jam), *Standar* (1-3 hari), dan *Slow Moving* (> 3 hari). | `4_laporan_aging_dwell_time_sample.csv` |
| 4 | **Laporan Audit Log & Scan Duplikat** | Catatan forensik seluruh aktivitas scan barcode (berhasil / gagal), penolakan barcode duplikat (*"Gagal karena sudah discan"*), input manual fallback, dan perubahan threshold Min/Max oleh PPIC. | `2_laporan_audit_log_sample.csv` |

---

## 🚀 Panduan Cara Mengaktifkan Fitur Laporan ke Aplikasi Utama

Jika sewaktu-waktu tim PPIC atau Warehouse ingin mengaktifkan halaman laporan ini di aplikasi:

### 1. Integrasi Backend (NestJS)
1. Salin folder `backup-features/reports/backend/` ke dalam folder `backend/src/reports/`.
2. Buka `backend/src/app.module.ts` dan daftarkan `ReportsModule`:
   ```typescript
   import { ReportsModule } from './reports/reports.module';

   @Module({
     imports: [
       // modul lainnya...
       ReportsModule,
     ],
   })
   export class AppModule {}
   ```

### 2. Integrasi Frontend (Next.js)
1. Buat file halaman baru di `frontend/src/app/reports/page.tsx`:
   ```tsx
   'use client';
   import { Sidebar } from '@/components/layout/Sidebar';
   import { TopNavbar } from '@/components/layout/TopNavbar';
   import { ReportsView } from '@/../../backup-features/reports/frontend/ReportsView';

   export default function ReportsPage() {
     return (
       <div className="flex min-h-screen bg-slate-100">
         <Sidebar />
         <div className="flex-1 flex flex-col min-w-0">
           <TopNavbar
             title="Laporan & Ekspor Data WHFG"
             subtitle="Ekspor rekap mutasi bulanan, evaluasi batas min/max, dwell time, dan audit log"
           />
           <main className="p-6 max-w-7xl w-full mx-auto">
             <ReportsView />
           </main>
         </div>
       </div>
     );
   }
   ```
2. Buka `frontend/src/components/layout/Sidebar.tsx` dan tambahkan menu navigasi **"Laporan WHFG"** mengarah ke `/reports`.

---
*Dokumen ini dibuat otomatis sebagai bagian dari sistem manajemen stok WHFG PT Menara Terus Makmur.*
