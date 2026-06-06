import { z } from 'zod';

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD');

export const dashboardSummaryQuerySchema = z.object({
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
  refresh: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export type DashboardSummaryQueryDto = z.infer<
  typeof dashboardSummaryQuerySchema
>;
