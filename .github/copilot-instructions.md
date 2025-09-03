tolong ikuti aturan ini:
-untuk implementasi kodenya tolong selalu implementasikan tools yang terdapat pada List Technology stack terlebih dahulu, jika tidak memungkinkan maka gunakan yang lain
-gunakan tanstack react query 
-buat validasi menggunakan zod
-buat tampilannya responsive dan konsisten menggunakan aturan ini:
Mobile:    < 640px   (sm)
Tablet:    640-1023px (sm-lg)
Laptop:    1024-1279px (lg)
Desktop:   ≥ 1280px (xl)

-gunakan pendekatan reusable component dan clean code. selalu gunakan shadcn, jika tidak memungkinkan baru bikin component sendiri.
-gunakan referensi kode yang sudah ada supaya kodenya konsisten
-saya juga ingin connect menggunakan database postgressql dengan url seperti ini POSTGRES_URL=postgres://postgres:yoontae93@127.0.0.1:5432/siger



 

List Technology stack yang digunakan
{

  "frontend": {

    "framework": "Next.js 15 (App Router + Server Components)",

    "language": "TypeScript 5.6+",

    "styling": "Tailwind CSS 4.0 + CSS Modules",

    "ui_library": "shadcn/ui + Headless UI + Custom Design System",

    "charts": "Chart.js 4.4 + D3.js + Observable Plot",

    "maps": "Mapbox GL JS + React Map GL + Turf.js",

    "animations": "Framer Motion + Lottie React",

    "icons": "Lucide React + Heroicons + Custom Icon Set",

    "pwa": "Next-PWA + Workbox",

  }

}
 
{
  "backend": {
    "runtime": "Node.js 20+ LTS",
    "framework": "Next.js 15 API Routes + Express.js microservices",
    "database": "PostgreSQL",
    "orm":"Prisma",
    "language": "TypeScript",
    "api_standard": "REST + WebSocket",
    "validation": "Zod + express-validator",
    "documentation": "OpenAPI 3.1",
    "middleware": "Helmet + CORS + Rate Limiting + Compression"
  },
}
 