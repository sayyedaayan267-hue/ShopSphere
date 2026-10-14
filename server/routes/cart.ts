import { Router, Response } from 'express';
import prisma from '../db.ts';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Helper to calculate totals from cart items
async function calculateCartSummary(cartItems: any[], couponCode?: string) {
  let subtotal = 0;
  let itemsCount = 0;

  const validItems = cartItems.map((item) => {
    const itemSubtotal = item.product.price * item.quantity;
    subtotal += itemSubtotal;
    itemsCount += item.quantity;
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        price: item.product.price,
        compareAtPrice: item.product.compareAtPrice,
        stock: item.product.stock,
        brand: item.product.brand,
        images: item.product.images,
      },
      itemTotal: itemSubtotal,
      inStock: item.product.stock >= item.quantity,
    };
  });

  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase().trim() },
    });

    const now = new Date();
    if (
      coupon &&
      coupon.isActive &&
      coupon.validFrom <= now &&
      coupon.validUntil >= now &&
      coupon.timesUsed < coupon.usageLimit &&
      subtotal >= coupon.minOrderValue
    ) {
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
      };
    }
  }

  // Free shipping on orders >= ₹500, else ₹49
  const taxableAmount = Math.max(0, subtotal - discount);
  const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 49;
  // Estimated GST (18%) included in prices, but calculated for invoice breakdown
  const tax = Number((taxableAmount * 0.18).toFixed(2));
  const finalTotal = Number((taxableAmount + shippingFee).toFixed(2));

  return {
    items: validItems,
    itemsCount,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    appliedCoupon,
    shippingFee,
    tax,
    total: finalTotal,
  };
}

// Helper to get or create cart
async function getOrCreateCart(req: AuthenticatedRequest) {
  if (req.user) {
    let cart = await prisma.cart.findFirst({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  // Guest Cart
  let guestToken = req.guestToken;
  if (!guestToken) {
    guestToken = `guest_${Math.random().toString(36).substring(2)}${Date.now()}`;
    req.guestToken = guestToken;
  }

  let cart = await prisma.cart.findUnique({
    where: { guestToken },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { guestToken },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

// GET /api/v1/cart
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couponCode = req.query.coupon as string;
    const cart = await getOrCreateCart(req);
    const summary = await calculateCartSummary(cart.items, couponCode);

    if (req.guestToken && !req.user) {
      res.cookie('shopsphere_guest', req.guestToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        path: '/',
      });
    }

    return res.json({
      success: true,
      cartId: cart.id,
      guestToken: req.guestToken,
      ...summary,
    });
  } catch (error: any) {
    console.error('Cart fetch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
});

// POST /api/v1/cart/items - Add to cart
router.post('/items', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10));

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: 'Product is unavailable' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} units currently in stock.`,
      });
    }

    const cart = await getOrCreateCart(req);

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const newQuantity = existingItem ? existingItem.quantity + qty : qty;
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        error: `Cannot add more than available stock (${product.stock} available).`,
      });
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: qty,
      },
      update: {
        quantity: newQuantity,
      },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    const summary = await calculateCartSummary(updatedCart?.items || []);

    if (req.guestToken && !req.user) {
      res.cookie('shopsphere_guest', req.guestToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    return res.json({
      success: true,
      cartId: cart.id,
      guestToken: req.guestToken,
      ...summary,
      message: 'Item added to cart',
    });
  } catch (error: any) {
    console.error('Add cart item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
});

// PUT /api/v1/cart/items/:itemId - Update item quantity
router.put('/items/:itemId', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      if (qty > item.product.stock) {
        return res.status(400).json({
          success: false,
          error: `Only ${item.product.stock} units available in stock`,
        });
      }
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: qty },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    const summary = await calculateCartSummary(updatedCart?.items || []);
    return res.json({ success: true, ...summary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update item quantity' });
  }
});

// DELETE /api/v1/cart/items/:itemId - Remove item
router.delete('/items/:itemId', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    const summary = await calculateCartSummary(updatedCart?.items || []);
    return res.json({ success: true, ...summary, message: 'Item removed from cart' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

// DELETE /api/v1/cart - Clear cart
router.delete('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cart = await getOrCreateCart(req);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.json({
      success: true,
      items: [],
      itemsCount: 0,
      subtotal: 0,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 0,
      message: 'Cart cleared',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
});

// POST /api/v1/cart/apply-coupon
router.post('/apply-coupon', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ success: false, error: 'Invalid or inactive coupon code.' });
    }

    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      return res.status(400).json({ success: false, error: 'This coupon has expired.' });
    }

    if (coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ success: false, error: 'Coupon usage limit has been reached.' });
    }

    const cart = await getOrCreateCart(req);
    const summary = await calculateCartSummary(cart.items, coupon.code);

    if (summary.subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        error: `Minimum cart value of ₹${coupon.minOrderValue} required for this coupon.`,
      });
    }

    return res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: summary.discount,
      },
      ...summary,
      message: `Coupon ${coupon.code} applied successfully!`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

export default router;
