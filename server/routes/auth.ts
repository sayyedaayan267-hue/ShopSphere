import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db.ts';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateResetToken,
  hashToken,
} from '../utils/crypto.ts';
import {
  requireAuth,
  AuthenticatedRequest,
  optionalAuth,
} from '../middleware/auth.ts';
import { createRateLimiter } from '../middleware/rateLimit.ts';

const router = Router();

// Rate limiter for auth endpoints: 10 attempts per minute
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please try again in a minute.',
});

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Set session cookie helper
export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie('shopsphere_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Validation failed',
      });
    }

    const { name, password, phone } = parse.data;
    const email = parse.data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // Create session (14 days)
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    setSessionCookie(res, sessionToken, expiresAt);

    // Merge guest cart if guestToken exists
    const guestToken = req.body.guestToken || req.cookies?.shopsphere_guest;
    if (guestToken) {
      const guestCart = await prisma.cart.findUnique({
        where: { guestToken },
        include: { items: true },
      });
      if (guestCart && guestCart.items.length > 0) {
        let userCart = await prisma.cart.findFirst({
          where: { userId: user.id },
        });
        if (!userCart) {
          userCart = await prisma.cart.create({ data: { userId: user.id } });
        }
        for (const item of guestCart.items) {
          await prisma.cartItem.upsert({
            where: {
              cartId_productId: {
                cartId: userCart.id,
                productId: item.productId,
              },
            },
            create: {
              cartId: userCart.id,
              productId: item.productId,
              quantity: item.quantity,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });
        }
        await prisma.cart.delete({ where: { id: guestCart.id } });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip || null,
      },
    });

    return res.status(201).json({
      success: true,
      user,
      token: sessionToken,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create account.' });
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid credentials provided',
      });
    }

    const email = parse.data.email.toLowerCase().trim();
    const { password } = parse.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password combination.',
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password combination.',
      });
    }

    // Create session (14 days)
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    setSessionCookie(res, sessionToken, expiresAt);

    // Merge guest cart if available
    const guestToken = req.body.guestToken || req.cookies?.shopsphere_guest;
    if (guestToken) {
      const guestCart = await prisma.cart.findUnique({
        where: { guestToken },
        include: { items: true },
      });
      if (guestCart && guestCart.items.length > 0) {
        let userCart = await prisma.cart.findFirst({
          where: { userId: user.id },
        });
        if (!userCart) {
          userCart = await prisma.cart.create({ data: { userId: user.id } });
        }
        for (const item of guestCart.items) {
          await prisma.cartItem.upsert({
            where: {
              cartId_productId: {
                cartId: userCart.id,
                productId: item.productId,
              },
            },
            create: {
              cartId: userCart.id,
              productId: item.productId,
              quantity: item.quantity,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });
        }
        await prisma.cart.delete({ where: { id: guestCart.id } });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip || null,
      },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token: sessionToken,
      message: 'Logged in successfully',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.sessionToken) {
      await prisma.session.deleteMany({
        where: { id: req.sessionToken },
      });
    }

    res.clearCookie('shopsphere_session', { path: '/' });

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.clearCookie('shopsphere_session', { path: '/' });
    return res.json({ success: true, message: 'Logged out' });
  }
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

// PUT /api/v1/auth/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Valid name is required' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    return res.json({ success: true, user: updated, message: 'Profile updated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// POST /api/v1/auth/change-password
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = ChangePasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid input',
      });
    }

    const { currentPassword, newPassword } = parse.data;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Current password does not match' });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = ForgotPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    const email = parse.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success message to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists in our records, a password reset link has been dispatched.',
      });
    }

    const { token, hash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hash,
        userId: user.id,
        expiresAt,
      },
    });

    // Provide the reset token directly in dev/test response for convenient verification
    return res.json({
      success: true,
      message: 'If that email exists in our records, a password reset link has been dispatched.',
      resetToken: process.env.NODE_ENV !== 'production' ? token : undefined,
      resetUrl:
        process.env.NODE_ENV !== 'production'
          ? `/reset-password?token=${token}`
          : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to process password reset' });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = ResetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid input',
      });
    }

    const { token, newPassword } = parse.data;
    const tokenHash = hashToken(token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all active sessions for security
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return res.json({
      success: true,
      message: 'Password reset successfully. You may now sign in with your new password.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

export default router;
