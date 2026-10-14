import {
  User,
  Address,
  Category,
  Product,
  CartSummary,
  WishlistItem,
  Order,
  Coupon,
} from '../types';

class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Automatically passes HTTP-only cookies
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || 'Network request failed', res.status);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string; guestToken?: string }) =>
      request<{ success: boolean; user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (payload: { name: string; email: string; password: string; phone?: string; guestToken?: string }) =>
      request<{ success: boolean; user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    logout: () =>
      request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      }),
    getMe: () =>
      request<{ success: boolean; user: User }>('/auth/me'),
    updateProfile: (data: { name: string; phone?: string }) =>
      request<{ success: boolean; user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string; resetToken?: string; resetUrl?: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      ),
    resetPassword: (payload: { token: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Products & Categories
  products: {
    list: (params: Record<string, any> = {}) => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          search.append(k, String(v));
        }
      });
      return request<{
        success: boolean;
        products: Product[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/products?${search.toString()}`);
    },
    getCategories: () =>
      request<{ success: boolean; categories: Category[] }>('/products/categories'),
    getFeatured: () =>
      request<{
        success: boolean;
        featuredDeals: Product[];
        topRated: Product[];
        newArrivals: Product[];
      }>('/products/featured'),
    getSuggestions: (q: string) =>
      request<{ success: boolean; suggestions: Product[] }>(
        `/products/suggestions?q=${encodeURIComponent(q)}`
      ),
    getBySlug: (slug: string) =>
      request<{ success: boolean; product: Product }>(`/products/${slug}`),
    getRelated: (productId: string) =>
      request<{ success: boolean; related: Product[] }>(`/products/related/${productId}`),
  },

  // Cart
  cart: {
    get: (coupon?: string) => {
      const query = coupon ? `?coupon=${encodeURIComponent(coupon)}` : '';
      return request<CartSummary & { success: boolean }>(`/cart${query}`);
    },
    addItem: (productId: string, quantity = 1) =>
      request<CartSummary & { success: boolean; message: string }>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      }),
    updateQuantity: (itemId: string, quantity: number) =>
      request<CartSummary & { success: boolean }>(`/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    removeItem: (itemId: string) =>
      request<CartSummary & { success: boolean; message: string }>(`/cart/items/${itemId}`, {
        method: 'DELETE',
      }),
    clear: () =>
      request<CartSummary & { success: boolean }>('/cart', {
        method: 'DELETE',
      }),
    applyCoupon: (code: string) =>
      request<CartSummary & { success: boolean; coupon: any; message: string }>('/cart/apply-coupon', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },

  // Wishlist
  wishlist: {
    get: () =>
      request<{ success: boolean; items: WishlistItem[] }>('/wishlist'),
    toggle: (productId: string) =>
      request<{ success: boolean; inWishlist: boolean; message: string }>('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
    remove: (productId: string) =>
      request<{ success: boolean; message: string }>(`/wishlist/${productId}`, {
        method: 'DELETE',
      }),
  },

  // Addresses
  addresses: {
    list: () =>
      request<{ success: boolean; addresses: Address[] }>('/addresses'),
    create: (address: Partial<Address>) =>
      request<{ success: boolean; address: Address; message: string }>('/addresses', {
        method: 'POST',
        body: JSON.stringify(address),
      }),
    update: (id: string, address: Partial<Address>) =>
      request<{ success: boolean; address: Address; message: string }>(`/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(address),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/addresses/${id}`, {
        method: 'DELETE',
      }),
    setDefault: (id: string) =>
      request<{ success: boolean; address: Address; message: string }>(`/addresses/${id}/default`, {
        method: 'PUT',
      }),
  },

  // Checkout
  checkout: {
    createPaymentOrder: (payload: { addressId: string; shippingMethod: string; couponCode?: string }) =>
      request<{
        success: boolean;
        razorpayOrder: {
          id: string;
          amount: number;
          currency: string;
          isMock: boolean;
          keyId: string;
        };
        orderSummary: {
          subtotal: number;
          discount: number;
          shippingFee: number;
          tax: number;
          total: number;
          itemsCount: number;
        };
      }>('/checkout/create-payment-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    verifyAndPlaceOrder: (payload: {
      addressId: string;
      shippingMethod: string;
      couponCode?: string;
      paymentOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) =>
      request<{
        success: boolean;
        orderNumber: string;
        orderId: string;
        total: number;
        trackingNumber: string;
        message: string;
      }>('/checkout/verify-and-place-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    placeDirectOrder: (payload: {
      addressId: string;
      shippingMethod: string;
      couponCode?: string;
      paymentMethod: 'SIMULATED_TEST' | 'COD';
      paymentDetails?: any;
    }) =>
      request<{
        success: boolean;
        orderNumber: string;
        orderId: string;
        total: number;
        trackingNumber: string;
        message: string;
      }>('/checkout/place-direct-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Orders
  orders: {
    list: (params: { status?: string; page?: number; limit?: number } = {}) => {
      const search = new URLSearchParams();
      if (params.status) search.append('status', params.status);
      if (params.page) search.append('page', String(params.page));
      if (params.limit) search.append('limit', String(params.limit));
      return request<{
        success: boolean;
        orders: Order[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/orders?${search.toString()}`);
    },
    getByNumber: (orderNumber: string) =>
      request<{ success: boolean; order: Order }>(`/orders/${orderNumber}`),
    cancel: (orderNumber: string, reason?: string) =>
      request<{ success: boolean; message: string }>(`/orders/${orderNumber}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Admin
  admin: {
    getDashboard: () =>
      request<{
        success: boolean;
        metrics: {
          totalRevenue: number;
          totalOrders: number;
          totalCustomers: number;
          totalProducts: number;
          lowStockCount: number;
        };
        lowStockProducts: any[];
        recentOrders: any[];
      }>('/admin/dashboard'),
    getProducts: (params: Record<string, any> = {}) => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) search.append(k, String(v));
      });
      return request<{
        success: boolean;
        products: Product[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/admin/products?${search.toString()}`);
    },
    createProduct: (payload: any) =>
      request<{ success: boolean; product: Product; message: string }>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateProduct: (id: string, payload: any) =>
      request<{ success: boolean; product: Product; message: string }>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    archiveProduct: (id: string) =>
      request<{ success: boolean; message: string }>(`/admin/products/${id}`, {
        method: 'DELETE',
      }),
    getOrders: (params: Record<string, any> = {}) => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) search.append(k, String(v));
      });
      return request<{
        success: boolean;
        orders: Order[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/admin/orders?${search.toString()}`);
    },
    updateOrderStatus: (orderId: string, payload: { status: string; trackingNote?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    getCustomers: () =>
      request<{ success: boolean; customers: any[] }>('/admin/customers'),
    getCoupons: () =>
      request<{ success: boolean; coupons: Coupon[] }>('/admin/coupons'),
    createCoupon: (payload: any) =>
      request<{ success: boolean; coupon: Coupon; message: string }>('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
};
