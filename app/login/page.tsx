/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Phone, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

type Step = 'phone' | 'otp';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Cleanup on unmount to prevent duplicate reCAPTCHA instances
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore clear errors on unmount
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      // Initialize reCAPTCHA on demand if it doesn't exist
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal' // changed to normal to show potential domain errors on the widget
        });
        // WAIT for recaptcha to initialize to avoid "Enterprise config" race conditions
        await window.recaptchaVerifier.render();
      }

      const phoneNumber = `+91${cleaned.slice(-10)}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmation(result);
      setStep('otp');
      setResendTimer(30);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please try again.');
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
      console.error(err);
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setError('');

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await confirmation.confirm(code);
      router.push(redirectTo);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else if (firebaseErr.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    setStep('phone');
    setConfirmation(null);
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).recaptchaVerifier = null;
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
            "Quiet luxury<br />begins with<br />knowing who you are."
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
        {/* Recaptcha container — invisible */}
        <div ref={recaptchaContainerRef} id="recaptcha-container" />

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <Link href="/" className="font-display text-2xl tracking-[0.35em]">
              CALVIER ROSSEL
            </Link>
            <p className="eyebrow text-cream/50 mt-1">Maison · Est. 1926</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 border border-cream/20 mb-6">
                    <Phone size={20} className="text-gold" />
                  </div>
                  <h1 className="font-display text-4xl text-cream">Sign In</h1>
                  <p className="text-cream/50 text-sm mt-3 leading-relaxed">
                    Enter your mobile number. We&apos;ll send a one-time password to verify your identity.
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div>
                    <label className="eyebrow text-cream/40 block mb-3">
                      Mobile Number
                    </label>
                    <div className="flex border border-cream/20 focus-within:border-gold transition-colors duration-300">
                      <div className="flex items-center px-4 border-r border-cream/20 bg-cream/5">
                        <img src="https://flagcdn.com/w20/in.png" alt="IN" className="w-5 h-auto mr-2" />
                        <span className="text-cream/70 text-sm font-mono">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        maxLength={10}
                        className="flex-1 bg-transparent text-cream placeholder:text-cream/30 px-4 py-4 text-lg font-mono tracking-widest outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full bg-gold text-ink py-4 eyebrow flex items-center justify-center gap-3 hover:bg-cream transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Send OTP <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <p className="text-cream/30 text-xs text-center mt-8 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <Link href="/" className="text-cream/60 underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/" className="text-cream/60 underline">Privacy Policy</Link>.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <button
                  onClick={() => {
                    setStep('phone');
                    setError('');
                    // Clear recaptcha so it can be re-initialized on next send
                    if (window.recaptchaVerifier) {
                      window.recaptchaVerifier.clear();
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (window as any).recaptchaVerifier = null;
                    }
                  }}
                  className="flex items-center gap-2 text-cream/40 hover:text-cream transition-colors mb-8 eyebrow"
                >
                  <ChevronLeft size={16} /> Back
                </button>

                <div className="mb-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 border border-cream/20 mb-6">
                    <ShieldCheck size={20} className="text-gold" />
                  </div>
                  <h1 className="font-display text-4xl text-cream">Enter OTP</h1>
                  <p className="text-cream/50 text-sm mt-3 leading-relaxed">
                    We sent a 6-digit code to{' '}
                    <span className="text-cream font-mono">+91 {phone}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-8">
                  <div>
                    <label className="eyebrow text-cream/40 block mb-4">
                      Verification Code
                    </label>
                    <div className="flex gap-3 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOTPChange(i, e.target.value)}
                          onKeyDown={e => handleOTPKeyDown(i, e)}
                          className="w-12 h-14 text-center text-cream text-xl font-mono border border-cream/20 bg-cream/5 focus:border-gold focus:outline-none transition-colors duration-300"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full bg-gold text-ink py-4 eyebrow flex items-center justify-center gap-3 hover:bg-cream transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Verify & Sign In <ShieldCheck size={16} /></>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  {resendTimer > 0 ? (
                    <p className="eyebrow text-cream/30">
                      Resend OTP in {resendTimer}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="eyebrow text-cream/50 hover:text-gold transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            )}
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
