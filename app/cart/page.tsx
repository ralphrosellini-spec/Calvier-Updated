'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag, ArrowRight, Trash2, Plus, Minus,
  Shield, Truck, RotateCcw
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cr-cream pt-32 pb-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white p-12 border border-black/10 shadow-sm rounded-xl">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 text-cr-charcoal/40">
            <ShoppingBag size={28} />
          </div>
          <h1 className="font-serif text-3xl font-light text-cr-black mb-3">Your Bag is Empty</h1>
          <p className="text-cr-charcoal/60 text-sm mb-8 leading-relaxed">
            There are currently no pieces in your shopping bag. Explore our atelier collection to
            select your desired pieces.
          </p>
          <Link
            href="/shop"
            className="inline-block w-full bg-cr-black text-white py-4 text-[11px] tracking-[0.25em] uppercase font-semibold hover:bg-cr-charcoal transition-colors rounded-sm"
          >
            Explore The Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cr-cream pt-28 pb-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="border-b border-black/10 pb-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-cr-charcoal/60 uppercase text-[10px] tracking-[0.3em] mb-2">
              Maison Calvier Rossel
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-light text-cr-black">
              Shopping Bag
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-cr-charcoal/50 hover:text-red-500 text-xs tracking-wider uppercase transition-colors self-start sm:self-auto"
          >
            Clear Entire Bag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* ─── Items List ─── */}
          <div className="lg:col-span-8 bg-white border border-black/10 rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-black/5">
              {items.map((item) => (
                <div key={item.id} className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">

                  {/* Thumbnail */}
                  <Link href={`/product/${item.product.slug}`} className="shrink-0">
                    <div className="relative w-24 h-32 bg-black/5 overflow-hidden rounded-sm flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.product.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/5 text-cr-charcoal/40 font-serif text-lg select-none">
                          CR
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-cr-charcoal/50 font-semibold mb-1">
                          {item.product.brand || 'Calvier Rossel'}
                        </p>
                        <Link href={`/product/${item.product.slug}`}>
                          <h3 className="font-serif text-lg font-light text-cr-black hover:text-amber-800 transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-black/30 hover:text-red-500 transition-colors p-1 shrink-0"
                        title="Remove piece"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Variant info: colour swatch + size */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-cr-charcoal/60">
                      <div className="flex items-center gap-2">
                        {/* Colour swatch */}
                        <span
                          className="inline-block w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: item.colorHex || '#888' }}
                        />
                        <span>
                          <span className="text-cr-charcoal/40 mr-1">Colour:</span>
                          <strong className="text-cr-black font-medium">{item.color}</strong>
                        </span>
                      </div>
                      <span className="text-black/20">|</span>
                      <span>
                        <span className="text-cr-charcoal/40 mr-1">Size:</span>
                        <strong className="text-cr-black font-medium">{item.size}</strong>
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      {/* Quantity Controller */}
                      <div className="flex items-center border border-black/15 rounded-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-cr-charcoal/60 hover:text-cr-black hover:bg-black/5 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-10 text-center text-xs font-medium text-cr-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-cr-charcoal/60 hover:text-cr-black hover:bg-black/5 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-sm font-medium text-cr-black">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[11px] text-cr-charcoal/50">
                            {formatPrice(item.price)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Guarantees bar */}
            <div className="bg-black/5 p-6 border-t border-black/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-cr-charcoal/70">
              <div className="flex items-center gap-2.5">
                <Truck size={16} className="text-cr-gold shrink-0" />
                <span>Complimentary Express Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw size={16} className="text-cr-gold shrink-0" />
                <span>14-Day Complimentary Returns</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-cr-gold shrink-0" />
                <span>Authenticated Guarantee</span>
              </div>
            </div>
          </div>

          {/* ─── Order Summary ─── */}
          <div className="lg:col-span-4 bg-white border border-black/10 rounded-lg p-6 sm:p-8 shadow-sm sticky top-28 space-y-6">
            <h3 className="font-serif text-2xl font-light text-cr-black border-b border-black/10 pb-4">
              Summary
            </h3>

            {/* Line items summary */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-cr-charcoal/70">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* swatch */}
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: item.colorHex || '#888' }}
                    />
                    <span className="truncate">
                      {item.product.name}{' '}
                      <span className="text-cr-charcoal/40">
                        · {item.color} · {item.size}
                      </span>
                    </span>
                  </div>
                  <span className="shrink-0 font-medium text-cr-black">
                    ×{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm border-t border-black/5 pt-4">
              <div className="flex justify-between text-cr-charcoal/70">
                <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} pieces)</span>
                <span className="font-medium text-cr-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-cr-charcoal/70">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Complimentary</span>
              </div>
              <div className="flex justify-between text-cr-charcoal/70">
                <span>Duties &amp; Taxes</span>
                <span className="font-medium text-cr-black">Included</span>
              </div>
            </div>

            <div className="border-t border-black/10 pt-4 flex justify-between items-baseline">
              <span className="font-serif text-lg text-cr-black">Total</span>
              <span className="text-2xl font-serif font-semibold text-cr-black">
                {formatPrice(subtotal)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-cr-black text-white py-4 text-[11px] tracking-[0.25em] uppercase font-bold hover:bg-cr-charcoal transition-colors rounded-sm shadow-md"
            >
              Proceed to Checkout <ArrowRight size={14} />
            </Link>

            <Link
              href="/shop"
              className="w-full block text-center border border-black/20 text-cr-charcoal/80 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-black/5 transition-colors rounded-sm"
            >
              Continue Shopping
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
