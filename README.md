# SIGER - Smart Integrated Government Electronic Reporting

Sistem pelaporan elektronik pemerintah yang terintegrasi dengan teknologi modern untuk analisis data yang lebih efektif dan pengambilan keputusan yang lebih baik.

## 🚀 Teknologi Stack

### Frontend
- **Next.js 15** - App Router + Server Components
- **TypeScript 5.6+** - Type safety dan developer experience yang lebih baik
- **Tailwind CSS 4.0** - Styling modern dengan utility-first approach
- **shadcn/ui** - Komponen UI yang dapat disesuaikan dan accessible
- **Chart.js 4.4 + D3.js** - Visualisasi data interaktif
- **Mapbox GL JS** - Peta dan visualisasi geografis
- **Framer Motion** - Animasi yang smooth dan performant
- **Lucide React + Heroicons** - Icon library yang konsisten

### Backend
- **Node.js 20+ LTS** - Runtime JavaScript yang stabil
- **Next.js 15 API Routes** - Backend terintegrasi
- **TypeScript** - Type safety di seluruh stack
- **Zod** - Schema validation dan type inference
- **Express.js middleware** - Security dan performance optimization

### PWA & Performance
- **Next-PWA** - Progressive Web App capabilities
- **Workbox** - Service worker dan caching strategies

## 📦 Instalasi

### Prerequisites
- Node.js 20+ LTS
- npm atau yarn
- Git

### Setup Project

1. **Clone repository**
   ```bash
   git clone https://github.com/farhandwian/siger.git
   cd siger
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` dan sesuaikan dengan konfigurasi Anda:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/siger_db"
   
   # Mapbox (untuk fitur peta)
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-token"
   
   # API Configuration
   NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
   ```

4. **Run development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

5. **Buka aplikasi**
   Kunjungi [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🏗️ Struktur Project

```
siger/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                  # Utilities dan configurations
│   │   ├── utils.ts          # Utility functions
│   │   └── schemas.ts        # Zod validation schemas
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Helper functions
│   └── styles/               # CSS dan styling files
├── public/                   # Static assets
├── .github/                  # GitHub configurations
└── reference/               # Documentation dan references
```

## 🛠️ Scripts Available

```bash
# Development
npm run dev          # Start development server
npm run build        # Build untuk production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🎨 Fitur Utama

### 📊 Analytics Dashboard
- Visualisasi data interaktif dengan Chart.js dan D3.js
- Real-time monitoring dan metrics
- Customizable dashboard widgets

### 🗺️ Geographic Visualization
- Integrasi Mapbox untuk peta interaktif
- Analisis spasial dengan Turf.js
- Visualisasi data geografis

### 📱 Progressive Web App
- Offline capabilities
- App-like experience di mobile
- Push notifications support

### 🔒 Security & Validation
- Type-safe dengan TypeScript
- Data validation menggunakan Zod
- Security headers dan rate limiting

### 🎭 User Experience
- Responsive design untuk semua device
- Dark/light mode support
- Smooth animations dengan Framer Motion
- Accessible UI components

## 🚀 Deployment

### Build untuk Production
```bash
npm run build
npm run start
```

### Deploy ke Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy ke Platform Lain
Project ini dapat di-deploy ke platform hosting modern seperti:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🔧 Konfigurasi

### Mapbox Setup
1. Daftar di [Mapbox](https://www.mapbox.com/)
2. Dapatkan access token
3. Tambahkan ke `.env.local`:
   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-token-here"
   ```

### Database Setup
Aplikasi ini dirancang untuk bekerja dengan PostgreSQL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/siger_db"
```

## 📚 Dokumentasi API

API routes tersedia di `/api/*` dengan dokumentasi OpenAPI 3.1.

### Contoh Endpoints:
- `GET /api/reports` - List semua reports
- `POST /api/reports` - Buat report baru
- `GET /api/analytics` - Data analytics
- `GET /api/maps/data` - Data geografis

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👥 Team

- **Development Team** - [SIGER Team](https://github.com/farhandwian)

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Check [Issues](https://github.com/farhandwian/siger/issues) yang sudah ada
2. Buat [Issue baru](https://github.com/farhandwian/siger/issues/new) jika diperlukan
3. Hubungi tim development

---

**SIGER** - Membangun masa depan pelaporan pemerintahan yang digital, transparan, dan efisien. 🚀
