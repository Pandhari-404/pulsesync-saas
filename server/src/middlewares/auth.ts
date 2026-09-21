import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      apiKey?: {
        id: string;
        name: string;
        workspaceId: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Check API Key header
    const apiKeyHeader = req.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      const hashedKey = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');
      const foundKey = await prisma.apiKey.findUnique({
        where: { keyHash: hashedKey },
        include: { workspace: true, creator: true },
      });

      if (!foundKey || foundKey.revokedAt) {
        res.status(401).json({ success: false, error: 'Invalid or revoked API key' });
        return;
      }

      // Update lastUsedAt asynchronously
      prisma.apiKey.update({
        where: { id: foundKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      req.apiKey = {
        id: foundKey.id,
        name: foundKey.name,
        workspaceId: foundKey.workspaceId,
      };

      req.user = {
        userId: foundKey.creatorId,
        email: foundKey.creator.email,
        role: foundKey.creator.role,
        workspaceId: foundKey.workspaceId,
      };

      next();
      return;
    }

    // 2. Check Bearer Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authorization header missing or invalid' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Authentication failed: Invalid or expired token' });
  }
};

// Role-Based Access Control middleware
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated user' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`,
      });
      return;
    }

    next();
  };
};
