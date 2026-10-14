import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Plus,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Address } from '../types';
import { api } from '../services/api';

interface CheckoutPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const { error, success } = useNotification();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<'Standard Delivery' | 'Express Delivery'>(
    'Standard Delivery'
  );
  const [loading, setLoading] = useState(false);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);

  // New address form state
  const [newAddr, setNewAddr] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    isDefault: true,
  });

  // Load saved addresses
  useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await api.addresses.list();
        if (res.success) {
          setAddresses(res.addresses || []);
          const def = res.addresses.find((a) => a.isDefault) || res.addresses[0];
          if (def) setSelectedAddressId(def.id);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      }
    }
    loadAddresses();
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.phone || !newAddr.addressLine1 || !newAddr.city || !newAddr.postalCode) {
      error('Please fill in all mandatory address fields');
      return;
    }
    try {
      const res = await api.addresses.create(newAddr);
      if (res.success) {
        setAddresses((prev) => [res.address, ...prev]);
        setSelectedAddressId(res.address.id);
        setShowNewAddressModal(false);
        success('Delivery address added');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save address');
    }
  };

  // Payment processing state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Payment method selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'SIMULATED_TEST' | 'COD' | 'RAZORPAY'
  >('SIMULATED_TEST');
  const [testSubtype, setTestSubtype] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [testUpiId, setTestUpiId] = useState('shopper@okaxis');
  const [testBank, setTestBank] = useState('HDFC Bank');

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      error('Please select or add a delivery address');
      return;
    }

    if (selectedPaymentMethod === 'RAZORPAY') {
      try {
        setLoading(true);
        const res = await api.checkout.createPaymentOrder({
          addressId: selectedAddressId,
          shippingMethod,
          couponCode: cart.appliedCoupon?.code,
        });

        if (res.success) {
          setRazorpayOrderData(res);
          setPaymentModalOpen(true);
        }
      } catch (err: any) {
        error(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Direct Simulated Test or Cash on Delivery (Zero credentials required!)
    try {
      setLoading(true);
      const res = await api.checkout.placeDirectOrder({
        addressId: selectedAddressId,
        shippingMethod,
        couponCode: cart.appliedCoupon?.code,
        paymentMethod: selectedPaymentMethod,
        paymentDetails: {
          type: testSubtype,
          upiId: testSubtype === 'UPI' ? testUpiId : undefined,
          bankName: testSubtype === 'NETBANKING' ? testBank : undefined,
          cardLast4: testSubtype === 'CARD' ? '4242' : undefined,
        },
      });

      if (res.success) {
        await refreshCart();
        success(res.message || 'Order placed successfully!');
        onNavigate('order-confirmation', res.orderNumber);
      }
    } catch (err: any) {
      error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Razorpay payment completion for testing/development
  const handleConfirmPayment = async () => {
    if (!razorpayOrderData) return;

    try {
      setProcessingPayment(true);
      const mockPayId = `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const res = await api.checkout.verifyAndPlaceOrder({
        addressId: selectedAddressId,
        shippingMethod,
        couponCode: cart.appliedCoupon?.code,
        paymentOrderId: razorpayOrderData.razorpayOrder.id,
        razorpayPaymentId: mockPayId,
        razorpaySignature: 'mock_sig_verified_for_test',
      });

      if (res.success) {
        setPaymentModalOpen(false);
        await refreshCart();
        success('Payment successful! Your order has been placed.');
        onNavigate('order-confirmation', res.orderNumber);
      }
    } catch (err: any) {
      error(err.message || 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const shippingCharge =
    shippingMethod === 'Express Delivery' ? 99 : cart.subtotal >= 500 ? 0 : 49;
  const grandTotal = Math.max(0, cart.subtotal - cart.discount) + shippingCharge;

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Checkout Header */}
        <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-slate-900">
              <Sparkles className="w-4 h-4 fill-slate-900" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Shop<span className="text-amber-500">Sphere</span> Secure Checkout
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit TLS Encryption</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Checkout Steps (Col 1-8) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Select a Delivery Address
                  </h2>
                </div>
                {selectedAddress && (
                  <span className="text-xs text-slate-500">
                    Delivering to {selectedAddress.fullName}
                  </span>
                )}
              </div>

              <div className="p-6 space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 mb-3">No saved addresses found.</p>
                    <button
                      onClick={() => setShowNewAddressModal(true)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-4 py-2 rounded text-xs transition-colors"
                    >
                      Add a New Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery_address"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-amber-500 focus:ring-amber-400 cursor-pointer"
                          />
                          <div className="flex-1 leading-relaxed">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {addr.fullName}
                              </span>
                              {addr.isDefault && (
                                <span className="bg-slate-200 text-slate-700 font-bold text-[10px] px-1.5 py-0.2 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            <p className="text-slate-600">
                              {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                            </p>
                            <p className="text-slate-500 text-[11px] mt-1">Phone: {addr.phone}</p>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => setShowNewAddressModal(true)}
                      className="mt-2 text-xs font-semibold text-sky-700 hover:text-amber-700 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add a new address</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Shipping Method */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Choose Delivery Speed
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <label
                  onClick={() => setShippingMethod('Standard Delivery')}
                  className={`p-4 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    shippingMethod === 'Standard Delivery'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_speed"
                    checked={shippingMethod === 'Standard Delivery'}
                    onChange={() => setShippingMethod('Standard Delivery')}
                    className="mt-1 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Standard Delivery</span>
                      <span className="text-emerald-700">
                        {cart.subtotal >= 500 ? 'FREE' : '₹49'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Estimated Delivery within 3-4 business days.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setShippingMethod('Express Delivery')}
                  className={`p-4 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    shippingMethod === 'Express Delivery'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_speed"
                    checked={shippingMethod === 'Express Delivery'}
                    onChange={() => setShippingMethod('Express Delivery')}
                    className="mt-1 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <span>Sphere+ Express Delivery</span>
                        <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                          Fastest
                        </span>
                      </span>
                      <span className="text-slate-800 font-bold">₹99</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Guaranteed Next-Day Delivery by 11:00 AM.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Select Payment Method
                  </h2>
                </div>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zero Setup Required</span>
                </span>
              </div>

              <div className="p-6 space-y-4">
                {/* Method 1: Instant Simulated Test Payment (Default) */}
                <div
                  onClick={() => setSelectedPaymentMethod('SIMULATED_TEST')}
                  className={`p-4 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedPaymentMethod === 'SIMULATED_TEST'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={selectedPaymentMethod === 'SIMULATED_TEST'}
                      onChange={() => setSelectedPaymentMethod('SIMULATED_TEST')}
                      className="mt-1 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>Simulated Instant Test Payment (Recommended)</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            Sandbox Ready
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        No Razorpay account, API keys, or domain required! Test the full shopping, inventory deduction, and order tracking workflow with 1-click verified simulation.
                      </p>

                      {/* Sub-options for simulation */}
                      {selectedPaymentMethod === 'SIMULATED_TEST' && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestSubtype('UPI');
                            }}
                            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-colors ${
                              testSubtype === 'UPI'
                                ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            UPI (GPay / PhonePe / Paytm)
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestSubtype('CARD');
                            }}
                            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-colors ${
                              testSubtype === 'CARD'
                                ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            Card (Visa •••• 4242)
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTestSubtype('NETBANKING');
                            }}
                            className={`px-3 py-1.5 rounded border text-xs font-semibold transition-colors ${
                              testSubtype === 'NETBANKING'
                                ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            NetBanking (HDFC / ICICI)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Method 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => setSelectedPaymentMethod('COD')}
                  className={`p-4 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedPaymentMethod === 'COD'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={selectedPaymentMethod === 'COD'}
                      onChange={() => setSelectedPaymentMethod('COD')}
                      className="mt-1 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 text-sm">
                        Cash on Delivery (Pay on Arrival)
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Pay in cash or scan the courier delivery agent's UPI QR code upon doorstep delivery.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Method 3: Razorpay Payment Gateway (Optional) */}
                <div
                  onClick={() => setSelectedPaymentMethod('RAZORPAY')}
                  className={`p-4 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedPaymentMethod === 'RAZORPAY'
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={selectedPaymentMethod === 'RAZORPAY'}
                      onChange={() => setSelectedPaymentMethod('RAZORPAY')}
                      className="mt-1 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Razorpay Payment Gateway</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Requires Razorpay Key in .env)
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Connect real or test Razorpay merchant credentials with HMAC-SHA256 signature verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Order Summary & Confirm (Col 9-12) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <button
                disabled={loading || !selectedAddressId}
                onClick={handlePlaceOrder}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold py-3 px-4 rounded-full text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Processing Order...'
                    : selectedPaymentMethod === 'COD'
                    ? 'Place Order (Cash on Delivery)'
                    : selectedPaymentMethod === 'SIMULATED_TEST'
                    ? 'Place Order (Instant Sandbox Payment)'
                    : 'Proceed to Razorpay Checkout'}
                </span>
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                By placing your order, you agree to ShopSphere's conditions of use and privacy notice.
              </p>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-2 text-slate-600">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Order Summary
                </h3>
                <div className="flex justify-between">
                  <span>Items ({cart.itemsCount}):</span>
                  <span>₹{cart.subtotal.toLocaleString()}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{cart.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping & handling:</span>
                  <span>
                    {shippingCharge === 0 ? (
                      <span className="text-emerald-700 font-semibold">FREE</span>
                    ) : (
                      `₹${shippingCharge}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total before tax:</span>
                  <span>₹{Math.max(0, cart.subtotal - cart.discount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (GST 18%):</span>
                  <span>₹{cart.tax.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-base">
                  <span>Order Total:</span>
                  <span className="text-rose-700 text-xl font-black">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b">
              Add a new delivery address
            </h3>
            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAddr.fullName}
                  onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Flat, House no., Building, Street</label>
                <input
                  type="text"
                  required
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded shadow-xs"
                >
                  Use this address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Payment Modal (Dev Mode / Test Simulation) */}
      {paymentModalOpen && razorpayOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#131921] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center text-slate-900 font-black">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-sm">Razorpay Payment Gateway</h3>
                  <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                    {razorpayOrderData.razorpayOrder.isMock ? 'Development Test Mode' : 'Live Test Mode'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                Order: {razorpayOrderData.razorpayOrder.id.slice(0, 14)}...
              </span>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-slate-500">Payable Amount:</p>
                  <p className="text-2xl font-black text-slate-900">
                    ₹{(razorpayOrderData.razorpayOrder.amount / 100).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p>Merchant: ShopSphere</p>
                  <p>Currency: INR</p>
                </div>
              </div>

              {razorpayOrderData.razorpayOrder.isMock && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Development Test Mode: </span>
                    <span>
                      Razorpay credentials are in test mode. Click below to simulate a successful 256-bit signed payment callback.
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={handleConfirmPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {processingPayment
                      ? 'Verifying Signature on Server...'
                      : 'Simulate Successful Payment (Test Mode)'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => setPaymentModalOpen(false)}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 text-center"
                >
                  Cancel and return to checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
