export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
  addresses?: Address[];
  _count?: {
    orders: number;
    wishlistItems: number;
  };
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  _count?: {
    products: number;
  };
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  categoryId: string;
  category?: Category;
  brand: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  specifications?: string | null; // JSON string
  images: ProductImage[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
  itemTotal: number;
  inStock: boolean;
}

export interface CartSummary {
  cartId: string;
  items: CartItem[];
  itemsCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  } | null;
  shippingFee: number;
  tax: number;
  total: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  historicalTitle: string;
  historicalPrice: number;
  historicalSku?: string | null;
  quantity: number;
  total: number;
  image?: string | null;
}

export interface ShipmentUpdate {
  time: string;
  status: string;
  message: string;
  location: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  estimatedDelivery?: string | null;
  currentCity: string;
  updates: string; // JSON string
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  paymentOrderId?: string | null;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  };
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  addressId?: string | null;
  shippingAddressSnapshot: string;
  shippingAddress?: Address;
  shippingMethod: string;
  createdAt: string;
  items: OrderItem[];
  payments?: Payment[];
  shipments?: Shipment[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
}
