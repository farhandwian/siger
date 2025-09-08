# Seeder Documentation

## Activities & Sub-Activities Seeder

File: `prisma/seed-activities.ts`

### Deskripsi
Seeder ini membuat data activities dan sub-activities untuk semua proyek yang ada di database. Seeder ini mencakup:

1. **Activities (Kegiatan Utama)**
2. **Sub-Activities (Sub Kegiatan)**
3. **Activity Schedules (Jadwal Kegiatan)**
4. **Daily Sub-Activities (Kegiatan Harian)**

### Structure Activities

Seeder ini membuat 7 kategori activities utama untuk setiap proyek:

1. **Pekerjaan Persiapan**
   - Mobilisasi Alat dan Material
   - Pengukuran dan Pematokan
   - Pembersihan Lahan

2. **Pekerjaan Galian dan Timbunan**
   - Galian Tanah Biasa
   - Galian Tanah Keras
   - Timbunan Tanah Pilihan

3. **Pekerjaan Beton dan Pasangan**
   - Beton K-200
   - Beton K-250
   - Pasangan Batu Kali

4. **Pekerjaan Saluran Primer**
   - Normalisasi Saluran Primer
   - Lining Saluran Beton
   - Pembuatan Jalan Inspeksi

5. **Pekerjaan Saluran Sekunder**
   - Normalisasi Saluran Sekunder
   - Rehabilitasi Saluran Sekunder
   - Box Culvert Saluran Sekunder

6. **Pekerjaan Bangunan Pelengkap**
   - Pintu Air Otomatis
   - Pintu Air Manual
   - Jembatan Penyeberangan

7. **Pekerjaan Finishing**
   - Pemasangan Pagar Keliling
   - Pemasangan Rambu dan Papan Nama
   - Pembersihan Akhir dan Demobilisasi

### Data yang Dibuat

#### Sub-Activities
Setiap sub-activity memiliki data:
- `name`: Nama sub kegiatan
- `satuan`: Unit measurement (LS, m, m2, m3, unit)
- `volumeKontrak`: Volume kontrak
- `volumeMC0`: Volume MC0
- `bobotMC0`: Bobot MC0 dalam persentase
- `weight`: Bobot dalam persentase dari activity parent
- `order`: Urutan tampilan

#### Activity Schedules
- Membuat jadwal untuk seluruh tahun 2025 (12 bulan x 4 minggu = 48 schedule per sub-activity)
- `planPercentage`: Persentase rencana berdasarkan progression activity
- `actualPercentage`: Persentase realisasi dengan variance random (untuk bulan yang sudah lewat)

#### Daily Sub-Activities
- Membuat sample daily activities untuk 30 hari terakhir
- Data meliputi:
  - GPS coordinates (random di sekitar Jakarta)
  - Catatan kegiatan dengan random notes
  - File uploads (sample paths)
  - Progress realisasi harian (5-20% random)
  - Assigned ke users dengan role 'user'

### Cara Menjalankan

```bash
npm run db:seed
```

### Output Seeder

Seeder akan membuat:
- **Activities**: 7 per proyek
- **Sub-Activities**: 21 per proyek (3 sub per activity)
- **Activity Schedules**: 1,008 per proyek (48 per sub-activity)
- **Daily Sub-Activities**: ~200 total (tersebar di 10 sub-activities pertama)

### Features

1. **Realistic Data**: Data dibuat dengan nilai yang realistis untuk proyek infrastruktur
2. **Progress Simulation**: Schedule dengan progression yang mengikuti urutan activities
3. **Random Variance**: Actual progress memiliki variance ±5% dari plan
4. **GPS Coordinates**: Koordinat GPS random di sekitar Jakarta
5. **User Assignment**: Daily activities di-assign ke users dengan role 'user'

### Dependencies

Seeder ini membutuhkan:
- Projects sudah ada di database
- Users dengan role 'user' sudah ada di database
- Prisma Client yang sudah dikonfigurasi

### Integration

Seeder ini terintegrasi dengan main seeder (`prisma/seed.ts`) dan dipanggil otomatis setelah projects dan materials dibuat.
