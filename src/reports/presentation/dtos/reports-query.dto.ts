import { z } from 'zod';

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD');

export const reportsQuerySchema = z
  .object({
    periodPreset: z.enum(['daily', 'weekly', 'custom']),
    dateFrom: dateOnlySchema.optional(),
    dateTo: dateOnlySchema.optional(),
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
  })
  .superRefine((value, context) => {
    if (value.periodPreset !== 'custom') {
      return;
    }

    if (!value.dateFrom) {
      context.addIssue({
        code: 'custom',
        message: 'dateFrom es requerida para periodo personalizado',
        path: ['dateFrom'],
      });
    }

    if (!value.dateTo) {
      context.addIssue({
        code: 'custom',
        message: 'dateTo es requerida para periodo personalizado',
        path: ['dateTo'],
      });
    }
  });

export type ReportsQueryDto = z.infer<typeof reportsQuerySchema>;
