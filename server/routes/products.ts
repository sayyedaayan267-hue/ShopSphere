import { Router, Request, Response } from 'express';
import prisma from '../db.ts';

const router = Router();

// GET /api/v1/products - List, filter, sort, paginate
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      rating,
      inStock,
      brand,
      sort = 'featured',
      page = '1',
      limit = '16',
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 16));
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {
      isActive: true,
    };

    if (q) {
      const searchTerm = String(q).trim();
      where.OR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { brand: { contains: searchTerm } },
      ];
    }

    if (category && category !== 'all') {
      where.category = {
        slug: String(category),
      };
    }

    if (brand) {
      where.brand = String(brand);
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (rating) {
      where.rating = {
        gte: parseFloat(rating as string),
      };
    }

    if (inStock === 'true') {
      where.stock = {
        gt: 0,
      };
    }

    let orderBy: any = [{ isFeatured: 'desc' }, { id: 'desc' }];
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      products,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/v1/products/categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET /api/v1/products/suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: q.trim() } },
          { brand: { contains: q.trim() } },
        ],
      },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        brand: true,
        price: true,
        category: {
          select: { name: true, slug: true },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
      },
    });

    return res.json({ success: true, suggestions: products });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
});

// GET /api/v1/products/featured
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const [featuredDeals, topRated, newArrivals] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        take: 8,
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, rating: { gte: 4.5 } },
        take: 8,
        orderBy: { rating: 'desc' },
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true, slug: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
        },
      }),
    ]);

    return res.json({
      success: true,
      featuredDeals,
      topRated,
      newArrivals,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to load featured products' });
  }
});

// GET /api/v1/products/related/:productId
router.get('/related/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    if (!current) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const related = await prisma.product.findMany({
      where: {
        categoryId: current.categoryId,
        id: { not: productId },
        isActive: true,
      },
      take: 6,
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
      },
    });

    return res.json({ success: true, related });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch related products' });
  }
});

// GET /api/v1/products/:slugOrId
router.get('/:slugOrId', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        isActive: true,
      },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, product });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to load product' });
  }
});

export default router;
