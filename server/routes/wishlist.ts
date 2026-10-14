import { Router, Response } from 'express';
import prisma from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// All wishlist routes require authentication
router.use(requireAuth);

// GET /api/v1/wishlist
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: {
            category: { select: { name: true, slug: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        createdAt: i.createdAt,
        product: i.product,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch wishlist' });
  }
});

// POST /api/v1/wishlist/toggle
router.post('/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user!.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return res.json({
        success: true,
        inWishlist: false,
        message: 'Removed from your Wishlist',
      });
    }

    await prisma.wishlistItem.create({
      data: {
        userId: req.user!.id,
        productId,
      },
    });

    return res.json({
      success: true,
      inWishlist: true,
      message: 'Added to your Wishlist',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
});

// DELETE /api/v1/wishlist/:productId
router.delete('/:productId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user!.id,
        productId,
      },
    });
    return res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
  }
});

export default router;
