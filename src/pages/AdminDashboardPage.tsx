import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Truck,
  CheckCircle2,
  Tag,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Product, Category, Order, Coupon } from '../types';

interface AdminDashboardPageProps {
  categories: Category[];
  onNavigate: (page: string, param?: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  categories,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'inventory' | 'coupons'>('overview');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, success } = useNotification();

  // Products Tab State
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    compareAtPrice: '',
    categoryId: categories[0]?.id || '',
    brand: '',
    stock: '50',
    imageUrl: '',
    isFeatured: false,
    specifications: '',
  });

  // Orders Tab State
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('SHIPPED');
  const [trackingNote, setTrackingNote] = useState('');

  // Coupons Tab State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderValue, setMinOrderValue] = useState('999');

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getDashboard();
      if (res.success) {
        setMetrics(res.metrics);
        setLowStockProducts(res.lowStockProducts || []);
        setRecentOrders(res.recentOrders || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  // Load Products
  const loadProducts = async () => {
    try {
      const res = await api.admin.getProducts({ limit: 50 });
      if (res.success) {
        setAdminProducts(res.products || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load products');
    }
  };

  // Load Orders
  const loadOrders = async () => {
    try {
      const res = await api.admin.getOrders({
        status: orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
        limit: 50,
      });
      if (res.success) {
        setAdminOrders(res.orders || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load orders');
    }
  };

  // Load Coupons
  const loadCoupons = async () => {
    try {
      const res = await api.admin.getCoupons();
      if (res.success) {
        setCoupons(res.coupons || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load coupons');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'inventory') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'coupons') loadCoupons();
  }, [activeTab, orderStatusFilter]);

  // Product CRUD
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      price: '',
      compareAtPrice: '',
      categoryId: categories[0]?.id || '',
      brand: '',
      stock: '50',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      isFeatured: false,
      specifications: '{"Warranty": "1 Year", "Color": "Matte Black"}',
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      title: p.title,
      description: p.description,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      categoryId: p.categoryId,
      brand: p.brand,
      stock: String(p.stock),
      imageUrl: p.images?.[0]?.url || '',
      isFeatured: p.isFeatured,
      specifications: p.specifications || '{}',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedSpecs = {};
      try {
        parsedSpecs = JSON.parse(productForm.specifications || '{}');
      } catch {}

      if (editingProduct) {
        const res = await api.admin.updateProduct(editingProduct.id, {
          title: productForm.title,
          description: productForm.description,
          price: parseFloat(productForm.price),
          compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
          categoryId: productForm.categoryId,
          brand: productForm.brand,
          stock: parseInt(productForm.stock, 10),
          isFeatured: productForm.isFeatured,
          imageUrl: productForm.imageUrl,
        });
        if (res.success) {
          success('Product updated');
          setProductModalOpen(false);
          loadProducts();
          loadDashboard();
        }
      } else {
        const res = await api.admin.createProduct({
          title: productForm.title,
          description: productForm.description,
          price: parseFloat(productForm.price),
          compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
          categoryId: productForm.categoryId,
          brand: productForm.brand,
          stock: parseInt(productForm.stock, 10),
          isFeatured: productForm.isFeatured,
          imageUrl: productForm.imageUrl,
          specifications: parsedSpecs,
        });
        if (res.success) {
          success('Product created');
          setProductModalOpen(false);
          loadProducts();
          loadDashboard();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save product');
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!window.confirm('Archive this product? It will no longer appear in search results.')) return;
    try {
      const res = await api.admin.archiveProduct(id);
      if (res.success) {
        success('Product archived');
        loadProducts();
      }
    } catch (err: any) {
      error(err.message || 'Failed to archive product');
    }
  };

  // Quick Restock in Inventory Tab
  const handleRestock = async (productId: string, currentStock: number) => {
    const addQty = prompt('Enter units to add to inventory:', '25');
    if (!addQty || isNaN(parseInt(addQty, 10))) return;

    const newStock = currentStock + parseInt(addQty, 10);
    try {
      const res = await api.admin.updateProduct(productId, { stock: newStock });
      if (res.success) {
        success(`Stock updated to ${newStock} units`);
        loadProducts();
        loadDashboard();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update stock');
    }
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId: string) => {
    try {
      const res = await api.admin.updateOrderStatus(orderId, {
        status: newStatus,
        trackingNote: trackingNote || `Status updated to ${newStatus} by admin`,
      });
      if (res.success) {
        success('Order status updated');
        setUpdatingOrderId(null);
        setTrackingNote('');
        loadOrders();
        loadDashboard();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update order status');
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      const res = await api.admin.createCoupon({
        code: couponCode.trim().toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: parseFloat(minOrderValue),
      });
      if (res.success) {
        success('Coupon created successfully');
        setCouponCode('');
        loadCoupons();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create coupon');
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1440px] mx-auto px-4 space-y-6">
        {/* Header bar */}
        <div className="bg-[#131921] text-white p-5 rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-400 flex items-center justify-center text-slate-900">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">ShopSphere Admin Operations Portal</h1>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/40 uppercase">
                  Staff Console
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage product catalog, real-time inventory, order fulfillment, and promotions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadDashboard();
                if (activeTab === 'products') loadProducts();
                if (activeTab === 'orders') loadOrders();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-3.5 py-2 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer"
            >
              Back to Storefront
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-300 text-xs font-bold overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'products', label: 'Catalog & Products' },
            { id: 'orders', label: 'Orders & Fulfillment' },
            { id: 'inventory', label: 'Inventory & Stock' },
            { id: 'coupons', label: 'Discount Coupons' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-t-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white border-t-2 border-amber-500 text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Gross Revenue
                </span>
                <div className="text-2xl font-black text-slate-900">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Real-time database sum
                </span>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Orders
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics.totalOrders}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Paid & processing</span>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Customers
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics.totalCustomers}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Registered buyers</span>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Products
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics.totalProducts}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Catalog items</span>
              </div>

              <div className="bg-white p-5 rounded-lg border border-amber-300 bg-amber-50/30 shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Low Stock Alerts
                </span>
                <div className="text-2xl font-black text-amber-700">
                  {metrics.lowStockCount}
                </div>
                <span className="text-[10px] text-amber-800 font-semibold mt-1 block">
                  Items with ≤ 10 units
                </span>
              </div>
            </div>

            {/* Low stock alerts + Recent orders grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low stock items */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Low Stock Inventory Alerts</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-sky-700 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">All product stocks healthy.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {lowStockProducts.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-slate-500">₹{p.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs">
                            {p.stock} left
                          </span>
                          <button
                            onClick={() => handleRestock(p.id, p.stock)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] font-semibold"
                          >
                            Restock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span>Recent Customer Orders</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-sky-700 hover:underline"
                  >
                    Manage Orders
                  </button>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No orders recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {recentOrders.map((ord) => (
                      <div key={ord.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{ord.orderNumber}</p>
                          <p className="text-[11px] text-slate-500">
                            {ord.user?.name || 'Customer'} • {ord.items?.length || 1} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₹{ord.total.toLocaleString()}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h2 className="text-base font-bold text-slate-900">Product Catalog Management</h2>
                <p className="text-xs text-slate-500">Add new products, adjust pricing, and toggle active status.</p>
              </div>
              <button
                onClick={handleOpenCreateProduct}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Featured</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                            alt={p.title}
                            className="w-10 h-10 object-contain rounded border p-0.5 bg-slate-50 shrink-0"
                          />
                          <span className="font-semibold text-slate-900 line-clamp-1 max-w-xs">{p.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.brand}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{p.price.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${p.stock <= 10 ? 'text-amber-700' : 'text-slate-700'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.isFeatured ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {p.isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="text-sky-700 hover:text-amber-700 font-semibold p-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleArchiveProduct(p.id)}
                          className="text-rose-600 hover:text-rose-800 font-semibold p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-baseline justify-between gap-3 pb-3 border-b">
              <div>
                <h2 className="text-base font-bold text-slate-900">Customer Orders Fulfillment</h2>
                <p className="text-xs text-slate-500">Track shipments, dispatch packages, and update delivery states.</p>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      orderStatusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-3">Order Number</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Carrier / Tracking</th>
                    <th className="py-3 px-3 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminOrders.map((ord) => {
                    const shipment = ord.shipments?.[0];
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900">{ord.user?.name || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400">{ord.user?.email}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          ₹{ord.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                              ord.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : ord.status === 'SHIPPED'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {shipment ? (
                            <div>
                              <p className="font-semibold text-[11px]">{shipment.carrier}</p>
                              <p className="font-mono text-[10px] text-slate-400">{shipment.trackingNumber}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setUpdatingOrderId(ord.id);
                              setNewStatus(ord.status === 'PAID' ? 'PROCESSING' : ord.status === 'PROCESSING' ? 'SHIPPED' : 'DELIVERED');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded text-xs"
                          >
                            Change Status
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h2 className="text-base font-bold text-slate-900">Real-Time Inventory Overview</h2>
                <p className="text-xs text-slate-500">Monitor stock levels and add inventory directly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminProducts.map((p) => (
                <div key={p.id} className="p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                  <div className="space-y-1 max-w-[200px]">
                    <h4 className="font-bold text-slate-900 line-clamp-1">{p.title}</h4>
                    <p className="text-slate-500">Brand: {p.brand}</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${p.stock <= 10 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {p.stock} in stock
                      </span>
                      {p.stock <= 10 && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestock(p.id, p.stock)}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded text-xs shadow-xs"
                  >
                    + Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Coupon Form */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b">
                Create Promotional Voucher
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE30"
                    className="w-full px-3 py-2 border rounded border-slate-300 font-mono uppercase focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded border-slate-300 bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded text-xs shadow-xs"
                >
                  Create Coupon
                </button>
              </form>
            </div>

            {/* Existing Coupons Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b">
                Active Promotional Codes
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Min Order</th>
                      <th className="py-2.5 px-3">Times Used</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-800">{c.code}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                        </td>
                        <td className="py-2.5 px-3">₹{c.minOrderValue.toLocaleString()}</td>
                        <td className="py-2.5 px-3">{c.timesUsed}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Create/Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b">
              {editingProduct ? 'Edit Product' : 'Add New Product to Catalog'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">M.R.P. Compare Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span className="font-semibold text-slate-700">Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Image URL</label>
                <input
                  type="url"
                  required
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specifications (JSON string)</label>
                <input
                  type="text"
                  value={productForm.specifications}
                  onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  placeholder='{"Key": "Value"}'
                  className="w-full px-3 py-2 border rounded border-slate-300 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Status Change Modal */}
      {updatingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b">
              Update Order Fulfillment Status
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded border-slate-300 bg-white"
                >
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING (Packing at hub)</option>
                  <option value="SHIPPED">SHIPPED (Out for delivery)</option>
                  <option value="DELIVERED">DELIVERED (Completed)</option>
                  <option value="CANCELLED">CANCELLED (Refund issued)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tracking Activity Message</label>
                <input
                  type="text"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  placeholder="e.g. Package dispatched from Bengaluru Fulfillment Hub"
                  className="w-full px-3 py-2 border rounded border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setUpdatingOrderId(null)}
                  className="px-4 py-2 border rounded text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(updatingOrderId)}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
