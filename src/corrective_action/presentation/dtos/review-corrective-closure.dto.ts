import { z } from 'zod';

export const reviewCorrectiveClosureBodySchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    reviewNotes: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === 'reject' && !value.reviewNotes?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['reviewNotes'],
        message: 'Indica el motivo del rechazo',
      });
    }
  });

export type ReviewCorrectiveClosureBodyDto = z.infer<
  typeof reviewCorrectiveClosureBodySchema
>;
