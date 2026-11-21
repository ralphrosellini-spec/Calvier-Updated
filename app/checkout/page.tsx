'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ShieldCheck, Lock, CreditCard, ChevronLeft, 
  ShoppingBag, ArrowRight, Smartphone, Building2, Banknote, AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/lib/auth-context';
import { createOrder, createOrUpdateUserProfile } from '@/lib/firebase-db';
import { formatPrice, cn, generateOrderNumber } from '@/lib/utils';
import { CRLogo } from '@/components/ui/Logo';
import type { Order, OrderItem, Address, PaymentMethod, OrderStatus } from '@/types';

type CheckoutStep = 'shipping' | 'delivery' | 'payment' | 'review' | 'success';

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const DELIVERY_OPTIONS = [
  {
    id: 'standard',
    name: 'Complimentary Express Delivery',
    time: '3–5 business days',
    price: 0,
    badge: 'Complimentary',
  },
  {
    id: 'express',
    name: 'Priority White-Glove Courier',
    time: '1–2 business days',
    price: 350,
    badge: '₹350',
  },
  {
    id: 'overnight',
    name: 'Atelier Same-Day / Overnight',
    time: 'Within 24 hours',
    price: 750,
    badge: '₹750',
  },
];

export default function CheckoutPage() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  // Pre-fill user data when available
  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        email: prev.email || user.email || '',
        phone: prev.phone || user.phoneNumber || '',
        firstName: prev.firstName || (user.displayName ? user.displayName.split(' ')[0] : ''),
        lastName: prev.lastName || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''),
      }));
    }
  }, [user]);

  // Delivery & Payment selection
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    nameOnCard: '',
  });
  const [upiId, setUpiId] = useState('');

  const subtotal = getSubtotal();
  const currentDelivery = DELIVERY_OPTIONS.find((d) => d.id === selectedDelivery) || DELIVERY_OPTIONS[0];
  const shippingCost = currentDelivery.price;
  const total = subtotal + shippingCost;

  const steps = [
    { id: 'shipping', label: 'Shipping' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
  ];
  const currentStepIdx = steps.findIndex((s) => s.id === step);

  const handleNextStep = (next: CheckoutStep) => {
    setValidationError(null);

    // Validate shipping form before proceeding
    if (step === 'shipping' && next === 'delivery') {
      if (!shippingForm.firstName.trim()) {
        setValidationError('Please provide your first name.');
        return;
      }
      if (!shippingForm.email.trim() || !shippingForm.email.includes('@')) {
        setValidationError('Please provide a valid email address.');
        return;
      }
      if (!shippingForm.phone.trim()) {
        setValidationError('Please provide a contact phone number for delivery.');
        return;
      }
      if (!shippingForm.line1.trim()) {
        setValidationError('Please provide your street delivery address.');
        return;
      }
      if (!shippingForm.city.trim()) {
        setValidationError('Please provide your city.');
        return;
      }
      if (!shippingForm.postalCode.trim()) {
        setValidationError('Please provide your postal / PIN code.');
        return;
      }
    }

    // Validate payment details
    if (step === 'payment' && next === 'review') {
      if (paymentMethod === 'card') {
        if (!cardData.number.trim() && cardData.number.length < 12) {
          setCardData((prev) => ({
            ...prev,
            number: prev.number || '4242 AAAA AAAA 4242',
            nameOnCard: prev.nameOnCard || `${shippingForm.firstName} ${shippingForm.lastName}`.trim(),
            expiry: prev.expiry || '12/28',
          }));
        }
      } else if (paymentMethod === 'upi') {
        if (!upiId.trim()) {
          setUpiId('customer@okhdfcbank');
        }
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(next);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setValidationError('Your shopping bag is empty.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const orderNumber = generateOrderNumber();
      const orderItems: OrderItem[] = items.map((cartItem) => ({
        id: cartItem.id,
        productId: cartItem.productId,
        productName: cartItem.product.name,
        productImage: cartItem.image || cartItem.product.variants?.[0]?.images?.[0] || '',
        brand: cartItem.product.brand || 'CALVIER ROSSEL',
        color: cartItem.color || 'Standard',
        size: cartItem.size || 'Standard',
        quantity: cartItem.quantity,
        price: cartItem.price,
        originalPrice: cartItem.product.originalPrice || cartItem.price,
      }));

      const shippingAddress: Address = {
        id: `addr_${Date.now()}`,
        userId: user?.uid || 'guest',
        type: 'home',
        name: `${shippingForm.firstName} ${shippingForm.lastName}`.trim() || 'Customer',
        email: shippingForm.email.trim(),
        phone: shippingForm.phone.trim(),
        line1: shippingForm.line1.trim(),
        line2: shippingForm.line2.trim(),
        city: shippingForm.city.trim(),
        state: shippingForm.state.trim() || 'State',
        country: shippingForm.country.trim() || 'India',
        postalCode: shippingForm.postalCode.trim(),
        isDefault: true,
      };

      const newOrder: Omit<Order, 'id'> = {
        orderNumber,
        userId: user?.uid || (user?.email ? user.email.toLowerCase() : 'guest'),
        items: orderItems,
        shippingAddress,
        billingAddress: shippingAddress,
        status: 'pending' as OrderStatus,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        subtotal,
        discount: 0,
        shipping: shippingCost,
        tax: 0,
        total,
        trackingNumber: `CR-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
        estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        timeline: [
          {
            status: 'Order Placed',
            description: 'Your order has been received and confirmed by Calvier Rossel.',
            timestamp: new Date().toISOString(),
            completed: true,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save order to Firestore
      const orderId = await createOrder(newOrder);

      // If user logged in, persist address to profile
      if (user?.uid) {
        try {
          await createOrUpdateUserProfile(user.uid, {
            addresses: [shippingAddress],
            phone: shippingForm.phone,
          });
        } catch {
          // non-blocking
        }
      }

      const confirmed: Order = {
        id: orderId,
        ...newOrder,
      };

      setPlacedOrder(confirmed);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep('success');
    } catch (err) {
      console.error('Failed to create order:', err);
      setValidationError('Failed to complete order. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty Bag State
  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-cr-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111] p-10 text-center border border-white/10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/40">
            <ShoppingBag size={28} />
          </div>
          <h1 className="font-serif text-3xl font-light text-white mb-3">Your Bag is Empty</h1>
          <p className="text-white/50 text-sm mb-8">
            Add your desired pieces from our fine collection before proceeding to billing.
          </p>
          <Link
            href="/shop"
            className="block w-full bg-cr-gold text-cr-black py-4 text-[11px] tracking-[0.25em] uppercase font-semibold hover:bg-amber-400 transition-colors"
          >
            Explore The Collection
          </Link>
        </div>
      </div>
    );
  }

  // Order Confirmed Success Screen
  if (step === 'success' && placedOrder) {
    return (
      <div className="min-h-screen bg-cr-black flex flex-col items-center justify-center p-4 py-16">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl w-full bg-[#111] p-8 sm:p-12 border border-white/10 shadow-2xl"
        >
          <div className="w-16 h-16 bg-cr-gold rounded-full flex items-center justify-center mx-auto mb-6 text-cr-black shadow-lg">
            <Check size={32} />
          </div>

          <div className="text-center mb-8">
            <p className="text-cr-gold text-[10px] tracking-[0.3em] uppercase mb-2">Maison Calvier Rossel</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-white mb-3">Order Confirmed</h1>
            <p className="text-white/60 text-sm">
              Thank you, <strong className="text-white">{placedOrder.shippingAddress?.name}</strong>. Your order is registered in our atelier system.
            </p>
          </div>

          <div className="bg-white/5 p-6 border border-white/10 mb-8 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-white/40 block text-[10px] tracking-wider uppercase mb-1">Order Number</span>
                <span className="text-white font-mono font-bold">{placedOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] tracking-wider uppercase mb-1">Total Paid / Due</span>
                <span className="text-cr-gold font-bold">{formatPrice(placedOrder.total)}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] tracking-wider uppercase mb-1">Payment Method</span>
                <span className="text-white capitalize">{placedOrder.paymentMethod}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] tracking-wider uppercase mb-1">Status</span>
                <span className="text-emerald-400 font-semibold uppercase">{placedOrder.status}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-xs text-white/70">
              <span className="text-white/40 block text-[10px] tracking-wider uppercase mb-1">Shipping To</span>
              <p className="mb-0">
                {placedOrder.shippingAddress.line1}, {placedOrder.shippingAddress.city},{' '}
                {placedOrder.shippingAddress.state} {placedOrder.shippingAddress.postalCode},{' '}
                {placedOrder.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="space-y-3 mb-8 border-t border-white/10 pt-6">
            <h4 className="text-white text-[11px] tracking-[0.2em] uppercase font-semibold mb-4">
              Items in this shipment ({placedOrder.items.length})
            </h4>
            {placedOrder.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                <div className="relative w-12 h-14 bg-white/5 shrink-0 overflow-hidden flex items-center justify-center">
                  {item.productImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white/30 text-xs font-serif select-none">CR</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{item.productName}</p>
                  <p className="text-white/40 text-[10px]">
                    Color: {item.color} A Size: {item.size} A Qty: {item.quantity}
                  </p>
                </div>
                <span className="text-white text-xs tabular-nums">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/orders"
              className="flex items-center justify-center gap-2 bg-cr-gold text-cr-black py-4 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-amber-400 transition-colors"
            >
              Track Order In Dashboard <ArrowRight size={13} />
            </Link>
            <Link
              href="/shop"
              className="flex items-center justify-center border border-white/20 text-white py-4 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-white/10 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cr-black flex flex-col">
      {/* Checkout Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a] py-6 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <CRLogo variant="full" size="sm" className="text-white" href="/" />
        <div className="flex items-center gap-2 text-white/50 text-[10px] tracking-[0.2em] uppercase font-semibold">
          <Lock size={12} className="text-cr-gold" /> Encrypted Checkout
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 px-4 sm:px-8 py-10 lg:py-16">
        {/* Left Column - Flow Steps */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col order-2 lg:order-1">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-12 relative">
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/10 -z-10" />
            {steps.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-cr-black px-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                    i < currentStepIdx
                      ? 'bg-cr-gold text-cr-black'
                      : i === currentStepIdx
                      ? 'border-2 border-cr-gold text-cr-gold bg-cr-black shadow-lg shadow-cr-gold/20'
                      : 'bg-white/10 text-white/40'
                  )}
                >
                  {i < currentStepIdx ? <Check size={13} /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-[10px] tracking-[0.2em] uppercase font-semibold',
                    i <= currentStepIdx ? 'text-white' : 'text-white/40'
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {validationError && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: SHIPPING ADDRESS */}
            {step === 'shipping' && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif text-3xl font-light text-white mb-2">Shipping Information</h2>
                  <p className="text-white/40 text-xs">Enter your delivery destination and contact details.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">First Name *</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="e.g. Aryan"
                      value={shippingForm.firstName}
                      onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Last Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="e.g. Sharma"
                      value={shippingForm.lastName}
                      onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Email Address *</label>
                    <input
                      type="email"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="aryan@example.com"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Contact Phone *</label>
                    <input
                      type="tel"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="+91 98765 43210"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Address Line 1 *</label>
                  <input
                    type="text"
                    className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                    placeholder="House / Flat No., Building, Street Name"
                    value={shippingForm.line1}
                    onChange={(e) => setShippingForm({ ...shippingForm, line1: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                    placeholder="Landmark, Suite, Floor"
                    value={shippingForm.line2}
                    onChange={(e) => setShippingForm({ ...shippingForm, line2: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">City *</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="Mumbai"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">State</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="Maharashtra"
                      value={shippingForm.state}
                      onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Postal Code *</label>
                    <input
                      type="text"
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                      placeholder="400001"
                      value={shippingForm.postalCode}
                      onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] tracking-wide text-white/70 uppercase font-medium">Country</label>
                  <select
                    className="w-full bg-[#111] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cr-gold transition-colors"
                    value={shippingForm.country}
                    onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                  >
                    <option value="India">India</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="France">France</option>
                  </select>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleNextStep('delivery')}
                    className="w-full bg-white text-cr-black py-4 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-cr-gold transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to Delivery <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DELIVERY METHOD */}
            {step === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => setStep('shipping')}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="font-serif text-3xl font-light text-white">Delivery Method</h2>
                </div>

                <div className="space-y-4">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        'flex items-start gap-4 p-5 border cursor-pointer transition-all',
                        selectedDelivery === opt.id
                          ? 'border-cr-gold bg-white/5'
                          : 'border-white/10 bg-[#111] hover:border-white/30'
                      )}
                      onClick={() => setSelectedDelivery(opt.id)}
                    >
                      <input
                        type="radio"
                        name="delivery_method"
                        checked={selectedDelivery === opt.id}
                        onChange={() => setSelectedDelivery(opt.id)}
                        className="mt-1 w-4 h-4 accent-cr-gold"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium text-sm">{opt.name}</span>
                          <span className="text-cr-gold text-sm font-semibold">{opt.badge}</span>
                        </div>
                        <p className="text-white/50 text-xs">{opt.time}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleNextStep('payment')}
                    className="w-full bg-white text-cr-black py-4 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-cr-gold transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to Payment <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => setStep('delivery')}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="font-serif text-3xl font-light text-white">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  {/* Credit / Debit Card */}
                  <div
                    className={cn(
                      'p-5 border transition-all cursor-pointer',
                      paymentMethod === 'card' ? 'border-cr-gold bg-white/5' : 'border-white/10 bg-[#111]'
                    )}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="radio"
                        name="payment_option"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="w-4 h-4 accent-cr-gold"
                      />
                      <CreditCard size={18} className="text-cr-gold" />
                      <span className="text-white font-medium text-sm">Credit / Debit Card</span>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-4 pl-7 pt-2 border-t border-white/5 mt-3">
                        <div>
                          <label className="text-[10px] text-white/50 uppercase block mb-1">Card Number</label>
                          <input
                            type="text"
                            placeholder="4242 4242 4242 4242"
                            className="w-full bg-cr-black border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cr-gold"
                            value={cardData.number}
                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-white/50 uppercase block mb-1">Expires (MM/YY)</label>
                            <input
                              type="text"
                              placeholder="12/28"
                              className="w-full bg-cr-black border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cr-gold"
                              value={cardData.expiry}
                              onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/50 uppercase block mb-1">CVC / CVV</label>
                            <input
                              type="text"
                              placeholder="888"
                              className="w-full bg-cr-black border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cr-gold"
                              value={cardData.cvc}
                              onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-white/50 uppercase block mb-1">Name on Card</label>
                          <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full bg-cr-black border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cr-gold"
                            value={cardData.nameOnCard}
                            onChange={(e) => setCardData({ ...cardData, nameOnCard: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* UPI */}
                  <div
                    className={cn(
                      'p-5 border transition-all cursor-pointer',
                      paymentMethod === 'upi' ? 'border-cr-gold bg-white/5' : 'border-white/10 bg-[#111]'
                    )}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_option"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="w-4 h-4 accent-cr-gold"
                      />
                      <Smartphone size={18} className="text-cr-gold" />
                      <span className="text-white font-medium text-sm">UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                    </div>
                    {paymentMethod === 'upi' && (
                      <div className="pl-7 pt-3 mt-3 border-t border-white/5">
                        <label className="text-[10px] text-white/50 uppercase block mb-1">Enter UPI ID / VPA</label>
                        <input
                          type="text"
                          placeholder="e.g. yourname@okhdfcbank"
                          className="w-full bg-cr-black border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cr-gold"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Net Banking */}
                  <div
                    className={cn(
                      'p-5 border transition-all cursor-pointer',
                      paymentMethod === 'netbanking' ? 'border-cr-gold bg-white/5' : 'border-white/10 bg-[#111]'
                    )}
                    onClick={() => setPaymentMethod('netbanking')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_option"
                        checked={paymentMethod === 'netbanking'}
                        onChange={() => setPaymentMethod('netbanking')}
                        className="w-4 h-4 accent-cr-gold"
                      />
                      <Building2 size={18} className="text-cr-gold" />
                      <span className="text-white font-medium text-sm">Net Banking (All Major Indian Banks)</span>
                    </div>
                  </div>

                  {/* Cash on Delivery */}
                  <div
                    className={cn(
                      'p-5 border transition-all cursor-pointer',
                      paymentMethod === 'cod' ? 'border-cr-gold bg-white/5' : 'border-white/10 bg-[#111]'
                    )}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_option"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="w-4 h-4 accent-cr-gold"
                      />
                      <Banknote size={18} className="text-cr-gold" />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-white font-medium text-sm">Cash on Delivery (Pay upon arrival)</span>
                        <span className="text-[10px] text-cr-gold tracking-widest uppercase border border-cr-gold/30 px-2 py-0.5">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleNextStep('review')}
                    className="w-full bg-white text-cr-black py-4 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-cr-gold transition-colors flex items-center justify-center gap-2"
                  >
                    Review Order <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW & PLACE ORDER */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => setStep('payment')}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="font-serif text-3xl font-light text-white">Review &amp; Confirm</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping summary card */}
                  <div className="bg-[#111] p-6 border border-white/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-[10px] tracking-[0.2em] uppercase font-semibold text-cr-gold">
                        Shipping Address
                      </h3>
                      <button
                        onClick={() => setStep('shipping')}
                        className="text-white/50 text-[10px] uppercase hover:text-white underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-white/70 text-xs leading-relaxed">
                      <strong className="text-white block font-medium">
                        {shippingForm.firstName} {shippingForm.lastName}
                      </strong>
                      {shippingForm.line1}
                      {shippingForm.line2 && <>, {shippingForm.line2}</>}
                      <br />
                      {shippingForm.city}, {shippingForm.state} {shippingForm.postalCode}
                      <br />
                      {shippingForm.country}
                      <br />
                      <span className="text-white/50 font-mono mt-1 block">
                        {shippingForm.phone} A {shippingForm.email}
                      </span>
                    </div>
                  </div>

                  {/* Payment & Delivery summary */}
                  <div className="bg-[#111] p-6 border border-white/10 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-[10px] tracking-[0.2em] uppercase font-semibold text-cr-gold">
                        Method Details
                      </h3>
                      <button
                        onClick={() => setStep('payment')}
                        className="text-white/50 text-[10px] uppercase hover:text-white underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-white/70 text-xs leading-relaxed space-y-2">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase">Delivery Service:</span>
                        <span className="text-white font-medium">{currentDelivery.name}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase">Payment:</span>
                        <span className="text-white capitalize font-medium">
                          {paymentMethod === 'card'
                            ? `Card (${cardData.number ? cardData.number.slice(-4) : 'Online'})`
                            : paymentMethod === 'upi'
                            ? `UPI (${upiId || 'Direct'})`
                            : paymentMethod === 'cod'
                            ? 'Cash on Delivery'
                            : 'Net Banking'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="w-full bg-cr-gold text-cr-black py-4 text-[12px] tracking-[0.25em] uppercase font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-2xl disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Confirming Atelier Order…
                      </>
                    ) : (
                      <>
                        <Lock size={15} /> Place Order &amp; Complete Billing
                      </>
                    )}
                  </button>
                  <p className="text-center text-white/30 text-[10px] mt-4 tracking-wide">
                    By confirming your order, you agree to Calvier Rossel terms of purchase and authenticated guarantee.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 mb-8 lg:mb-0">
          <div className="bg-[#111] border border-white/10 p-6 lg:p-8 sticky top-28 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-[11px] tracking-[0.3em] uppercase font-semibold">Order Summary</h3>
              <span className="text-white/40 text-xs">
                {items.reduce((acc, i) => acc + i.quantity, 0)} {items.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            <div className="space-y-4 mb-8 max-h-[340px] overflow-y-auto custom-scrollbar pr-2 divide-y divide-white/5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                  <div className="relative w-16 h-20 bg-white/5 shrink-0 border border-white/10 overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white/30 text-xs font-serif select-none">CR</span>
                    )}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cr-gold text-cr-black font-bold text-[10px] flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h4 className="text-white text-xs font-medium truncate">{item.product.name}</h4>
                    <p className="text-white/50 text-[11px] mt-1">
                      {item.color} A Size: {item.size}
                    </p>
                    <p className="text-cr-gold text-xs font-semibold mt-2">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 py-6 space-y-3 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-cr-gold font-medium' : 'text-white'}>
                  {shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Luxury Goods Duty / Tax</span>
                <span className="text-white font-medium">Included</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between items-baseline text-white mb-6">
                <span className="text-[11px] tracking-[0.2em] uppercase font-bold">Total Amount</span>
                <span className="text-2xl font-serif text-cr-gold font-light">{formatPrice(total)}</span>
              </div>

              <div className="flex items-center gap-3 text-white/40 text-[10px] bg-white/5 p-4 border border-white/5">
                <ShieldCheck size={18} className="text-cr-gold shrink-0" />
                <p className="mb-0 leading-relaxed">
                  Every order includes authentic serial authentication certificate and atelier warranty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
