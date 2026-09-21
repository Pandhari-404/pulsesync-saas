import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config';
import {
  createIncidentSchema,
  updateIncidentSchema,
  addIncidentUpdateSchema,
} from '../schemas/incident.schema';
import { emitToWorkspace } from '../sockets';
import { incidentsCreatedCounter } from '../utils/metrics';

export const getIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId;
    const { status, severity, search, limit = '50', offset = '0' } = req.query;

    const where: any = { workspaceId };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (severity && typeof severity === 'string') {
      where.severity = severity;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { serviceName: { contains: search } },
      ];
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      }),
      prisma.incident.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: incidents,
      pagination: {
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const workspaceId = req.user!.workspaceId;

    const incident = await prisma.incident.findFirst({
      where: { id, workspaceId },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        updates: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

export const createIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createIncidentSchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const creatorId = req.user!.userId;

    const incident = await prisma.incident.create({
      data: {
        title: validated.title,
        description: validated.description,
        severity: validated.severity,
        serviceName: validated.serviceName,
        status: 'INVESTIGATING',
        workspaceId,
        creatorId,
        assigneeId: validated.assigneeId || null,
        updates: {
          create: {
            authorId: creatorId,
            status: 'INVESTIGATING',
            message: `Incident opened: ${validated.title}`,
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        updates: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Prometheus metric increment
    incidentsCreatedCounter.inc({
      severity: validated.severity,
      service_name: validated.serviceName,
    });

    // Emit real-time WebSocket event to all team members in workspace
    emitToWorkspace(workspaceId, 'incident:created', incident);

    // Audit log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: creatorId,
        action: 'INCIDENT_CREATED',
        entityType: 'INCIDENT',
        entityId: incident.id,
        details: `Incident "${incident.title}" created with severity ${incident.severity}`,
      },
    });

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

export const updateIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const workspaceId = req.user!.workspaceId;
    const validated = updateIncidentSchema.parse(req.body);

    const existing = await prisma.incident.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    const isResolving = validated.status === 'RESOLVED' && existing.status !== 'RESOLVED';

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...validated,
        resolvedAt: isResolving ? new Date() : (validated.status && validated.status !== 'RESOLVED' ? null : undefined),
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        updates: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    // If status changed, record timeline update automatically
    if (validated.status && validated.status !== existing.status) {
      await prisma.incidentUpdate.create({
        data: {
          incidentId: id,
          authorId: req.user!.userId,
          status: validated.status,
          message: `Status updated from ${existing.status} to ${validated.status}`,
        },
      });
    }

    // Broadcast real-time update
    emitToWorkspace(workspaceId, 'incident:updated', updated);

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const workspaceId = req.user!.workspaceId;
    const validated = addIncidentUpdateSchema.parse(req.body);

    const incident = await prisma.incident.findFirst({
      where: { id, workspaceId },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId: id,
        authorId: req.user!.userId,
        status: validated.status,
        message: validated.message,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Update incident status if changed
    if (validated.status !== incident.status) {
      await prisma.incident.update({
        where: { id },
        data: {
          status: validated.status,
          resolvedAt: validated.status === 'RESOLVED' ? new Date() : undefined,
        },
      });
    }

    // Broadcast update
    emitToWorkspace(workspaceId, 'incident:comment', {
      incidentId: id,
      update,
      status: validated.status,
    });

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    next(error);
  }
};

export const deleteIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const workspaceId = req.user!.workspaceId;

    const incident = await prisma.incident.findFirst({
      where: { id, workspaceId },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    await prisma.incident.delete({ where: { id } });

    // Real-time broadcast
    emitToWorkspace(workspaceId, 'incident:deleted', { id });

    res.status(200).json({ success: true, message: 'Incident deleted successfully' });
  } catch (error) {
    next(error);
  }
};
