import { z } from 'zod'

export const meetingsInsertSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  agentId: z.string().min(1, { message: 'Agent ID is required' }),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled', 'processing']).optional(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  transcriptUrl: z.string().optional(),
  recordingUrl: z.string().optional(),
  summary: z.string().optional(),
})

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
  id: z.string().min(1, { message: 'ID is required' })
});
