'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth context will catch the state change and redirect via the useEffect
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      
      if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#c9a96e] opacity-[0.03] blur-[100px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white opacity-[0.02] blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-white/10 bg-white/5 mb-6 rounded-full shadow-[0_0_30px_rgba(201,169,110,0.1)]">
            <Lock size={24} className="text-[#c9a96e]" />
          </div>
          <h1 className="font-serif text-3xl font-light mb-2">Admin Portal</h1>
          <p className="text-white/40 text-sm tracking-wide">Sign in to manage Calvier Rossel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 bg-[#111] border border-white/10 p-8 shadow-2xl">
          <div>
            <label className="text-white/50 text-[10px] tracking-[0.2em] uppercase mb-2 block">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={16} className="text-white/30" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white py-3 pl-11 pr-4 focus:outline-none focus:border-[#c9a96e] transition-colors"
                placeholder="admin@calvier-rossel.com"
              />
            </div>
          </div>

          <div>
            <label className="text-white/50 text-[10px] tracking-[0.2em] uppercase mb-2 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ShieldCheck size={16} className="text-white/30" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white py-3 pl-11 pr-4 focus:outline-none focus:border-[#c9a96e] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-900/50 text-red-400 p-3 text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a96e] text-[#080808] py-4 text-[11px] tracking-[0.25em] uppercase font-semibold hover:bg-white transition-colors duration-300 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Secure Sign In <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-white/30 hover:text-white text-[10px] tracking-[0.2em] uppercase transition-colors">
            ← Return to Store
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
