/* eslint-disable @next/next/no-img-element */
'use client';


import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Product } from '@/types';
import { useWishlistStore } from '@/store/useWishlistStore';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  
  const mainImage =
    product.variants?.find((v) => v.images && v.images.length > 0)?.images?.[0] ||
    product.variants?.[0]?.images?.[0] ||
    '';  
  
  // Construct badge logic based on product properties
  let badge = null;
  if (product.isNewArrival) badge = 'New';
  else if (product.isLimitedEdition) badge = 'Limited';
  else if (product.isBestSeller) badge = 'Icon';

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block cr-reveal"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="relative overflow-hidden bg-bone aspect-[4/5] flex items-center justify-center">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 text-ink/40">
            <span className="font-serif text-3xl font-light tracking-[0.2em] mb-2">CR</span>
            <span className="eyebrow text-[9px] text-muted-foreground/60 uppercase">{product.name}</span>
          </div>
        )}
        {badge && (
          <span className="absolute left-4 top-4 eyebrow bg-cream/90 text-ink px-2.5 py-1">
            {badge}
          </span>
        )}
        <button
          aria-label="Add to wishlist"
          className="absolute right-4 top-4 h-9 w-9 grid place-items-center rounded-full bg-cream/80 backdrop-blur opacity-0 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0"
          onClick={handleWishlist}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-ink' : ''}`} />
        </button>
        <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="bg-ink text-cream text-center eyebrow py-3">Quick view</div>
        </div>
      </div>
      <div className="mt-3.5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-[15px] sm:text-base font-normal text-inherit group-hover:text-gold transition-colors line-clamp-1">
            {product.name}
          </h3>
          <span className="eyebrow tabular-nums font-medium text-inherit shrink-0">
            &#8377; {(product.price ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs opacity-70">
          <span className="eyebrow text-[10px] tracking-[0.15em] uppercase">
            {product.category}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="line-through text-[11px] opacity-60 tabular-nums">
              &#8377; {(product.originalPrice ?? 0).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
