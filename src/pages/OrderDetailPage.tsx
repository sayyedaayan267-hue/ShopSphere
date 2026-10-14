import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Printer,
  XCircle,
} from 'lucide-react';
import { Order, ShipmentUpdate } from '../types';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface OrderDetailPageProps {
  orderNumber: string;
  onNavigate: (page: string, param?: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderNumber,
  onNavigate,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, success } = useNotification();

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.orders.getByNumber(orderNumber);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const handleCancel = async () => {
    const confirm = window.confirm(
      'Are you sure you want to cancel this order? Any payment will be refunded.'
    );
    if (!confirm) return;

    try {
      const res = await api.orders.cancel(orderNumber);
      if (res.success) {
        success(res.message);
        fetchOrder();
      }
    } catch (err: any) {
      error(err.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eaeded] py-8 text-center text-xs text-slate-500">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#eaeded] py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <button
          onClick={() => onNavigate('orders')}
          className="bg-amber-400 font-bold px-4 py-2 rounded-full text-xs shadow-xs"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const shipment = order.shipments?.[0];
  let trackingHistory: ShipmentUpdate[] = [];
  if (shipment?.updates) {
    try {
      trackingHistory = JSON.parse(shipment.updates);
    } catch {}
  }

  const isCancellable = ['PENDING', 'PAID', 'PROCESSING'].includes(order.status);

  // Status step progression
  const STEPS = ['ORDER_PLACED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
  let activeStepIndex = 1;
  if (order.status === 'SHIPPED') activeStepIndex = 2;
  if (order.status === 'DELIVERED') activeStepIndex = 3;
  if (order.status === 'CANCELLED') activeStepIndex = -1;

  const address = order.shippingAddress;

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1100px] mx-auto px-4 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-amber-700 hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border rounded px-3 py-1.5 bg-white shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Visual Delivery Status Tracker */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Order Reference
              </span>
              <h1 className="text-xl font-black text-slate-900">{order.orderNumber}</h1>
            </div>
            {shipment && (
              <div className="text-xs text-slate-600 sm:text-right">
                <p>Carrier: <span className="font-semibold text-slate-900">{shipment.carrier}</span></p>
                <p>Tracking Number: <span className="font-mono font-bold text-amber-800">{shipment.trackingNumber}</span></p>
              </div>
            )}
          </div>

          {/* Stepper */}
          {order.status === 'CANCELLED' ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-800 text-xs">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Order Cancelled</p>
                <p className="text-rose-600 mt-0.5">
                  This order was cancelled and inventory has been restored. If payment was captured, the refund was initiated.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs relative">
                {/* Connecting bar */}
                <div className="absolute top-4 left-1/8 right-1/8 h-1 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(activeStepIndex / 3) * 100}%` }}
                  />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800">Ordered</span>
                  <span className="text-[10px] text-slate-400">Confirmed</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 ${
                      activeStepIndex >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800">Preparing</span>
                  <span className="text-[10px] text-slate-400">Packed</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 ${
                      activeStepIndex >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-800">Dispatched</span>
                  <span className="text-[10px] text-slate-400">In Transit</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 ${
                      activeStepIndex >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-800">Delivered</span>
                  <span className="text-[10px] text-slate-400">Arrived</span>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Tracking History Log */}
          {trackingHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Tracking Activity Updates
              </h3>
              <div className="space-y-3 text-xs">
                {trackingHistory.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{item.message}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.location} • {new Date(item.time).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Invoice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shipping Address */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-xs space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b">
              Delivery Address
            </h3>
            {address ? (
              <div className="leading-relaxed text-slate-700">
                <p className="font-bold text-slate-900">{address.fullName}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} - {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p className="text-slate-500 mt-2">Phone: {address.phone}</p>
              </div>
            ) : (
              <p className="text-slate-500">Address recorded on purchase.</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-xs space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b">
              Payment Information
            </h3>
            <div className="space-y-2 text-slate-700">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Razorpay Online Payment</span>
              </p>
              <p className="text-slate-500">
                Payment Status: <span className="font-bold text-slate-800">{order.status}</span>
              </p>
              {order.payments?.[0] && (
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>Transaction: {order.payments[0].transactionId}</p>
                  <p>Amount: ₹{order.payments[0].amount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-xs space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b">
              Order Summary
            </h3>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-₹{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee:</span>
                <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18% included):</span>
                <span>₹{order.tax.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-rose-700">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Purchased Products
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.historicalTitle}
                      className="w-16 h-16 object-contain rounded border p-1 bg-slate-50 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 max-w-lg">{item.historicalTitle}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Historical Purchase Price: ₹{item.historicalPrice.toLocaleString()} ×{' '}
                      {item.quantity} units
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  ₹{item.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {isCancellable && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleCancel}
                className="border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold px-4 py-2 rounded-full text-xs transition-colors cursor-pointer"
              >
                Cancel this Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
