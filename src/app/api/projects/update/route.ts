import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // Uncomment when using real database

// Type untuk field yang bisa diupdate
interface UpdateProjectRequest {
  projectId: string
  fieldName: string
  value: string
}

// Simulasi database - dalam implementasi nyata, gunakan PostgreSQL dengan Prisma
const projectsDB = new Map<string, Record<string, any>>()

export async function POST(request: NextRequest) {
  try {
    const body: UpdateProjectRequest = await request.json()
    const { projectId, fieldName, value } = body

    // Validasi input
    if (!projectId || !fieldName || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, fieldName, value' },
        { status: 400 }
      )
    }

    // Daftar field yang diizinkan untuk diupdate
    const allowedFields = [
      'penyediaJasa',
      'pekerjaan', 
      'jenisPaket',
      'jenisPengadaan',
      'paguAnggaran',
      'nilaiKontrak',
      'nomorKontrak',
      'spmk',
      'masaKontrak',
      'tanggalKontrak',
      'akhirKontrak',
      'pembayaranTerakhir'
    ]

    if (!allowedFields.includes(fieldName)) {
      return NextResponse.json(
        { error: `Field ${fieldName} is not allowed to be updated` },
        { status: 400 }
      )
    }

    // === SIMULASI DATABASE (untuk demo) ===
    // Ambil atau buat project record
    let projectData = projectsDB.get(projectId) || {}
    const oldValue = projectData[fieldName]

    // Update field
    projectData[fieldName] = value
    projectData.updatedAt = new Date().toISOString()

    // Simpan kembali ke "database"
    projectsDB.set(projectId, projectData)

    // Log untuk debugging
    console.log(`Updated project ${projectId}: ${fieldName} = ${value}`)

    // === IMPLEMENTASI DENGAN POSTGRESQL + PRISMA (uncomment untuk produksi) ===
    /*
    // Ambil project yang ada atau buat baru
    let project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      // Buat project baru jika belum ada
      project = await prisma.project.create({
        data: {
          id: projectId,
          [fieldName]: value
        }
      })
    } else {
      // Update project yang sudah ada
      const oldValue = project[fieldName as keyof typeof project]
      
      project = await prisma.project.update({
        where: { id: projectId },
        data: {
          [fieldName]: value,
          updatedAt: new Date()
        }
      })

      // Log perubahan untuk audit trail
      await prisma.projectAuditLog.create({
        data: {
          projectId,
          fieldName,
          oldValue: oldValue?.toString() || null,
          newValue: value
        }
      })
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Data berhasil disimpan otomatis',
      data: {
        projectId,
        fieldName,
        value,
        oldValue: oldValue || null,
        updatedAt: projectData.updatedAt || new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      )
    }

    // === SIMULASI DATABASE (untuk demo) ===
    const projectData = projectsDB.get(projectId) || {
      // Default values
      penyediaJasa: 'PT. Loeh Raya Perkasa',
      pekerjaan: 'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi',
      jenisPaket: 'Fisik',
      jenisPengadaan: 'Kontraktual',
      paguAnggaran: 'RP19.257.871.000',
      nilaiKontrak: 'RP17.008.513.435',
      nomorKontrak: '01/HK0201/Aw9.2/V/2025',
      spmk: '01/SPMK/Aw9.2/V/2025, Tanggal 23 Mei 2025',
      masaKontrak: '120 Hari Kalender',
      tanggalKontrak: '22 Mei 2025',
      akhirKontrak: '19 September 2025',
      pembayaranTerakhir: '-'
    }

    // === IMPLEMENTASI DENGAN POSTGRESQL + PRISMA (uncomment untuk produksi) ===
    /*
    let project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        auditLogs: {
          orderBy: { changedAt: 'desc' },
          take: 10 // 10 perubahan terakhir
        }
      }
    })

    if (!project) {
      // Buat project baru dengan default values
      project = await prisma.project.create({
        data: {
          id: projectId,
          penyediaJasa: 'PT. Loeh Raya Perkasa',
          pekerjaan: 'Rehabilitasi/Peningkatan Bangunan, Pintu Air dan Jaringan Irigasi',
          jenisPaket: 'Fisik',
          jenisPengadaan: 'Kontraktual',
          paguAnggaran: 'RP19.257.871.000',
          nilaiKontrak: 'RP17.008.513.435',
          nomorKontrak: '01/HK0201/Aw9.2/V/2025',
          spmk: '01/SPMK/Aw9.2/V/2025, Tanggal 23 Mei 2025',
          masaKontrak: '120 Hari Kalender',
          tanggalKontrak: '22 Mei 2025',
          akhirKontrak: '19 September 2025',
          pembayaranTerakhir: '-'
        },
        include: {
          auditLogs: true
        }
      })
    }
    */

    return NextResponse.json({
      success: true,
      data: projectData,
      // auditLogs: project.auditLogs // uncomment untuk audit trail
    })

  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
