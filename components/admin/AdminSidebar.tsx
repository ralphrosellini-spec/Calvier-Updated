'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  Users, ShoppingBag, TrendingUp,
  PackageSearch, Settings, LogOut, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';


export function AdminSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', icon: TrendingUp, href: '/admin' },
    { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Products', icon: PackageSearch, href: '/admin/products' },
    { label: 'Site Content', icon: ImageIcon, href: '/admin/content' },
    { label: 'Customers', icon: Users, href: '/admin/customers' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = user?.phoneNumber
    ? user.phoneNumber
    : user?.email ?? 'Admin';

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col hidden lg:flex shrink-0 min-h-[calc(100vh-80px)]">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="font-display text-xl tracking-[0.3em] text-white">
          CALVIER ROSSEL
        </Link>
        <p className="text-[#c9a96e] text-[9px] tracking-widest uppercase mt-1">Admin Portal</p>
      </div>

      {/* Admin user info */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/40 flex items-center justify-center text-[#c9a96e] text-xs font-semibold shrink-0">
          {displayName.slice(-2)}
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-medium truncate">{displayName}</p>
          <p className="text-white/30 text-[10px] tracking-wider">Administrator</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={i}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.2em] uppercase transition-colors rounded-sm ${
                active ? 'bg-[#c9a96e] text-[#080808] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors rounded-sm">
          ← View Store
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.2em] uppercase text-red-500/70 hover:text-red-400 hover:bg-red-900/10 transition-colors rounded-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
