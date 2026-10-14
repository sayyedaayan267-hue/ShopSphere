import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';

interface OrderConfirmationPageProps {
  orderNumber: string;
  onNavigate: (page: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderNumber,
  onNavigate,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.orders.getByNumber(orderNumber);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        console.error('Failed to load order confirmation:', err);
      } finally {
        setLoading(false);
      }
    }
    if (orderNumber) load();
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-[#eaeded] py-8">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4 pb-6 border-b border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Order Placed Successfully
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                Thank you for your order!
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                We've sent an order confirmation and receipt to your registered email address.
              </p>
            </div>
          </div>

          {/* Order Meta details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Order Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{orderNumber}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Estimated Delivery</span>
              <span className="font-bold text-emerald-700">In 3 Business Days</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-100 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block mb-0.5">Payment Status</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirmed (PAID)</span>
              </span>
            </div>
          </div>

          {/* Items summary */}
          {order && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Items Ordered ({order.items.length})
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.historicalTitle}
                          className="w-12 h-12 object-contain bg-slate-50 rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 max-w-md line-clamp-1">
                          {item.historicalTitle}
                        </p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-bold text-sm">
                <span>Grand Total Paid:</span>
                <span className="text-rose-700 text-lg">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onNavigate('order-detail', orderNumber)}
              className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-full text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Track Your Package</span>
            </button>
            <button
              onClick={() => onNavigate('orders')}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-5 py-2.5 rounded-full text-xs transition-colors"
            >
              View Order History
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto text-sky-700 hover:underline text-xs font-semibold py-2.5"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
