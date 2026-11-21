'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getOrderById } from '@/lib/firebase-db';
import type { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Printer, ShieldCheck, Package, Clock } from 'lucide-react';

export default function CustomerOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cr-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cr-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <Package size={48} className="text-white/20 mb-4" />
        <h1 className="font-serif text-2xl text-white mb-2">Order Not Found</h1>
        <p className="text-white/50 text-sm mb-6">We could not locate this order in your account records.</p>
        <Link
          href="/dashboard/orders"
          className="text-[11px] tracking-[0.2em] uppercase bg-cr-gold text-cr-black px-6 py-3 font-semibold hover:bg-amber-400 transition-colors"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    confirmed: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
    processing: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    shipped: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    delivered: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    cancelled: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 print:hidden">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={14} /> Back to Order History
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-white/20 transition-colors border border-white/10"
        >
          <Printer size={14} /> Print Invoice
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-[#111] border border-white/10 p-8 sm:p-12 shadow-xl text-white">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-white/10 pb-8">
          <div>
            <span className="font-display text-2xl tracking-[0.25em] block text-cr-gold">
              CALVIER ROSSEL
            </span>
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 mt-1">
              Maison de Haute Maroquinerie · Est. 1926
            </p>
          </div>
          <div className="text-left sm:text-right text-xs space-y-1">
            <span className="text-white/40 block text-[10px] uppercase tracking-wider">Invoice / Receipt</span>
            <p className="font-mono text-white text-base font-bold">{order.orderNumber || order.id}</p>
            <p className="text-white/60">Date: {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Status banner */}
        <div className="my-6 p-4 bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-cr-gold" />
            <span className="text-xs text-white/80">
              Current Status:
            </span>
            <span
              className={`text-[10px] tracking-widest uppercase font-bold px-3 py-1 border rounded-sm ${
                statusColors[order.status] || 'text-white border-white/20'
              }`}
            >
              {order.status.replace('_', ' ')}
            </span>
          </div>

          {order.trackingNumber && (
            <div className="text-xs text-white/70 font-mono">
              Tracking: <span className="text-cr-gold">{order.trackingNumber}</span>
            </div>
          )}
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-white/10 text-xs">
          <div>
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-cr-gold font-semibold mb-3">
              Shipping Destination
            </h4>
            <p className="text-white/70 leading-relaxed">
              <strong className="text-white block">{order.shippingAddress?.name || 'Customer'}</strong>
              {order.shippingAddress?.line1}
              {order.shippingAddress?.line2 && <>, {order.shippingAddress.line2}</>}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
              {order.shippingAddress?.postalCode}
              <br />
              {order.shippingAddress?.country || 'India'}
              <br />
              <span className="text-white/40 font-mono mt-1 block">
                {order.shippingAddress?.phone} A {order.shippingAddress?.email}
              </span>
            </p>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-cr-gold font-semibold mb-3">
              Payment & Dispatch
            </h4>
            <div className="text-white/70 space-y-1.5 leading-relaxed">
              <p>
                <span className="text-white/40">Payment Method:</span>{' '}
                <strong className="text-white capitalize">{order.paymentMethod}</strong>
              </p>
              <p>
                <span className="text-white/40">Payment Status:</span>{' '}
                <strong className="text-white capitalize">{order.paymentStatus}</strong>
              </p>
              <p>
                <span className="text-white/40">Estimated Delivery:</span>{' '}
                <strong className="text-white">{formatDate(order.estimatedDelivery)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="py-8">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold mb-4">
            Order Items
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Piece</th>
                  <th className="pb-3 text-center font-semibold">Details</th>
                  <th className="pb-3 text-center font-semibold">Qty</th>
                  <th className="pb-3 text-right font-semibold">Price</th>
                  <th className="pb-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="py-4">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-14 bg-white/5 shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
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
                        <span className="text-white font-medium">{item.productName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center text-white/60">
                      {item.color} A {item.size}
                    </td>
                    <td className="py-4 text-center font-medium text-white">{item.quantity}</td>
                    <td className="py-4 text-right text-white/60">{formatPrice(item.price)}</td>
                    <td className="py-4 text-right font-semibold text-white">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-white/10 pt-6 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-cr-gold' : 'text-white'}>
                {order.shipping === 0 ? 'Complimentary' : formatPrice(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Duties & Taxes</span>
              <span>Included</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-baseline text-white">
              <span className="font-bold uppercase tracking-wider text-xs">Grand Total</span>
              <span className="font-serif text-xl font-light text-cr-gold">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Authenticity Note */}
        <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-cr-gold" />
            <span>Official Atelier Authenticity Guaranteed · Calvier Rossel</span>
          </div>
          <span>support@calvierrossel.com</span>
        </div>
      </div>
    </div>
  );
}
