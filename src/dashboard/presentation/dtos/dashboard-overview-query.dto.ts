import { z } from 'zod';

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD');

export const dashboardOverviewQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  responsibleId: z.string().uuid().optional(),
  status: z
    .enum([
      'pending_acceptance',
      'open',
      'pending',
      'expired',
      'closure_review',
      'closed',
      'rejected',
      'reopened',
    ])
    .optional(),
  detectionType: z.enum(['unsafe_act', 'unsafe_condition']).optional(),
  dateFrom: dateOnlySchema.optional(),
  dateTo: dateOnlySchema.optional(),
});

export type DashboardOverviewQueryDto = z.infer<
  typeof dashboardOverviewQuerySchema
>;
