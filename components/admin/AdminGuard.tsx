'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import DashboardNavbars from '@/components/admin/DashboardNavbars';

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
      <div className="min-h-screen d-flex align-items-center justify-content-center"
        style={{ background: '#f5f7fa' }}>
        <div className="d-flex flex-column align-items-center gap-3">
          <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
            <span className="visually-hidden">Verifying access…</span>
          </div>
          <p className="text-body-tertiary fs-9 mb-0">Verifying access…</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect happening
  if (!user) return null;

  // Logged in but not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen d-flex flex-column align-items-center justify-content-center gap-4 text-center px-4"
        style={{ background: '#f5f7fa' }}>
        <div className="rounded-3 border border-danger d-flex align-items-center justify-content-center"
          style={{ width: '64px', height: '64px' }}>
          <ShieldAlert size={28} className="text-danger" />
        </div>
        <div>
          <h2 className="text-body-emphasis fw-bold mb-2">Access Denied</h2>
          <p className="text-body-tertiary fs-9 max-w-xs">
            You do not have admin privileges. Please sign in with an administrator account to access this area.
          </p>
        </div>
        <div className="d-flex flex-column gap-3">
          <Link
            href="/admin/login"
            className="btn btn-primary px-5"
          >
            Sign In as Admin
          </Link>
          <Link
            href="/"
            className="btn btn-link text-body-tertiary text-decoration-none"
          >
            ← Return to store
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated admin — render sidebar + page content together
  return (
    <>
      <DashboardNavbars />
      {children}
    </>
  );
}
