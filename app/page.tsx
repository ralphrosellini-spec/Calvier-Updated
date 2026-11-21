/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Crown, Shield, Sparkles,
  Heart, Package, Clock, PhoneCall, Compass,
  CheckCircle2, Star, ChevronRight, Gem, Settings, PlusCircle
} from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts, getCategories, getTestimonials, getOrdersByUserId } from '@/lib/firebase-db';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import type { Product, Category, Testimonial, Order } from '@/types';

interface HomepageContent {
  heroImage: string;
  campaignBagsImage: string;
  campaignShoesImage: string;
  featuredSplitImage: string;
}

const emptyContent: HomepageContent = {
  heroImage: '',
  campaignBagsImage: '',
  campaignShoesImage: '',
  featuredSplitImage: '',
};

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [content, setContent] = useState<HomepageContent>(emptyContent);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedProducts, docSnap, fetchedCats, fetchedTestimonials] = await Promise.all([
          getProducts(),
          getDoc(doc(db, 'site_content', 'homepage')),
          getCategories(),
          getTestimonials(),
        ]);

        setProducts(fetchedProducts);

        if (docSnap.exists()) {
          setContent(docSnap.data() as HomepageContent);
        }
        setCategories(fetchedCats);
        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch logged in user orders for the VIP salon
  useEffect(() => {
    if (user?.uid) {
      getOrdersByUserId(user.uid)
        .then((orders) => setUserOrders(orders))
        .catch(() => {});
    }
  }, [user]);

  // Dynamically derive tabs from categories in DB or distinct categories in products, ensuring unique IDs
  const categoryTabs = (() => {
    const tabMap = new Map<string, { id: string; label: string }>();

    tabMap.set('all', { id: 'all', label: 'All Silhouettes' });

    categories.forEach((c) => {
      const id = (c.slug || c.name || '').toLowerCase().trim();
      if (id && id !== 'all') {
        tabMap.set(id, { id, label: c.name || id });
      }
    });

    if (categories.length === 0) {
      const distinctCategories = Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      );
      distinctCategories.forEach((cat) => {
        const id = cat.toLowerCase().trim();
        if (id && id !== 'all') {
          tabMap.set(id, { id, label: cat });
        }
      });
    }

    if (!tabMap.has('icons')) {
      tabMap.set('icons', { id: 'icons', label: 'Maison Icons' });
    }

    return Array.from(tabMap.values());
  })();

  // Filter products by dynamic tab
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'icons') {
      return (
        p.isBestSeller ||
        p.isFeatured ||
        p.category?.toLowerCase() === 'icons' ||
        p.categorySlug?.toLowerCase() === 'icons'
      );
    }
    const catName = p.category?.toLowerCase() || '';
    const catSlug = (p.categorySlug || p.categoryId || '')?.toLowerCase();
    const target = activeTab.toLowerCase();
    return (
      catName === target ||
      catName.includes(target) ||
      catSlug === target ||
      (catName && target.includes(catName))
    );
  });

  const clientName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : 'Valued Client';

  const memberId = user?.uid ? user.uid.slice(0, 6).toUpperCase() : 'VIP';

  return (
    <div className="bg-ink text-cream selection:bg-gold selection:text-ink min-h-screen">

      {/* ─── 1. EXECUTIVE ATELIER COMMAND DECK (Rendered for Admins & Ralph Rosellini) ─── */}
      {isAdmin && (
        <section className="bg-gradient-to-r from-amber-950/90 via-black to-amber-950/90 border-b border-amber-500/30 py-2.5 px-4 sm:px-6 text-xs sticky top-16 md:top-20 z-40 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold tracking-wider uppercase text-[11px] shrink-0">
              <Crown size={15} className="text-amber-400 shrink-0" />
              <span>Executive Atelier Command</span>
              <span className="text-white/40 hidden sm:inline">|</span>
              <span className="text-white/60 font-mono hidden md:inline">{user?.email}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              <Link
                href="/admin"
                className="bg-amber-400 text-black px-3 py-1.5 rounded-sm font-bold tracking-wider uppercase text-[10px] hover:bg-amber-300 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Settings size={12} /> Admin Portal
              </Link>
              <Link
                href="/admin/products/add"
                className="border border-amber-400/40 text-amber-200 px-3 py-1.5 rounded-sm font-semibold tracking-wider uppercase text-[10px] hover:bg-amber-400/20 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <PlusCircle size={12} /> Add Product
              </Link>
              <Link
                href="/admin/admins"
                className="border border-white/20 text-white/90 px-3 py-1.5 rounded-sm font-semibold tracking-wider uppercase text-[10px] hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Shield size={12} /> Team Access
              </Link>
              <Link
                href="/admin/orders"
                className="border border-white/20 text-white/90 px-3 py-1.5 rounded-sm font-semibold tracking-wider uppercase text-[10px] hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Package size={12} /> Orders
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── 2. VIP MAISON PRIVÉE PRIVATE SALON (Rendered for all Logged-In Clients) ─── */}
      {user ? (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0d0d0d] via-[#121212] to-ink border-b border-cream/10 pt-8 pb-16 px-6 md:px-12">
          {/* Subtle gold watermark emblem */}
          <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 opacity-5 pointer-events-none select-none text-[260px] font-serif">
            CR
          </div>

          <div className="max-w-[1600px] mx-auto relative z-10">
            {/* VIP Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cream/10 mb-8">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="eyebrow text-gold text-[10px] tracking-[0.3em]">
                  Maison Privée · Private Client Salon
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-cream/50">
                <span>Member ID: <strong className="text-cream font-bold">CR-{memberId}</strong></span>
                <span>A</span>
                <span className="text-gold flex items-center gap-1">
                  <Sparkles size={12} /> VIP Atelier Tier
                </span>
              </div>
            </div>

            {/* Personalized Welcome Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
              <div className="lg:col-span-8">
                <p className="eyebrow text-gold tracking-[0.35em] uppercase text-xs mb-3">
                  Exclusive Client Suite
                </p>
                <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light text-cream leading-[1.05]">
                  Welcome to your Private Salon, <span className="italic text-gold">{clientName}</span>.
                </h1>
                <p className="mt-4 text-cream/60 text-sm md:text-base max-w-2xl leading-relaxed">
                  Your bespoke atelier access is active. Explore reserved archive allocations, review your active commissions, and enjoy complimentary personal styling services.
                </p>
              </div>

              {/* Private Quick Actions Dock */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <Link
                  href="/dashboard/orders"
                  className="bg-cream/5 hover:bg-cream/10 border border-cream/15 p-4 rounded-sm transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-gold" />
                    <div>
                      <p className="text-xs font-semibold text-cream">Private Commissions &amp; Orders</p>
                      <p className="text-[10px] text-cream/40">{userOrders.length} {userOrders.length === 1 ? 'order registered' : 'orders registered'}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-cream/40 group-hover:text-gold group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/wishlist"
                  className="bg-cream/5 hover:bg-cream/10 border border-cream/15 p-4 rounded-sm transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Heart size={20} className="text-gold" />
                    <div>
                      <p className="text-xs font-semibold text-cream">Curated Private Wishlist</p>
                      <p className="text-[10px] text-cream/40">Saved atelier pieces</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-cream/40 group-hover:text-gold group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="bg-gold/10 border border-gold/30 p-4 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PhoneCall size={20} className="text-gold" />
                    <div>
                      <p className="text-xs font-semibold text-cream">Bespoke Concierge Line</p>
                      <p className="text-[10px] text-gold/80">Available 24/7 for Private Clients</p>
                    </div>
                  </div>
                  <span className="eyebrow text-[9px] bg-gold text-black px-2.5 py-1 rounded font-bold">Priority</span>
                </div>
              </div>
            </div>

            {/* Member Benefits Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-cream/10">
              <div className="flex items-center gap-2.5 text-xs text-cream/70">
                <CheckCircle2 size={16} className="text-gold shrink-0" />
                <span>Complimentary White-Glove Courier</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-cream/70">
                <CheckCircle2 size={16} className="text-gold shrink-0" />
                <span>Bespoke Hand-Monogramming</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-cream/70">
                <CheckCircle2 size={16} className="text-gold shrink-0" />
                <span>Priority Allocation for Limited Drops</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-cream/70">
                <CheckCircle2 size={16} className="text-gold shrink-0" />
                <span>Lifetime Authenticity Archival Record</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ─── 3. CINEMATIC HAUTE COUTURE HERO (For Guests) ─── */
        <section className="relative h-[100svh] w-full overflow-hidden bg-ink text-cream -mt-16 md:-mt-20">
          {content.heroImage ? (
            <img
              src={content.heroImage}
              alt="Calvier Rossel — Autumn 2026 Collection"
              className="absolute inset-0 h-full w-full object-cover opacity-90 scale-100 transition-transform duration-[4000ms] hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#080808]">
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <span className="font-display text-[30vw] text-cream select-none">CR</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/20 to-ink" />

          <div className="absolute inset-0 mx-auto flex max-w-[1600px] flex-col justify-end px-6 md:px-12 pb-20 md:pb-28">
            <div className="max-w-4xl">
              <div className="eyebrow text-gold cr-reveal tracking-[0.35em] mb-4">
                Autumn — Winter A MMXXVI Runway
              </div>
              <h1 className="font-display text-[52px] sm:text-[84px] md:text-[124px] leading-[0.9] text-cream">
                <span className="block overflow-hidden">
                  <span className="block cr-rise" style={{ animationDelay: '120ms' }}>
                    A study in
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span className="block italic text-gold cr-rise" style={{ animationDelay: '260ms' }}>
                    quiet luxury.
                  </span>
                </span>
              </h1>
              <p
                className="mt-8 max-w-lg text-sm md:text-base text-cream/80 leading-relaxed cr-reveal"
                style={{ animationDelay: '520ms' }}
              >
                Twelve shoes. Nine bags. Every silhouette hand-numbered and sculpted by a single artisan in our Firenze atelier.
              </p>

              <div
                className="mt-10 flex flex-wrap items-center gap-4 cr-reveal"
                style={{ animationDelay: '700ms' }}
              >
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-3 bg-cream text-ink px-8 py-4 text-[11px] tracking-[0.25em] uppercase font-bold hover:bg-gold hover:text-ink transition-colors"
                >
                  Explore The Collection
                  <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border border-cream/30 hover:border-gold text-cream px-7 py-4 text-[11px] tracking-[0.25em] uppercase font-semibold hover:text-gold transition-colors"
                >
                  <Sparkles size={14} className="text-gold" /> Private Client Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Floating Atelier Coordinates */}
          <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-end gap-3 text-cream/60">
            <div className="eyebrow text-gold text-[10px]">Look 01 / 24</div>
            <div className="h-20 w-px bg-cream/20" />
            <div className="eyebrow text-[10px] tracking-[0.25em] [writing-mode:vertical-rl] rotate-180">
              Firenze — Paris — Tokyo
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute left-1/2 bottom-6 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/50">
            <span className="eyebrow text-[9px]">Discover</span>
            <div className="relative h-8 w-px bg-cream/20 overflow-hidden">
              <span
                className="absolute inset-x-0 top-0 h-3 bg-gold"
                style={{ animation: 'cr-scroll-hint 2.4s ease-in-out infinite' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── 4. INTERACTIVE ATELIER DISCOVERY TABS & BACKEND INVENTORY ─── */}
      <section className="mx-auto max-w-[1600px] px-6 md:px-12 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-cream/10 pb-8">
          <div>
            <div className="flex items-center gap-2 text-gold eyebrow text-[10px] tracking-[0.3em] mb-2">
              <Gem size={13} />
              <span>{user ? 'Private Client Reserve' : 'Current Atelier Offerings'}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-cream">
              {user ? 'Curated Private Reserve' : 'The Signature Edit'}
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase font-semibold transition-all border rounded-sm',
                  activeTab === tab.id
                    ? 'border-gold bg-gold text-ink shadow-md shadow-gold/20'
                    : 'border-cream/15 text-cream/60 hover:text-cream hover:border-cream/40 bg-cream/5'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[4/5] bg-cream/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-cream/10 bg-cream/5 p-10">
            <Compass size={36} className="mx-auto text-gold/40 mb-4" />
            <h3 className="font-serif text-2xl text-cream mb-2">New Atelier Commission in Progress</h3>
            <p className="text-cream/50 text-xs mb-6">Our Florentine artisans are crafting upcoming silhouettes.</p>
            <Link href="/shop" className="text-gold text-xs eyebrow hover:underline">
              Browse All Pieces in Store →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.slice(0, 8).map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 border border-cream/20 hover:border-gold text-cream px-10 py-4 text-[11px] tracking-[0.25em] uppercase font-semibold hover:text-gold hover:bg-cream/5 transition-all"
          >
            Explore Complete Atelier Catalog ({products.length} pieces)
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ─── 5. CRAFTSMANSHIP & FLORENTINE HERITAGE ("MATERIA PRIMA") ─── */}
      <section className="bg-[#0e0e0e] border-y border-cream/10 py-24 md:py-36">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-5 space-y-6">
            <p className="eyebrow text-gold text-[10px] tracking-[0.4em] uppercase">
              The Atelier Philosophy
            </p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-cream leading-[1.1]">
              Every stitch is a promise of <span className="italic text-gold">permanence</span>.
            </h2>
            <p className="text-cream/60 text-sm md:text-base leading-relaxed">
              We reject the transient cadence of seasonal fashion. Each Calvier Rossel silhouette is shaped around custom wooden lasts carved in Scandicci, utilizing full-grain Tuscan hides vegetable-tanned with mimosa and chestnut extracts.
            </p>

            <div className="space-y-4 pt-4 border-t border-cream/10">
              <div className="flex gap-4">
                <span className="font-serif text-2xl text-gold font-light">01</span>
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-cream">Full-Grain Tuscan Calfskin</h4>
                  <p className="text-xs text-cream/50 mt-1">Sourced exclusively from certified historic Tuscan tanneries.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="font-serif text-2xl text-gold font-light">02</span>
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-cream">Saddle-Stitched Welt Construction</h4>
                  <p className="text-xs text-cream/50 mt-1">Engineered to be completely resoled and loved for generations.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="font-serif text-2xl text-gold font-light">03</span>
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-cream">Sculptural Balance</h4>
                  <p className="text-xs text-cream/50 mt-1">Calculated heel center-of-gravity ensures evening-long poise.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-cream/5 rounded-sm">
              {content.featuredSplitImage ? (
                <img
                  src={content.featuredSplitImage}
                  alt="Leather craft details"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-6xl text-cream/10 select-none">CR</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 eyebrow text-[9px] bg-black/60 backdrop-blur-md px-3 py-1.5 text-cream/90">
                Atelier No. 04 — Leather Finishing
              </div>
            </div>

            <div className="relative aspect-[3/4] overflow-hidden bg-cream/5 rounded-sm sm:translate-y-8">
              {content.campaignShoesImage ? (
                <img
                  src={content.campaignShoesImage}
                  alt="Shoe architecture"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-6xl text-cream/10 select-none">CR</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 eyebrow text-[9px] bg-black/60 backdrop-blur-md px-3 py-1.5 text-cream/90">
                Atelier No. 12 — Last Sculpture
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. THE EDITORIAL CAMPAIGN SPLIT ─── */}
      <section className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow text-gold text-[10px] tracking-[0.35em] uppercase mb-2">Campaign Series</p>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-cream">Shoes &amp; Leather Goods</h2>
          <p className="text-cream/50 text-sm mt-3">Two pillars of the Maison. United by uncompromising materials.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {/* Bags Column */}
          <Link href="/shop" className="group block relative aspect-[4/5] overflow-hidden rounded-sm bg-cream/5">
            {content.campaignBagsImage ? (
              <img
                src={content.campaignBagsImage}
                alt="Maison Handbags"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-cream/5 to-cream/10">
                <span className="font-display text-8xl text-cream/10 select-none">CR</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="eyebrow text-gold text-[10px] tracking-[0.3em] uppercase block mb-1">Edition IX</span>
              <h3 className="font-serif text-3xl sm:text-4xl text-cream font-light mb-2">The Handbag Archive</h3>
              <p className="text-cream/70 text-xs mb-4">Sculpted silhouettes hand-finished in Florence.</p>
              <span className="eyebrow text-[10px] text-gold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Leather Goods →
              </span>
            </div>
          </Link>

          {/* Shoes Column */}
          <Link href="/shop" className="group block relative aspect-[4/5] overflow-hidden rounded-sm bg-cream/5">
            {content.campaignShoesImage ? (
              <img
                src={content.campaignShoesImage}
                alt="Maison Footwear"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-cream/5 to-cream/10">
                <span className="font-display text-8xl text-cream/10 select-none">CR</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="eyebrow text-gold text-[10px] tracking-[0.3em] uppercase block mb-1">Edition XII</span>
              <h3 className="font-serif text-3xl sm:text-4xl text-cream font-light mb-2">The Footwear Collection</h3>
              <p className="text-cream/70 text-xs mb-4">From evening court pumps to bespoke leather sneakers.</p>
              <span className="eyebrow text-[10px] text-gold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Footwear →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 7. PRIVATE CLIENT PRIVILEGES & CONCIERGE ─── */}
      <section className="bg-gradient-to-b from-ink to-[#090909] border-t border-cream/10 py-20 md:py-28">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="eyebrow text-gold text-[10px] tracking-[0.35em] uppercase mb-2">Service Privilège</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-cream">Client Commitments</h2>
            <p className="text-cream/50 text-xs mt-2">Every order is treated as a personal commission from our atelier.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-cream/10 p-8 rounded-sm bg-cream/5 space-y-3 hover:border-gold/50 transition-colors">
              <Compass size={24} className="text-gold" />
              <h4 className="font-serif text-lg text-cream font-normal">Complimentary Express Transit</h4>
              <p className="text-xs text-cream/50 leading-relaxed">
                Direct insured express courier dispatch across India and international destinations.
              </p>
            </div>

            <div className="border border-cream/10 p-8 rounded-sm bg-cream/5 space-y-3 hover:border-gold/50 transition-colors">
              <Clock size={24} className="text-gold" />
              <h4 className="font-serif text-lg text-cream font-normal">14-Day Complimentary Returns</h4>
              <p className="text-xs text-cream/50 leading-relaxed">
                Try in the comfort of your residence with complimentary courier collection.
              </p>
            </div>

            <div className="border border-cream/10 p-8 rounded-sm bg-cream/5 space-y-3 hover:border-gold/50 transition-colors">
              <Shield size={24} className="text-gold" />
              <h4 className="font-serif text-lg text-cream font-normal">Authenticated Guarantee</h4>
              <p className="text-xs text-cream/50 leading-relaxed">
                Every piece arrives with an archival certificate of origin and craftsmanship seal.
              </p>
            </div>

            <div className="border border-cream/10 p-8 rounded-sm bg-cream/5 space-y-3 hover:border-gold/50 transition-colors">
              <PhoneCall size={24} className="text-gold" />
              <h4 className="font-serif text-lg text-cream font-normal">Private Client Concierge</h4>
              <p className="text-xs text-cream/50 leading-relaxed">
                Dedicated stylist assistance for sizing, custom requests, and bespoke commissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. PRESS & TESTIMONIALS ─── */}
      <section className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 md:py-32 border-t border-cream/10">
        <div className="text-center mb-16">
          <p className="eyebrow text-gold text-[10px] tracking-[0.35em] uppercase mb-2">Critical Acclaim</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-cream">The Atelier Journal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={t.id || `testimonial-${idx}`} className="border border-cream/10 p-8 bg-cream/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-gold mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="font-serif text-lg sm:text-xl text-cream/90 font-light italic leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
              </div>
              <div className="pt-6 border-t border-cream/10 mt-6 flex items-center justify-between">
                <span className="eyebrow text-[10px] text-cream font-bold tracking-wider">{t.name}</span>
                <span className="text-[10px] font-mono text-cream/40">{t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 9. LIVE INSTAGRAM & SOCIAL ATELIER (Dynamic backend imagery) ─── */}
      <section className="mx-auto max-w-[1600px] px-6 md:px-12 py-16 border-t border-cream/10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow text-gold text-[10px] tracking-[0.3em] uppercase">Visual Journal</p>
            <h3 className="font-display text-3xl sm:text-4xl text-cream mt-1">@calvierrossel</h3>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow text-[10px] text-cream/70 hover:text-gold transition-colors flex items-center gap-1"
          >
            Follow on Instagram <ArrowUpRight size={13} />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {(() => {
            const uploadedImgs = products
              .flatMap((p) => p.variants?.flatMap((v) => v.images) || [])
              .filter(Boolean)
              .slice(0, 6);

            if (uploadedImgs.length === 0) {
              // No uploaded images yet — show branded placeholder grid
              return Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden bg-cream/5 rounded-sm flex items-center justify-center">
                  <span className="font-display text-2xl text-cream/10 select-none">CR</span>
                </div>
              ));
            }

            // Pad with CR placeholders if fewer than 6 uploaded images
            const display = uploadedImgs.length >= 6
              ? uploadedImgs
              : [...uploadedImgs, ...Array.from({ length: 6 - uploadedImgs.length })];

            return display.map((src, i) =>
              src ? (
                <div key={i} className="group relative aspect-square overflow-hidden bg-cream/5 rounded-sm">
                  <img
                    src={src as string}
                    alt={`Atelier Journal ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors" />
                </div>
              ) : (
                <div key={i} className="group relative aspect-square overflow-hidden bg-cream/5 rounded-sm flex items-center justify-center">
                  <span className="font-display text-2xl text-cream/10 select-none">CR</span>
                </div>
              )
            );
          })()}
        </div>
      </section>

      {/* ─── 10. PRIVATE MAISON NEWSLETTER ─── */}
      <section className="border-t border-cream/10 bg-[#0c0c0c] py-20 px-6 md:px-12 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="eyebrow text-gold text-[10px] tracking-[0.35em] uppercase">Private Gazette</p>
          <h3 className="font-serif text-3xl sm:text-4xl text-cream font-light">Join The Maison Reserve</h3>
          <p className="text-cream/50 text-xs leading-relaxed">
            Receive invitation-only announcements for upcoming Florentine drops, private salon viewings, and bespoke commissions.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for joining our private gazette.'); }} className="pt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your personal email address"
              required
              className="flex-1 bg-cream/5 border border-cream/20 px-5 py-3.5 text-xs text-cream focus:outline-none focus:border-gold transition-colors placeholder:text-cream/30"
            />
            <button
              type="submit"
              className="bg-gold text-ink font-bold text-[10px] tracking-[0.25em] uppercase px-8 py-3.5 hover:bg-amber-400 transition-colors shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
