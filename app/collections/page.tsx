'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getCollections } from '@/lib/firebase-db';
import type { Collection } from '@/types';

const defaultCollections: Collection[] = [
  {
    id: 'aurora-ss26',
    name: 'Aurora — Spring / Summer 2026',
    slug: 'aurora-ss26',
    title: 'Aurora',
    subtitle: 'Florentine Elegance Redefined',
    description: 'Drawing from celestial light and Tuscan craft, Aurora blends sculptural leather architectural shapes with fluid, ethereal lines.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=90',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=90',
    season: 'Spring / Summer',
    year: 2026,
    featured: true,
    isCurrent: true,
    tags: ['Haute Couture', 'Atelier', 'Limited'],
  },
  {
    id: 'noir-fw25',
    name: 'Noir — Autumn / Winter 2025',
    slug: 'noir-fw25',
    title: 'Noir Atelier',
    subtitle: 'Deep Obsidian Calfskin',
    description: 'A study in dark architectural form and vegetable-tanned full-grain leather silhouettes shaped for evening poise.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=90',
    coverImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=90',
    season: 'Autumn / Winter',
    year: 2025,
    featured: false,
    isCurrent: false,
    tags: ['Footwear', 'Leather Goods'],
  },
];

export default function CollectionsIndexPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollections()
      .then((data) => {
        setCollections(data.length > 0 ? data : defaultCollections);
      })
      .catch(() => {
        setCollections(defaultCollections);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-ink min-h-screen text-cream pt-24 pb-20 selection:bg-gold selection:text-ink">
      {/* Header */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-16 border-b border-cream/10">
        <p className="eyebrow text-gold text-[10px] tracking-[0.35em] uppercase mb-3 flex items-center gap-2">
          <Sparkles size={12} /> Seasonal Editions &amp; Archives
        </p>
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light text-cream leading-tight">
          The Collections
        </h1>
        <p className="mt-4 text-cream/60 max-w-2xl text-sm md:text-base leading-relaxed">
          Each Calvier Rossel collection represents a distinct chapter of craftsmanship sculpted in our Scandicci atelier, released in strictly numbered allocations.
        </p>
      </section>

      {/* Grid */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-12 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="aspect-[16/10] bg-cream/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {collections.map((col) => {
              const bgImg = col.coverImage || col.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=90';
              return (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group block relative aspect-[16/11] overflow-hidden rounded-sm bg-cream/5 border border-cream/10 hover:border-gold/50 transition-all"
                >
                  <Image
                    src={bgImg}
                    alt={col.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="eyebrow text-gold text-[10px] tracking-[0.3em] uppercase block mb-1">
                      {col.season} · {col.year}
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-cream font-light mb-2">
                      {col.name}
                    </h2>
                    <p className="text-cream/70 text-xs mb-4 line-clamp-2 max-w-xl">
                      {col.description}
                    </p>
                    <span className="eyebrow text-[10px] text-gold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore Silhouette Selection <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
