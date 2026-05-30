import type { PrismaClient } from '../../generated/prisma/client';
import { Logger } from '@nestjs/common';

const BRANCH_NAMES: string[] = [
  'Atizapan',
  'Culiacan',
  'Hermosillo',
  'La paz',
  'Leon',
  'Merida, Yucatan',
  'Monterrey',
  'Puebla',
  'Queretaro',
  'San Luis Potosi',
];

export async function seedBranches(prismaClient: PrismaClient): Promise<void> {
  const branchesCount = await prismaClient.branch.count();

  if (branchesCount > 0) {
    Logger.log(
      `⚠️  Seeder de sucursales omitido: ya existen ${branchesCount} registro(s).`,
    );
    return;
  }

  await prismaClient.branch.createMany({
    data: BRANCH_NAMES.map((name: string) => ({ name })),
    skipDuplicates: true,
  });

  Logger.log(
    `✅ Seeder de sucursales completado: ${BRANCH_NAMES.length} creadas.`,
  );
}
