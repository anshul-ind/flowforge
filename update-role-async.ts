import { prisma } from '@/lib/db';

async function updateRole() {
  try {
    // Update all VIEWER roles to OWNER
    const result = await prisma.workspaceMember.updateMany({
      where: {
        role: 'VIEWER',
      },
      data: {
        role: 'OWNER',
      },
    });

    console.log(`✅ Updated ${result.count} workspace members from VIEWER to OWNER`);
    
    // Show all members
    const all = await prisma.workspaceMember.findMany({
      include: {
        user: { select: { email: true } },
        workspace: { select: { name: true } },
      },
    });
    
    console.log('\n📋 All workspace members:');
    all.forEach(m => {
      console.log(`  - ${m.user.email} → ${m.workspace.name}: ${m.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateRole();
