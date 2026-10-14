import React, { useState } from 'react';
import {
  Trash2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CartPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, loading } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplying(true);
    await applyCoupon(couponCode.trim());
    setApplying(false);
  };

  const freeShippingThreshold = 500;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);
  const qualifiesForFreeShipping = remainingForFreeShipping === 0 && cart.subtotal > 0;

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Free delivery banner */}
        {cart.itemsCount > 0 && (
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${
                  qualifiesForFreeShipping ? 'text-emerald-600' : 'text-amber-500'
                }`}
              />
              {qualifiesForFreeShipping ? (
                <span className="text-emerald-700 font-bold">
                  Part of your order qualifies for FREE Delivery.
                </span>
              ) : (
                <span className="text-slate-700">
                  Add{' '}
                  <span className="font-bold text-amber-700">
                    ₹{remainingForFreeShipping.toLocaleString()}
                  </span>{' '}
                  of eligible items to qualify for FREE Delivery.
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-sky-700 hover:text-amber-700 font-semibold hover:underline hidden sm:inline"
            >
              Continue shopping
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Cart Items Area (Col 1-8) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-baseline justify-between pb-3 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
              <span className="text-xs text-slate-500">Price</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading your cart...</div>
            ) : cart.items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Your ShopSphere Cart is empty</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Explore millions of products across electronics, fashion, audio and home essentials.
                </p>
                <button
                  onClick={() => onNavigate('search')}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2.5 rounded-full text-xs shadow-xs"
                >
                  Shop today's deals
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => {
                  const image =
                    item.product?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                  return (
                    <div key={item.id} className="py-5 flex flex-col sm:flex-row gap-4 items-start">
                      {/* Item Image */}
                      <button
                        onClick={() => onNavigate('product', item.product.slug)}
                        className="w-24 h-24 rounded border border-slate-200 p-2 shrink-0 bg-slate-50 flex items-center justify-center cursor-pointer"
                      >
                        <img
                          src={image}
                          alt={item.product.title}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <button
                          onClick={() => onNavigate('product', item.product.slug)}
                          className="text-sm font-semibold text-slate-900 hover:text-amber-700 text-left line-clamp-2 cursor-pointer"
                        >
                          {item.product.title}
                        </button>
                        <p className="text-[11px] text-slate-500">Brand: {item.product.brand}</p>
                        <p className="text-[11px] text-emerald-700 font-semibold">In stock</p>
                        <p className="text-[11px] text-slate-400">Eligible for FREE Shipping</p>

                        {/* Controls: Quantity + Remove */}
                        <div className="pt-2 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 bg-slate-100 rounded px-2 py-1 border border-slate-200">
                            <span className="text-slate-500 text-[11px]">Qty:</span>
                            <select
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value, 10))
                              }
                              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                              {Array.from(
                                { length: Math.min(item.product.stock, 10) },
                                (_, i) => i + 1
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-slate-300">|</span>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-sky-700 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Price per item */}
                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-slate-900">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-slate-400">
                            (₹{item.product.price.toLocaleString()} each)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
                  <button
                    onClick={clearCart}
                    className="hover:text-rose-600 text-slate-500 underline"
                  >
                    Clear entire cart
                  </button>
                  <p className="text-sm font-semibold text-slate-800">
                    Subtotal ({cart.itemsCount} {cart.itemsCount === 1 ? 'item' : 'items'}):{' '}
                    <span className="font-extrabold text-base text-slate-900">
                      ₹{cart.subtotal.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Order Summary & Checkout Box (Col 9-12) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Order Summary
              </h2>

              {/* Breakdown */}
              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{cart.subtotal.toLocaleString()}
                  </span>
                </div>

                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount:</span>
                    <span>-₹{cart.discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold text-slate-800">
                    {cart.shippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase">FREE</span>
                    ) : (
                      `₹${cart.shippingFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated GST (18% included):</span>
                  <span>₹{cart.tax.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Order Total:</span>
                  <span className="text-xl font-black text-rose-700">
                    ₹{cart.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Have a Promo Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 px-3 py-1.5 border rounded border-slate-300 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={applying}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
                {cart.appliedCoupon && (
                  <div className="mt-1.5 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon "{cart.appliedCoupon.code}" applied!</span>
                  </div>
                )}
                <div className="mt-2 text-[10px] text-slate-400">
                  Try <span className="font-mono text-slate-600">WELCOME10</span> (10% off) or{' '}
                  <span className="font-mono text-slate-600">SPHERE500</span> (₹500 off)
                </div>
              </form>

              {/* Proceed to checkout button */}
              <button
                disabled={cart.itemsCount === 0}
                onClick={() => {
                  if (!user) {
                    onNavigate('login');
                  } else {
                    onNavigate('checkout');
                  }
                }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-3 px-4 rounded-full text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-bit Secure Razorpay Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
