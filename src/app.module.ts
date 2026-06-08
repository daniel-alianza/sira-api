import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CorrectiveModule } from './corrective_action/corrective.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IaModule } from './ia/ia.module';
import { NotificationModule } from './notification/notification.module';
import { ReportsModule } from './reports/reports.module';
import { MediaModule } from './media/media.module';
import { ToursModule } from './tours/tours.module';
import { UsersModule } from './users/users.module';
import { validateEnv } from './config/env-validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    UsersModule,
    ToursModule,
    CorrectiveModule,
    MediaModule,
    DashboardModule,
    IaModule,
    ReportsModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
