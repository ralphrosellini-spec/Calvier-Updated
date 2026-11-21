'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserProfile, createOrUpdateUserProfile } from '@/lib/firebase-db';
import { User, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CustomerSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  useEffect(() => {
    if (user?.uid) {
      setDisplayName(user.displayName || '');
      setPhone(user.phoneNumber || '');

      getUserProfile(user.uid)
        .then((profile) => {
          if (profile) {
            if (profile.displayName) setDisplayName(profile.displayName as string);
            if (profile.phoneNumber) setPhone(profile.phoneNumber as string);
            const addrs = (profile.addresses as Array<{ line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; country?: string }>) || [];
            if (addrs.length > 0) {
              const defaultAddr = addrs[0];
              setLine1(defaultAddr.line1 || '');
              setLine2(defaultAddr.line2 || '');
              setCity(defaultAddr.city || '');
              setState(defaultAddr.state || '');
              setPostalCode(defaultAddr.postalCode || '');
              setCountry(defaultAddr.country || 'India');
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    try {
      const address = {
        id: `addr_${Date.now()}`,
        userId: user.uid,
        type: 'home' as const,
        name: displayName || user.email || 'Customer',
        email: user.email || '',
        phone,
        line1,
        line2,
        city,
        state,
        postalCode,
        country,
        isDefault: true,
      };

      await createOrUpdateUserProfile(user.uid, {
        displayName,
        phoneNumber: phone,
        addresses: [address],
      });

      setToast({ msg: 'Profile and delivery address updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch {
      setToast({ msg: 'Failed to update preferences.', type: 'error' });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cr-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-white mb-2">Account Settings</h1>
        <p className="text-white/50 text-sm">Manage your profile details and primary shipping address.</p>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-3 p-4 rounded-sm text-xs border ${
            toast.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/40 border-red-500/40 text-red-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
        {/* Personal Details */}
        <div className="bg-[#111] border border-white/10 p-6 sm:p-8 space-y-5 rounded-sm">
          <div className="flex items-center gap-2 text-cr-gold text-[11px] tracking-[0.2em] uppercase font-semibold border-b border-white/10 pb-3">
            <User size={14} /> Personal Profile
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ralph Rosellini"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/40 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
            />
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-[#111] border border-white/10 p-6 sm:p-8 space-y-5 rounded-sm">
          <div className="flex items-center gap-2 text-cr-gold text-[11px] tracking-[0.2em] uppercase font-semibold border-b border-white/10 pb-3">
            <MapPin size={14} /> Default Delivery Address
          </div>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
              Address Line 1
            </label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Suite, House Number, Street"
              className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Landmark, Apartment or Suite"
              className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-white/50 mb-1.5">
                Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="400001"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-cr-gold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-cr-gold text-cr-black px-8 py-3.5 text-[11px] tracking-[0.25em] uppercase font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}
