import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(2, 'Key name must have at least 2 characters'),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
