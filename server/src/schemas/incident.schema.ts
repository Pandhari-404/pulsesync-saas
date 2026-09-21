import { z } from 'zod';

export const createIncidentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  serviceName: z.string().min(2, 'Service name is required').default('Core API'),
  assigneeId: z.string().uuid().optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  serviceName: z.string().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export const addIncidentUpdateSchema = z.object({
  message: z.string().min(2, 'Update message is required'),
  status: z.enum(['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED']),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type AddIncidentUpdateInput = z.infer<typeof addIncidentUpdateSchema>;
