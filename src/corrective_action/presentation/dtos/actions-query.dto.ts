import { z } from 'zod';

export const actionsQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
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
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type ActionsQueryDto = z.infer<typeof actionsQuerySchema>;
