'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [loading, user, router]);

  // Show spinner while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 eyebrow">Verifying access…</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect happening
  if (!user) return null;

  // Logged in but not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="w-16 h-16 border border-red-900 flex items-center justify-center">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-white font-serif text-3xl mb-3">Access Denied</h1>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            You do not have admin privileges. Please sign in with an administrator account to access this area.
          </p>
        </div>
        
        <div className="mt-4 flex flex-col gap-4">
          <Link
            href="/admin/login"
            className="bg-[#c9a96e] text-[#080808] px-8 py-3 text-[11px] tracking-[0.25em] uppercase font-semibold hover:bg-white transition-colors"
          >
            Sign In as Admin
          </Link>
          <Link
            href="/"
            className="text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors"
          >
            ← Return to store
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
