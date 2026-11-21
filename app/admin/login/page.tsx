'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated as admin, or show access denied if logged in as customer
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        setError(`Access denied. The account (${user.email}) is not registered as an administrator.`);
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseConfigured) {
      setError('Firebase credentials are not configured. Please add your Firebase configuration to .env.local.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (
        firebaseErr.code === 'auth/invalid-credential' ||
        firebaseErr.code === 'auth/wrong-password' ||
        firebaseErr.code === 'auth/user-not-found'
      ) {
        setError('Invalid administrator email or password.');
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (firebaseErr.code === 'auth/invalid-api-key' || firebaseErr.code === 'auth/api-key-not-valid') {
        setError('Invalid Firebase API key. Please check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.');
      } else {
        setError(firebaseErr.message || 'Failed to sign in. Please verify your administrator credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    if (!isFirebaseConfigured) {
      setError('Firebase credentials are not configured.');
      return;
    }

    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      console.error('Google Admin Sign In Error:', err);
      if (firebaseErr.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled.');
      } else if (firebaseErr.code === 'auth/popup-blocked') {
        setError('Sign in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(firebaseErr.message || 'Failed to sign in with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-body-tertiary min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row flex-center position-relative w-100 g-0" style={{ maxWidth: '1000px' }}>
        <div className="col-12">
          <div className="card border border-translucent auth-card shadow-lg">
            <div className="card-body pe-md-0 p-0">
              <div className="row align-items-center gx-0 gy-7">
                {/* Left Brand Banner */}
                <div className="col-12 col-md-5 bg-body-highlight rounded-3 position-relative overflow-hidden p-5 d-flex flex-column justify-content-between h-100">
                  <div>
                    <div className="d-flex align-items-center mb-4">
                      <span className="badge bg-primary text-white p-2 rounded-2 fs-8 fw-bold tracking-wider me-2">CR</span>
                      <h4 className="mb-0 fw-bold">CALVIER ROSSEL</h4>
                    </div>
                    <h3 className="mb-3 text-body-emphasis fs-7">Admin Portal</h3>
                    <p className="text-body-tertiary fs-9 mb-4">
                      Administrative control center for products, fulfillment, team access, and customer orders.
                    </p>
                    <ul className="list-unstyled mb-0">
                      <li className="d-flex align-items-center mb-2">
                        <span className="fas fa-check-circle text-success me-2"></span>
                        <span className="text-body-tertiary fw-semibold fs-9">
                          Role-Based Access Control
                        </span>
                      </li>
                      <li className="d-flex align-items-center mb-2">
                        <span className="fas fa-check-circle text-success me-2"></span>
                        <span className="text-body-tertiary fw-semibold fs-9">
                          Real-time Order Fulfillment
                        </span>
                      </li>
                      <li className="d-flex align-items-center">
                        <span className="fas fa-check-circle text-success me-2"></span>
                        <span className="text-body-tertiary fw-semibold fs-9">
                          Dynamic Catalog &amp; Media Uploads
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 text-center d-none d-md-block py-4">
                    <Shield size={64} className="text-primary opacity-50 mb-2" />
                    <p className="text-body-tertiary fs-10 mb-0">Secure Atelier Access</p>
                  </div>
                </div>

                {/* Right Form Box */}
                <div className="col-12 col-md-7 p-4 p-md-6">
                  <div className="text-center mb-4">
                    <h3 className="text-body-highlight">Administrator Sign In</h3>
                    <p className="text-body-tertiary fs-9">Access authorized store management dashboard</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-4 fs-9" role="alert">
                      <span className="fas fa-exclamation-triangle me-2 shrink-0"></span>
                      <div>{error}</div>
                    </div>
                  )}

                  {/* 1-Click Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="btn btn-outline-secondary w-100 mb-4 py-2.5 d-flex align-items-center justify-content-center gap-2 fs-9 fw-semibold shadow-sm"
                  >
                    {googleLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 me-1" width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  <div className="position-relative mb-4 text-center">
                    <hr className="bg-200" />
                    <div className="divider-content-center bg-body-emphasis px-2 fs-10 text-body-tertiary">
                      or sign in with credentials
                    </div>
                  </div>

                  <form onSubmit={handleLogin}>
                    <div className="mb-3 text-start">
                      <label className="form-label fs-9 fw-bold" htmlFor="admin-email">
                        Email address
                      </label>
                      <input
                        className="form-control"
                        id="admin-email"
                        type="email"
                        required
                        placeholder="admin@calvier-rossel.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="mb-4 text-start">
                      <label className="form-label fs-9 fw-bold" htmlFor="admin-password">
                        Password
                      </label>
                      <input
                        className="form-control"
                        id="admin-password"
                        type="password"
                        required
                        placeholder="AAAAAAAA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn btn-primary w-100 mb-3 py-2 fs-9 fw-bold"
                      type="submit"
                      disabled={loading || googleLoading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Verifying...
                        </>
                      ) : (
                        'Secure Sign In'
                      )}
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <Link href="/" className="fs-9 fw-semibold text-decoration-none">
                      ← Return to Customer Store
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
