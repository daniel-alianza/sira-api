import type { PrismaClient } from '../../generated/prisma/client';
import { Logger } from '@nestjs/common';

const COMPANY_NAMES: string[] = [
  'Alianza Electrica',
  'Fg Electrical',
  'Fg Manufacturing',
  'Tableros y Arrancadores',
];

export async function seedCompanies(prismaClient: PrismaClient): Promise<void> {
  const companiesCount = await prismaClient.company.count();

  if (companiesCount > 0) {
    Logger.log(
      `⚠️  Seeder de compañías omitido: ya existen ${companiesCount} registro(s).`,
    );
    return;
  }

  await prismaClient.company.createMany({
    data: COMPANY_NAMES.map((name: string) => ({ name })),
    skipDuplicates: true,
  });

  Logger.log(
    `✅ Seeder de compañías completado: ${COMPANY_NAMES.length} creadas.`,
  );
}
