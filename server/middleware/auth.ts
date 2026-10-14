import { Request, Response, NextFunction } from 'express';
import prisma from '../db.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionToken?: string;
  guestToken?: string;
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken =
      req.cookies?.shopsphere_session ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    const guestToken =
      (req.headers['x-guest-token'] as string) || req.cookies?.shopsphere_guest;
    if (guestToken) {
      req.guestToken = guestToken;
    }

    if (!sessionToken) {
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
          },
        },
      },
    });

    if (session && session.expiresAt > new Date()) {
      req.user = session.user;
      req.sessionToken = session.id;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to continue.',
      });
    }
    next();
  });
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Administrator privileges required.',
      });
    }
    next();
  });
}
