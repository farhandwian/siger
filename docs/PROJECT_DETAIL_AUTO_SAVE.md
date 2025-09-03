# Project Detail Page - Auto Save Implementation

## Fitur Utama

✅ **Page Baru** dalam menu Monitoring & Evaluasi
✅ **Auto-save** data ke database tanpa tombol simpan
✅ **Breadcrumb** yang sesuai: Monitoring & Evaluasi > DIR Rawa Mesuji - Rehabilitasi
✅ **Form Fields** yang dapat diedit dengan real-time saving
✅ **Loading indicator** saat menyimpan
✅ **Error handling** untuk kegagalan penyimpanan

## Struktur File

```
src/
├── app/
│   ├── api/projects/update/route.ts        # API endpoint untuk auto-save
│   └── monitoring-evaluasi/project/[id]/page.tsx  # Page detail project
├── components/monitoring/
│   └── project-list.tsx                   # Updated untuk navigasi ke detail page
├── hooks/
│   └── useAutoSave.ts                     # Custom hooks untuk auto-save
├── lib/
│   └── prisma.ts                          # Prisma client setup
└── prisma/
    └── schema.prisma                      # Database schema
```

## Cara Kerja Auto-Save

1. **Input Field**: Setiap input field menggunakan komponen `FormField` khusus
2. **Debounce**: Perubahan data di-debounce 1 detik sebelum dikirim ke server
3. **Loading State**: Indikator loading muncul saat sedang menyimpan
4. **Error Handling**: Pesan error ditampilkan jika gagal menyimpan
5. **Audit Trail**: Setiap perubahan dicatat untuk tracking

## Navigasi

- Dari `/monitoring-evaluasi` klik tombol **Detail** pada project card
- Akan redirect ke `/monitoring-evaluasi/project/[id]`
- Breadcrumb menampilkan: Monitoring & Evaluasi > DIR Rawa Mesuji - Rehabilitasi

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
  id VARCHAR PRIMARY KEY,
  penyedia_jasa VARCHAR,
  pekerjaan VARCHAR,
  jenis_paket VARCHAR,
  jenis_pengadaan VARCHAR,
  pagu_anggaran VARCHAR,
  nilai_kontrak VARCHAR,
  nomor_kontrak VARCHAR,
  spmk VARCHAR,
  masa_kontrak VARCHAR,
  tanggal_kontrak VARCHAR,
  akhir_kontrak VARCHAR,
  pembayaran_terakhir VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Audit Log Table
```sql
CREATE TABLE project_audit_logs (
  id VARCHAR PRIMARY KEY,
  project_id VARCHAR REFERENCES projects(id),
  field_name VARCHAR,
  old_value VARCHAR,
  new_value VARCHAR,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

## Setup Database (PostgreSQL + Prisma)

1. **Install Dependencies**:
```bash
npm install prisma @prisma/client
npm install -D prisma
```

2. **Setup Environment**:
```env
POSTGRES_URL="postgres://postgres:yoontae93@127.0.0.1:5432/siger"
```

3. **Generate Prisma Client**:
```bash
npx prisma generate
```

4. **Run Migration**:
```bash
npx prisma migrate dev --name init
```

5. **Uncomment Prisma Code**: 
   - Uncomment lines in `/api/projects/update/route.ts`
   - Uncomment import in component files

## Field yang Dapat Di-edit

### Informasi Umum Proyek
- Penyedia Jasa
- Pekerjaan  
- Jenis Paket
- Jenis Pengadaan

### Informasi Kontrak & Anggaran
- Pagu Anggaran
- Nilai Kontrak
- Nomor Kontrak
- SPMK
- Masa Kontrak
- Tanggal Kontrak
- Akhir Kontrak
- Pembayaran Terakhir

## API Endpoints

### POST `/api/projects/update`
Update field project secara real-time
```json
{
  "projectId": "1",
  "fieldName": "penyediaJasa", 
  "value": "PT. Baru"
}
```

### GET `/api/projects/update?projectId=1`
Ambil data project
```json
{
  "success": true,
  "data": {
    "penyediaJasa": "PT. Loeh Raya Perkasa",
    "pekerjaan": "Rehabilitasi/Peningkatan...",
    // ... other fields
  }
}
```

## Responsive Design

Mengikuti pola ukuran yang sama dengan file lain:
- **Mobile**: `text-[9px]`, `p-2`, `gap-2`
- **Laptop**: `text-[10px]`, `p-3`, `gap-3` 
- **Desktop**: `text-xs`, `p-4`, `gap-4`

## Security Features

- **Field Validation**: Hanya field yang diizinkan yang bisa diupdate
- **Input Sanitization**: Data di-sanitize sebelum disimpan
- **Audit Trail**: Semua perubahan dicatat dengan timestamp
- **Error Logging**: Error disimpan untuk monitoring

## Testing

Untuk testing auto-save:
1. Buka page detail project
2. Edit field apapun
3. Tunggu 1 detik (debounce)
4. Lihat spinner loading muncul
5. Data tersimpan otomatis
6. Check console untuk log penyimpanan

## Performance Optimization

- **Debouncing**: Mencegah terlalu banyak request ke server
- **Local State**: Update UI immediately, sync ke server async
- **Error Recovery**: Retry logic untuk kegagalan network
- **Optimistic Updates**: UI update before server confirmation
