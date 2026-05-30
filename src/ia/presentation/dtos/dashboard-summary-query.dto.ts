import { z } from 'zod';

export const dashboardSummaryQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  responsibleId: z.string().uuid().optional(),
  refresh: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export type DashboardSummaryQueryDto = z.infer<
  typeof dashboardSummaryQuerySchema
>;
