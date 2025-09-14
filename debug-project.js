const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProject() {
  try {
    const project = await prisma.project.findUnique({
      where: { id: 'project-004' },
      select: {
        id: true,
        paguAnggaran: true,
        nilaiKontrak: true,
        keuanganProgress: true,
        keuanganTarget: true,
        keuanganDeviasi: true,
      }
    });
    
    console.log('Project data:', JSON.stringify(project, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProject();
