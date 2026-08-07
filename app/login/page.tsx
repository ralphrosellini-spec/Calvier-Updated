/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { LogIn } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // Optional: Ask for specific scopes if needed
      // provider.addScope('profile');
      // provider.addScope('email');
      
      await signInWithPopup(auth, provider);
      // Success! The useEffect will automatically catch the user state change and redirect.
    } catch (err: any) {
      console.error('[Google Sign-In Error]:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please add localhost to Firebase Auth authorized domains.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-16">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/hero-1.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/80 to-ink/40" />
        <div className="relative z-10">
          <Link href="/" className="font-display text-2xl tracking-[0.35em]">
            CALVIER ROSSEL
          </Link>
          <p className="eyebrow text-cream/50 mt-2">Maison · Est. 1926</p>
        </div>
        <div className="relative z-10">
          <p className="font-display italic text-5xl leading-tight text-cream/90">
            &quot;Quiet luxury<br />begins with<br />knowing who you are.&quot;
          </p>
          <p className="eyebrow text-cream/40 mt-6">— The Atelier Journal</p>
        </div>
        <div className="relative z-10 flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-px flex-1 bg-cream/20" />
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <Link href="/" className="font-display text-2xl tracking-[0.35em]">
              CALVIER ROSSEL
            </Link>
            <p className="eyebrow text-cream/50 mt-1">Maison · Est. 1926</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="social-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="mb-10 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 border border-cream/20 mb-6">
                  <LogIn size={20} className="text-gold" />
                </div>
                <h1 className="font-display text-4xl text-cream">Welcome Back</h1>
                <p className="text-cream/50 text-sm mt-3 leading-relaxed">
                  Sign in with your Google account to access your personal Maison.
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 px-4 py-3 mb-6">
                  {error}
                </p>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-black py-4 px-6 flex items-center justify-center gap-4 hover:bg-gray-100 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {/* Google SVG Icon */}
                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span className="font-medium tracking-wide">Continue with Google</span>
                  </>
                )}
              </button>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-cream/10"></div>
                <span className="text-cream/30 text-xs tracking-widest uppercase">Secure Login</span>
                <div className="flex-1 h-px bg-cream/10"></div>
              </div>

              <p className="text-cream/30 text-xs text-center mt-8 leading-relaxed">
                By continuing, you agree to our{' '}
                <Link href="/" className="text-cream/60 hover:text-gold transition-colors underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/" className="text-cream/60 hover:text-gold transition-colors underline">Privacy Policy</Link>.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-cream">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
