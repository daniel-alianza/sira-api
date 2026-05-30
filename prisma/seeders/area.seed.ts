import type { PrismaClient } from '../../generated/prisma/client';
import { Logger } from '@nestjs/common';

const AREA_NAMES: string[] = [
  'Direccion',
  'Administración',
  'Almacén',
  'Atención a clientes',
  'Auditoría Externa',
  'Auditoría Interna',
  'Calidad',
  'Contabilidad',
  'Compras',
  'Ingeniería',
  'Logística',
  'Mantenimiento',
  'Manufactura',
  'Mercadotecnia',
  'Producción',
  'Recursos Humanos',
  'Seguridad e Higiene',
  'Tecnologías de la Información',
  'Innovación y Transformación Digital',
  'Ventas',
];

export async function seedAreas(prismaClient: PrismaClient): Promise<void> {
  const areasCount = await prismaClient.area.count();

  if (areasCount > 0) {
    Logger.log(
      `⚠️  Seeder de áreas omitido: ya existen ${areasCount} registro(s).`,
    );
    return;
  }

  await prismaClient.area.createMany({
    data: AREA_NAMES.map((name: string) => ({ name })),
    skipDuplicates: true,
  });

  Logger.log(`✅ Seeder de áreas completado: ${AREA_NAMES.length} creadas.`);
}
