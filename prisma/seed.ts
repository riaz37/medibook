import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { rolePermissions } from '../src/lib/constants/permissions'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding roles and permissions...')
  const roles = ["patient", "doctor", "admin"];
  
  for (const roleName of roles) {
    console.log(`Processing role: ${roleName}`)
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`,
      },
    });

    const permissions = rolePermissions[roleName as keyof typeof rolePermissions];
    
    for (const perm of permissions) {
      const permissionName = `${perm.resource}:${perm.action}`;
      
      const permission = await prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          description: `Allow ${perm.action} on ${perm.resource}`,
        },
      });

      // Link permission to role
      // Check if already linked
      const count = await prisma.role.count({
        where: {
          id: role.id,
          permissions: {
            some: { id: permission.id }
          }
        }
      });
      
      if (count === 0) {
        await prisma.role.update({
          where: { id: role.id },
          data: {
            permissions: {
              connect: { id: permission.id }
            }
          }
        });
      }
    }
  }
  console.log('Seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
