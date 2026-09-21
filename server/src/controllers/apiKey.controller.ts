import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config';
import { createApiKeySchema } from '../schemas/apiKey.schema';

export const getApiKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId;

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        revokedAt: k.revokedAt,
        creator: k.creator,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createApiKeySchema.parse(req.body);
    const workspaceId = req.user!.workspaceId;
    const creatorId = req.user!.userId;

    // Generate secure API key: psk_live_<32 hex chars>
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawApiKey = `psk_live_${randomBytes}`;
    const prefix = rawApiKey.substring(0, 12) + '...';
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const keyRecord = await prisma.apiKey.create({
      data: {
        name: validated.name,
        keyHash,
        prefix,
        workspaceId,
        creatorId,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: creatorId,
        action: 'API_KEY_CREATED',
        entityType: 'API_KEY',
        entityId: keyRecord.id,
        details: `Generated API key "${keyRecord.name}" (${prefix})`,
      },
    });

    // Return the full raw API key ONLY on creation
    res.status(201).json({
      success: true,
      message: 'API key created. Please save it securely, it will not be shown again.',
      data: {
        id: keyRecord.id,
        name: keyRecord.name,
        prefix: keyRecord.prefix,
        apiKey: rawApiKey,
        createdAt: keyRecord.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const workspaceId = req.user!.workspaceId;

    const keyRecord = await prisma.apiKey.findFirst({
      where: { id, workspaceId },
    });

    if (!keyRecord) {
      res.status(404).json({ success: false, error: 'API key not found' });
      return;
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user!.userId,
        action: 'API_KEY_REVOKED',
        entityType: 'API_KEY',
        entityId: id,
        details: `Revoked API key "${keyRecord.name}"`,
      },
    });

    res.status(200).json({ success: true, message: 'API key revoked successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
