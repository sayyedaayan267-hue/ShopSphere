import prisma from './db.ts';
import { hashPassword } from './utils/crypto.ts';

export async function seedDatabase() {
  console.log('Seeding ShopSphere database...');

  // 1. Seed Categories
  const categoriesData = [
    {
      name: 'Electronics & Mobiles',
      slug: 'electronics',
      description: 'Latest flagship smartphones, premium laptops, tablets and digital accessories.',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Audio & Headphones',
      slug: 'audio',
      description: 'Noise cancelling headphones, true wireless earbuds, soundbars and studio monitors.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Fashion & Wearables',
      slug: 'fashion',
      description: 'Designer apparel, smartwatches, activewear, sunglasses and premium footwear.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Smart appliances, espresso machines, cookware, robotic vacuums and decor.',
      image: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Fitness & Outdoor',
      slug: 'fitness-outdoor',
      description: 'Gym equipment, yoga mats, hiking backpacks, hydration gear and smart trainers.',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Books & Learning',
      slug: 'books',
      description: 'Bestselling novels, engineering guides, business literature, and productivity journals.',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const existing = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, existing.id);
  }

  // 2. Seed Admin and Customer Users
  const adminPasswordHash = await hashPassword('Admin@12345');
  const customerPasswordHash = await hashPassword('Customer@12345');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@shopsphere.store' },
    update: {
      name: 'ShopSphere Operations Admin',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
    },
    create: {
      name: 'ShopSphere Operations Admin',
      email: 'admin@shopsphere.store',
      role: 'ADMIN',
      phone: '+91 98765 43210',
      passwordHash: adminPasswordHash,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@shopsphere.store' },
    update: {
      name: 'Aarav Sharma',
      role: 'CUSTOMER',
      passwordHash: customerPasswordHash,
    },
    create: {
      name: 'Aarav Sharma',
      email: 'customer@shopsphere.store',
      role: 'CUSTOMER',
      phone: '+91 91234 56789',
      passwordHash: customerPasswordHash,
    },
  });

  // Seed default address for customer
  await prisma.address.upsert({
    where: { id: 'addr-default-customer' },
    update: {},
    create: {
      id: 'addr-default-customer',
      userId: customerUser.id,
      fullName: 'Aarav Sharma',
      phone: '+91 91234 56789',
      addressLine1: 'Flat 402, Prestige Tech Park Towers',
      addressLine2: 'Outer Ring Road, Kadubeesanahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
      isDefault: true,
    },
  });

  // 3. Seed Products with real, reliable, high-resolution Unsplash photography
  const productsData = [
    {
      title: 'AuraSound Zenith Active Noise Cancelling Headphones',
      slug: 'aurasound-zenith-anc-headphones',
      description: 'Industry-leading hybrid active noise cancellation with 40mm beryllium drivers. Up to 45 hours battery life, multipoint Bluetooth 5.3, memory foam earcups, and ultra-low latency spatial audio mode.',
      price: 18999,
      compareAtPrice: 24999,
      categorySlug: 'audio',
      brand: 'AuraSound',
      rating: 4.8,
      reviewCount: 342,
      stock: 45,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Battery Life': '45 hours with ANC ON',
        'Bluetooth Version': '5.3 Multipoint',
        'Weight': '254 grams',
        'Warranty': '2 Years Official Sphere Care',
      },
    },
    {
      title: 'TitanEdge Nova Pro 5G Smartphone (256GB - Phantom Black)',
      slug: 'titanedge-nova-pro-5g',
      description: 'Flagship OLED 120Hz LTPO display with Snapdragon 8 Gen 3 chipset, 200MP Quad Camera with optical image stabilization, 5400mAh battery, and 100W SuperSonic fast charging.',
      price: 64999,
      compareAtPrice: 79999,
      categorySlug: 'electronics',
      brand: 'TitanEdge',
      rating: 4.9,
      reviewCount: 681,
      stock: 25,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Display': '6.82 inch QHD+ AMOLED 120Hz',
        'RAM / Storage': '16GB LPDDR5X / 256GB UFS 4.0',
        'Camera': '200MP Main + 50MP Periscope + 50MP Ultra-wide',
        'Battery': '5400 mAh with 100W Charging',
      },
    },
    {
      title: 'Chronos Horizon Smart Fitness Watch with ECG & AMOLED',
      slug: 'chronos-horizon-smart-watch',
      description: 'Precision sapphire crystal glass with titanium chassis. Continuous heart rate, SpO2, clinical-grade ECG monitoring, dual-band GPS, and 14 days ultra battery endurance.',
      price: 14499,
      compareAtPrice: 19999,
      categorySlug: 'fashion',
      brand: 'Chronos',
      rating: 4.7,
      reviewCount: 219,
      stock: 60,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Water Resistance': '5ATM / 50 meters',
        'Sensors': 'Optical Heart Rate, SpO2, ECG, Barometer',
        'Battery': 'Up to 14 days typical use',
      },
    },
    {
      title: 'BaristaCraft Milano Espresso & Cappuccino Machine',
      slug: 'baristacraft-milano-espresso-machine',
      description: 'Commercial 15-bar Italian pump with PID temperature control and stainless steel thermoblock system. Integrated micro-foam steam wand for barista-quality latte art at home.',
      price: 21999,
      compareAtPrice: 28999,
      categorySlug: 'home-kitchen',
      brand: 'BaristaCraft',
      rating: 4.8,
      reviewCount: 154,
      stock: 18,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Pump Pressure': '15 Bar Italian Pressure Pump',
        'Water Tank Capacity': '1.8 Liters Removable',
        'Body Material': 'Brushed Stainless Steel',
      },
    },
    {
      title: 'SonicPulse Air True Wireless Earbuds with ANC & Spatial Audio',
      slug: 'sonicpulse-air-tws-earbuds',
      description: 'Compact featherweight wireless earbuds with active ambient reduction, IPX5 water resistance, wireless charging case, and crystal-clear triple microphone call quality.',
      price: 4999,
      compareAtPrice: 7999,
      categorySlug: 'audio',
      brand: 'SonicPulse',
      rating: 4.6,
      reviewCount: 420,
      stock: 80,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Playtime': '32 Hours total with Case',
        'Water Rating': 'IPX5 Sweat & Water Resistant',
      },
    },
    {
      title: 'StrataBook Ultra 14-inch Creator Laptop (M3 Pro Equivalent, 32GB)',
      slug: 'stratabook-ultra-14-creator-laptop',
      description: 'Ultra-thin magnesium unibody laptop with 3.2K 120Hz Mini-LED display, 32GB Unified Memory, 1TB NVMe Gen4 SSD, and whisper-quiet vapor chamber cooling.',
      price: 139999,
      compareAtPrice: 159999,
      categorySlug: 'electronics',
      brand: 'StrataBook',
      rating: 4.9,
      reviewCount: 88,
      stock: 12,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Display': '14.2 inch 3.2K Mini-LED 1000 nits HDR',
        'Memory': '32GB Unified High-Speed RAM',
        'Storage': '1TB NVMe PCIe 4.0 SSD',
      },
    },
    {
      title: 'AeroVelocity Men Lightweight Carbon Road Running Shoes',
      slug: 'aerovelocity-carbon-road-running-shoes',
      description: 'High-energy return nitrogen-infused midsole with embedded curved carbon fiber plate. Breathable engineered jacquard mesh upper designed for marathons and fast 10Ks.',
      price: 8499,
      compareAtPrice: 11999,
      categorySlug: 'fashion',
      brand: 'AeroVelocity',
      rating: 4.7,
      reviewCount: 167,
      stock: 40,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Midsole Technology': 'Supercritical Foam + Carbon Plate',
        'Weight': '210g (Size 9)',
      },
    },
    {
      title: 'AquaSphere Insulated Thermal Stainless Steel Flask (1000ml)',
      slug: 'aquasphere-insulated-thermal-flask-1000ml',
      description: 'Double-wall vacuum insulation keeps drinks ice cold for 28 hours or piping hot for 16 hours. 100% BPA-free 18/8 food-grade stainless steel with leak-proof Chug cap.',
      price: 1499,
      compareAtPrice: 2299,
      categorySlug: 'fitness-outdoor',
      brand: 'AquaSphere',
      rating: 4.8,
      reviewCount: 512,
      stock: 120,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Capacity': '1000 ml / 34 oz',
        'Cold Retention': '28 Hours',
        'Hot Retention': '16 Hours',
      },
    },
    {
      title: 'RoboClean Omni Laser Robotic Vacuum & Mopping System',
      slug: 'roboclean-omni-laser-robot-vacuum',
      description: '6000Pa extreme suction power with LiDAR 3D spatial mapping and automatic mop lifting on carpets. Self-emptying and hot air mop drying dock station.',
      price: 46999,
      compareAtPrice: 59999,
      categorySlug: 'home-kitchen',
      brand: 'RoboClean',
      rating: 4.7,
      reviewCount: 94,
      stock: 8,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Suction Power': '6000 Pa HyperDrive',
        'Navigation': 'LiDAR 3D Obstacle Avoidance',
        'Dock Functions': 'Self-Emptying + Mop Wash & Dry',
      },
    },
    {
      title: 'The Pragmatic System Architect: Principles of Distributed Cloud',
      slug: 'pragmatic-system-architect-distributed-cloud-book',
      description: 'Comprehensive hardbound edition covering distributed microservices, event-driven streaming, consensus algorithms, high-scale database partitioning, and real-world latency optimizations.',
      price: 2499,
      compareAtPrice: 3200,
      categorySlug: 'books',
      brand: 'Sphere Press Publishing',
      rating: 4.9,
      reviewCount: 304,
      stock: 55,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Pages': '648 pages',
        'Format': 'Deluxe Hardcover with Ribbon Bookmark',
        'Language': 'English',
      },
    },
    {
      title: 'LumixView 4K 144Hz IPS Gaming Monitor (28 inch UHD)',
      slug: 'lumixview-4k-144hz-gaming-monitor',
      description: 'Stunning 4K resolution with 144Hz refresh rate, 1ms GtG response time, HDMI 2.1, AMD FreeSync Premium Pro, and factory color calibrated 98% DCI-P3 color gamut.',
      price: 38999,
      compareAtPrice: 47999,
      categorySlug: 'electronics',
      brand: 'LumixView',
      rating: 4.8,
      reviewCount: 133,
      stock: 22,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Resolution': '3840 x 2160 UHD',
        'Refresh Rate': '144Hz with HDMI 2.1',
        'Color Accuracy': 'Delta E < 1, 98% DCI-P3',
      },
    },
    {
      title: 'FlexGrip Pro Ergonomic Mechanical Keyboard (Hot-swappable RGB)',
      slug: 'flexgrip-pro-ergonomic-mechanical-keyboard',
      description: 'Gasket-mounted mechanical keyboard with pre-lubed linear switches, sound-dampening silicone foam, multi-device Bluetooth/2.4G/Wired connectivity, and customizable rotary knob.',
      price: 7999,
      compareAtPrice: 10999,
      categorySlug: 'electronics',
      brand: 'FlexGrip',
      rating: 4.7,
      reviewCount: 245,
      stock: 35,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      specs: {
        'Switches': 'Gateron Pro Yellow Linear (Lubed)',
        'Battery': '4000 mAh rechargeable',
      },
    },
  ];

  for (const item of productsData) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        brand: item.brand,
        rating: item.rating,
        reviewCount: item.reviewCount,
        stock: item.stock,
        isFeatured: item.isFeatured,
        specifications: JSON.stringify(item.specs),
        categoryId,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        brand: item.brand,
        rating: item.rating,
        reviewCount: item.reviewCount,
        stock: item.stock,
        isFeatured: item.isFeatured,
        specifications: JSON.stringify(item.specs),
        categoryId,
      },
    });

    // Seed product image
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: item.imageUrl,
        altText: item.title,
        isPrimary: true,
        order: 0,
      },
    });
  }

  // 4. Seed Promotional Coupons
  const couponsData = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 999,
      maxDiscount: 1000,
      validUntil: new Date('2028-12-31'),
      usageLimit: 5000,
    },
    {
      code: 'SPHERE500',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderValue: 2499,
      validUntil: new Date('2028-12-31'),
      usageLimit: 2000,
    },
    {
      code: 'FESTIVE20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 4999,
      maxDiscount: 2500,
      validUntil: new Date('2028-12-31'),
      usageLimit: 1500,
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  console.log('Database seeded successfully with users, categories, products, and coupons!');
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
