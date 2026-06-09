import type { PrismaClient } from '../../generated/prisma/client';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

interface UserSeedData {
  name: string;
  email: string;
  password: string;
  roleName: string;
  areaName: string;
  companyName: string;
  branchName: string;
}

const USERS: UserSeedData[] = [
  {
    name: 'Brandon Daniel Ortiz Mejia',
    email: 'daniel.ortiz@alianzaelectrica.com',
    password: 'danielo10',
    roleName: 'Administrador',
    areaName: 'Tecnologías de la Información',
    companyName: 'Alianza Electrica',
    branchName: 'Atizapan',
  },
  {
    name: 'Juan Carlos Morales',
    email: 'juan.morales@alianzaelectrica.com',
    password: 'JuMo2026$',
    roleName: 'Administrador',
    areaName: 'Innovación y Transformación Digital',
    companyName: 'Fg Electrical',
    branchName: 'Atizapan',
  },
  {
    name: 'Iselt Olvera',
    email: 'iselt.olvera@alianzaelectrica.com',
    password: 'IsOl2026$',
    roleName: 'Administrador',
    areaName: 'Recursos Humanos',
    companyName: 'Alianza Electrica',
    branchName: 'Atizapan',
  },
  {
    name: 'OCCELI ANAHI ALEJANDRE FUENTE',
    email: 'occeli.alejandre@fgelectrical.com',
    password: 'OcFu2026$',
    roleName: 'Inspector',
    areaName: 'Seguridad e Higiene',
    companyName: 'Alianza Electrica',
    branchName: 'Atizapan',
  },
  {
    name: 'DANIEL JOSHUA MUÑOZ HERNÁNDEZ',
    email: 'auxiliar.seguridad@alianzaelectrica.com',
    password: 'DaHe2026$',
    roleName: 'Inspector',
    areaName: 'Seguridad e Higiene',
    companyName: 'Alianza Electrica',
    branchName: 'Atizapan',
  },
  {
    name: 'Responsable Prueba',
    email: 'responsable.prueba@alianzaelectrica.com',
    password: 'RePr2026$',
    roleName: 'Responsable',
    areaName: 'Almacén',
    companyName: 'Fg Electrical',
    branchName: 'Atizapan',
  },
];

export async function seedUsers(prismaClient: PrismaClient): Promise<void> {
  const usersCount = await prismaClient.user.count();

  if (usersCount > 0) {
    Logger.log(
      `⚠️  Seeder de usuarios omitido: ya existen ${usersCount} registro(s).`,
    );
    return;
  }

  let createdCount = 0;

  for (const userData of USERS) {
    const [company, area, branch, role] = await Promise.all([
      prismaClient.company.findUnique({
        where: { name: userData.companyName },
      }),
      prismaClient.area.findUnique({ where: { name: userData.areaName } }),
      prismaClient.branch.findUnique({ where: { name: userData.branchName } }),
      prismaClient.role.findUnique({ where: { name: userData.roleName } }),
    ]);

    if (!company || !area || !branch || !role) {
      Logger.warn(
        `⚠️  Usuario ${userData.email} omitido: referencia no encontrada.`,
      );
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    await prismaClient.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        companyId: company.id,
        areaId: area.id,
        branchId: branch.id,
        roleId: role.id,
      },
    });

    createdCount++;
  }

  Logger.log(`✅ Seeder de usuarios completado: ${createdCount} creados.`);
}
