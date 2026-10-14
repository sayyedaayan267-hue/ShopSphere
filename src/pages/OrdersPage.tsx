import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface OrdersPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { error, success } = useNotification();

  const fetchOrders = async (status: string) => {
    try {
      setLoading(true);
      const res = await api.orders.list({
        status: status === 'ALL' ? undefined : status,
      });
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const handleCancelOrder = async (orderNumber: string) => {
    const confirm = window.confirm(
      `Are you sure you want to cancel Order ${orderNumber}? Inventory will be restored and any payment refunded.`
    );
    if (!confirm) return;

    try {
      const res = await api.orders.cancel(orderNumber, 'Cancelled by user request');
      if (res.success) {
        success(res.message);
        fetchOrders(statusFilter);
      }
    } catch (err: any) {
      error(err.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1200px] mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track packages, review item history, and download invoices.
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
            {['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Orders' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't placed any orders matching this status filter yet.
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-5 py-2 rounded-full text-xs shadow-xs"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const isCancellable = ['PENDING', 'PAID', 'PROCESSING'].includes(order.status);
              const shipment = order.shipments?.[0];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Order Top Ribbon */}
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Order Placed
                        </span>
                        <span className="font-medium text-slate-800">{dateStr}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Total
                        </span>
                        <span className="font-bold text-slate-900">
                          ₹{order.total.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Ship To
                        </span>
                        <span className="font-medium text-slate-800">
                          {order.shippingMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Order # {order.orderNumber}
                        </span>
                        <button
                          onClick={() => onNavigate('order-detail', order.orderNumber)}
                          className="text-sky-700 hover:text-amber-700 font-semibold hover:underline"
                        >
                          View order details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6 flex flex-col md:flex-row items-start justify-between gap-6">
                    {/* Status & items */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'DELIVERED' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Delivered</span>
                          </div>
                        )}
                        {order.status === 'CANCELLED' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Cancelled (Refund Processed)</span>
                          </div>
                        )}
                        {['PAID', 'PROCESSING'].includes(order.status) && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Processing - Preparing for dispatch</span>
                          </div>
                        )}
                        {order.status === 'SHIPPED' && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700">
                            <Truck className="w-4 h-4 text-sky-600" />
                            <span>Out for Delivery</span>
                          </div>
                        )}
                        {shipment?.trackingNumber && (
                          <span className="text-xs text-slate-400">
                            (Tracking: {shipment.trackingNumber})
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 text-xs">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.historicalTitle}
                                className="w-14 h-14 object-contain rounded border border-slate-100 p-1 shrink-0 bg-slate-50"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-slate-100 rounded flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 line-clamp-1">
                                {item.historicalTitle}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Quantity: {item.quantity} | Historical Purchase Price: ₹
                                {item.historicalPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full md:w-56 shrink-0 space-y-2 text-xs">
                      <button
                        onClick={() => onNavigate('order-detail', order.orderNumber)}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-full transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track package</span>
                      </button>

                      <button
                        onClick={() => onNavigate('search')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 rounded-full transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Buy it again</span>
                      </button>

                      {isCancellable && (
                        <button
                          onClick={() => handleCancelOrder(order.orderNumber)}
                          className="w-full border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold py-2 rounded-full transition-colors text-center cursor-pointer"
                        >
                          Cancel order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
