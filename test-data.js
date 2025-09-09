const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const data = await prisma.dailySubActivity.findMany({
      select: {
        subActivityId: true,
        tanggalProgres: true,
        id: true,
      },
      orderBy: [
        { subActivityId: 'asc' },
        { tanggalProgres: 'desc' }
      ]
    });
    
    console.log('All daily sub activities:');
    data.forEach(item => {
      console.log(`SubActivity ID: ${item.subActivityId}, Date: ${item.tanggalProgres}, ID: ${item.id}`);
    });
    
    // Group by subActivityId to see if there are duplicates
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.subActivityId]) {
        grouped[item.subActivityId] = [];
      }
      grouped[item.subActivityId].push({
        id: item.id,
        date: item.tanggalProgres
      });
    });
    
    console.log('\n\nGrouped by subActivityId:');
    Object.entries(grouped).forEach(([subActivityId, entries]) => {
      console.log(`SubActivity: ${subActivityId}`);
      entries.forEach(entry => {
        console.log(`  - ID: ${entry.id}, Date: ${entry.date}`);
      });
    });
    
    console.log('\n\nDuplicates found:');
    Object.entries(grouped).forEach(([subActivityId, entries]) => {
      if (entries.length > 1) {
        console.log(`SubActivity: ${subActivityId} has ${entries.length} entries`);
        entries.forEach(entry => {
          console.log(`  - ID: ${entry.id}, Date: ${entry.date}`);
        });
      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

test();
