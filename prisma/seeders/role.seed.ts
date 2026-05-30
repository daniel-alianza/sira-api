import type { PrismaClient } from '../../generated/prisma/client';
import { Logger } from '@nestjs/common';

const ROLE_NAMES: string[] = ['Administrador', 'Inspector', 'Responsable'];

export async function seedRoles(prismaClient: PrismaClient): Promise<void> {
  const rolesCount = await prismaClient.role.count();

  if (rolesCount > 0) {
    Logger.log(
      `⚠️  Seeder de roles omitido: ya existen ${rolesCount} registro(s).`,
    );
    return;
  }

  await prismaClient.role.createMany({
    data: ROLE_NAMES.map((name: string) => ({ name })),
    skipDuplicates: true,
  });

  Logger.log(`✅ Seeder de roles completado: ${ROLE_NAMES.length} creados.`);
}
