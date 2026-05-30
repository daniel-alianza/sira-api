import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Logger } from '@nestjs/common';

import { seedAreas } from './seeders/area.seed';
import { seedBranches } from './seeders/branch.seed';
import { seedCompanies } from './seeders/company.seed';
import { seedRoles } from './seeders/role.seed';
import { seedUsers } from './seeders/users.seed';

const prismaAdapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'] ?? '',
});

const prismaClient = new PrismaClient({
  adapter: prismaAdapter,
});

async function main(): Promise<void> {
  Logger.log('🌱 Iniciando proceso de seed...');
  Logger.log('🏢 Ejecutando seeder de compañías...');

  await seedCompanies(prismaClient);

  Logger.log('📂 Ejecutando seeder de áreas...');
  await seedAreas(prismaClient);

  Logger.log('🏪 Ejecutando seeder de sucursales...');
  await seedBranches(prismaClient);

  Logger.log('🛡️ Ejecutando seeder de roles...');
  await seedRoles(prismaClient);

  Logger.log('👤 Ejecutando seeder de usuarios...');
  await seedUsers(prismaClient);

  Logger.log('🎉 Seed finalizado correctamente.');
}

main()
  .catch((error: unknown) => {
    Logger.error('❌ Error durante el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    Logger.log('🔌 Conexión a la base de datos cerrada.');
  });
