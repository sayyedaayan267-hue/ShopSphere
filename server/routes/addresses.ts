import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

const AddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(3, 'Address line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Valid PIN/Postal code is required'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

// GET /api/v1/addresses
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ success: true, addresses });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch addresses' });
  }
});

// POST /api/v1/addresses
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = AddressSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: parse.error.issues[0]?.message || 'Invalid address details',
      });
    }

    const data = parse.data;

    // If marked default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    // Check if this is the user's first address
    const count = await prisma.address.count({ where: { userId: req.user!.id } });
    const isFirstAddress = count === 0;

    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault || isFirstAddress,
      },
    });

    return res.status(201).json({
      success: true,
      address,
      message: 'Address saved successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to save address' });
  }
});

// PUT /api/v1/addresses/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    const parse = AddressSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    if (parse.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: parse.data,
    });

    return res.json({ success: true, address: updated, message: 'Address updated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update address' });
  }
});

// DELETE /api/v1/addresses/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });
    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

// PUT /api/v1/addresses/:id/default
router.put('/:id/default', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return res.json({ success: true, address: updated, message: 'Default address updated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to set default address' });
  }
});

export default router;
