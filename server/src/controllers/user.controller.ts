import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config';

export const getWorkspaceMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.user!.workspaceId;

    const members = await prisma.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const workspaceId = req.user!.workspaceId;

    if (!['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role specified' });
      return;
    }

    // Check user belongs to workspace
    const userToUpdate = await prisma.user.findFirst({
      where: { id, workspaceId },
    });

    if (!userToUpdate) {
      res.status(404).json({ success: false, error: 'Team member not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user!.userId,
        action: 'USER_ROLE_UPDATED',
        entityType: 'USER',
        entityId: id,
        details: `User ${updated.email} role changed to ${role}`,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, role = 'MEMBER' } = req.body;
    const workspaceId = req.user!.workspaceId;

    if (!email || !name) {
      res.status(400).json({ success: false, error: 'Name and email are required' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    const tempPassword = 'PulsePassword123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId: req.user!.userId,
        action: 'USER_INVITED',
        entityType: 'USER',
        entityId: newUser.id,
        details: `Invited user ${newUser.email} with role ${role}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: { ...newUser, initialTemporaryPassword: tempPassword },
    });
  } catch (error) {
    next(error);
  }
};
