'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

const nav = [
  { label: "New", href: "/shop" },
  { label: "Bags", href: "/shop" },
  { label: "Shoes", href: "/shop" },
  { label: "Icons", href: "/shop" },
  { label: "Atelier", href: "/" },
  { label: "Journal", href: "/" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const overHero = pathname === "/";
  const { items } = useCartStore();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [userMenuOpen]);

  const dark = overHero && !scrolled;

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.push('/');
  };

  // Get display name from phone number
  const userInitial = user?.phoneNumber
    ? user.phoneNumber.slice(-2)
    : user?.email?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-[background-color,color,backdrop-filter,border-color] duration-500",
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border/60 text-foreground"
          : dark
          ? "bg-transparent text-cream"
          : "bg-background text-foreground border-b border-border/60",
      ].join(" ")}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-6 md:px-12 h-16 md:h-20">
        {/* Left nav */}
        <nav className="hidden md:flex items-center gap-8">
          {nav.slice(0, 4).map((n) => (
            <Link key={n.label} href={n.href} className="eyebrow link-underline">
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          className="md:hidden justify-self-start"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center logo */}
        <Link href="/" className="justify-self-center text-center leading-none select-none">
          <div className="font-display text-[22px] md:text-[26px] tracking-[0.32em]">
            CALVIER ROSSEL
          </div>
          <div className="eyebrow opacity-60 text-[9px] mt-1">MAISON · EST. 1926</div>
        </Link>

        {/* Right icons */}
        <div className="justify-self-end flex items-center gap-5 md:gap-6">
          <button aria-label="Search" className="hidden md:block">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link href="/dashboard/wishlist" aria-label="Wishlist" className="hidden md:block">
            <Heart className="h-[18px] w-[18px]" />
          </Link>

          {/* Auth-aware user button */}
          {user ? (
            <div id="user-menu-container" className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                aria-label="Account"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-ink text-xs font-semibold hover:scale-105 transition-transform"
              >
                {userInitial}
              </button>

              {userMenuOpen && (
                <div className={`absolute right-0 top-12 w-52 border shadow-xl z-50 ${dark && !scrolled ? 'bg-ink border-cream/20 text-cream' : 'bg-background border-border text-foreground'}`}>
                  <div className="px-4 py-3 border-b border-current/10">
                    <p className="eyebrow text-current/40 mb-1">Signed in as</p>
                    <p className="text-sm font-mono truncate">{user.phoneNumber || user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-current/5 transition-colors"
                    >
                      <LayoutDashboard size={15} /> My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gold hover:bg-current/5 transition-colors"
                      >
                        <User size={15} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-current/5 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" aria-label="Sign In" className="hidden md:block">
              <User className="h-[18px] w-[18px]" />
            </Link>
          )}

          <Link href="/checkout" aria-label="Bag" className="relative">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 text-[10px] tabular-nums">
                {cartCount}
              </span>
            )}
          </Link>
          <span className="hidden lg:inline eyebrow opacity-70 ml-2">EN · EUR</span>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-[60] bg-background text-foreground transition-transform duration-500 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <span className="font-display tracking-[0.3em]">CR</span>
          <button onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-8 py-10 flex flex-col gap-5">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              onClick={() => setOpen(false)}
              className="font-display text-4xl"
            >
              {n.label}
            </Link>
          ))}
          <div className="border-t border-border/60 my-6" />
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="eyebrow opacity-70">My Orders</Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)} className="eyebrow text-gold">Admin Panel</Link>
              )}
              <button onClick={handleSignOut} className="eyebrow text-red-500 text-left">Sign Out</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="eyebrow opacity-70">Sign In</Link>
          )}
          <span className="eyebrow opacity-60">EN · EUR</span>
        </div>
      </div>
    </header>
  );
}
