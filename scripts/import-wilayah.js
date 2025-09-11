const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function importWilayah() {
  try {
    console.log('Starting wilayah data import...')

    // Read the SQL file
    const sqlContent = fs.readFileSync('reference/wilayah.sql', 'utf8')

    // Extract INSERT statements
    const insertMatches = sqlContent.match(
      /INSERT INTO wilayah \(kode, nama\)\s*VALUES\s*([\s\S]*?);/g
    )

    if (!insertMatches) {
      throw new Error('No INSERT statements found in the SQL file')
    }

    let totalRecords = 0

    for (const insertStatement of insertMatches) {
      // Extract values from the INSERT statement
      const valuesMatch = insertStatement.match(/VALUES\s*([\s\S]*?);/)
      if (!valuesMatch) continue

      const valuesString = valuesMatch[1]

      // Parse individual value rows
      const valueRows = valuesString.match(/\('([^']+)','([^']+)'\)/g)
      if (!valueRows) continue

      const records = []

      for (const row of valueRows) {
        const match = row.match(/\('([^']+)','([^']+)'\)/)
        if (match) {
          records.push({
            kode: match[1],
            nama: match[2],
          })
        }
      }

      if (records.length > 0) {
        console.log(`Importing ${records.length} records...`)

        // Use createMany for batch insert
        await prisma.wilayah.createMany({
          data: records,
          skipDuplicates: true,
        })

        totalRecords += records.length
        console.log(`Total imported: ${totalRecords}`)
      }
    }

    console.log(`Import completed! Total records: ${totalRecords}`)

    // Verify import
    const count = await prisma.wilayah.count()
    console.log(`Database now contains ${count} wilayah records`)
  } catch (error) {
    console.error('Error importing wilayah data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importWilayah()
