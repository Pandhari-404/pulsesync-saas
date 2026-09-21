import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config';
import { signToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { emitToWorkspace } from '../sockets';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    // Auto-create initial workspace for user
    const workspaceName = validated.workspaceName || `${validated.name}'s Team`;
    const workspaceSlug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: workspaceSlug,
        plan: 'PRO',
      },
    });

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: 'ADMIN', // First user in workspace is ADMIN
        workspaceId: workspace.id,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'USER',
        entityId: user.id,
        details: `User ${user.email} registered and created workspace ${workspace.name}`,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: workspace.id,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          plan: workspace.plan,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: { workspace: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        workspace: {
          id: user.workspace.id,
          name: user.workspace.name,
          slug: user.workspace.slug,
          plan: user.workspace.plan,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { workspace: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        workspace: user.workspace,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const demoLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = (req.query.role as string)?.toUpperCase() === 'VIEWER' ? 'VIEWER' : 'ADMIN';

    // Find demo user matching role
    let user = await prisma.user.findFirst({
      where: { role },
      include: { workspace: true },
    });

    if (!user) {
      // Fallback to any user
      user = await prisma.user.findFirst({
        include: { workspace: true },
      });
    }

    if (!user) {
      res.status(404).json({ success: false, error: 'No demo accounts found. Please seed the database.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    });

    res.status(200).json({
      success: true,
      message: `Authenticated as Demo ${user.role}`,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        workspace: {
          id: user.workspace.id,
          name: user.workspace.name,
          slug: user.workspace.slug,
          plan: user.workspace.plan,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
