'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAuth } from '@/lib/auth-context';
import { getSiteContent, setSiteContent } from '@/lib/firebase-db';
import { Store, Bell, Shield, Palette } from 'lucide-react';

interface StoreSettings {
  storeName: string;
  currency: string;
  supportEmail: string;
  shippingFee: number;
}

const defaultSettings: StoreSettings = {
  storeName: 'CALVIER ROSSEL',
  currency: 'INR',
  supportEmail: 'support@calvierrossel.com',
  shippingFee: 0,
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getSiteContent('store_settings');
      if (data) {
        setSettings({
          storeName: (data.storeName as string) || defaultSettings.storeName,
          currency: (data.currency as string) || defaultSettings.currency,
          supportEmail: (data.supportEmail as string) || defaultSettings.supportEmail,
          shippingFee: Number(data.shippingFee) || 0,
        });
      }
    }
    load();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await setSiteContent('store_settings', {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      setToast('Store settings saved successfully to Firestore!');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-bs-theme', mode);
    localStorage.setItem('phoenixTheme', mode);
    setToast(`Switched to ${mode} mode.`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <AdminGuard>
      <main className="main" id="top">
        <div className="content">
          {/* Mobile back link */}
          <div className="d-lg-none mb-3">
            <Link href="/admin" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Dashboard</span>
            </Link>
          </div>
          <div className="mb-9">
            <div className="row g-3 mb-6">
              <div className="col-auto">
                <h2 className="mb-0 text-body-emphasis fw-bolder">Settings</h2>
                <p className="text-body-tertiary mt-1 mb-0">Manage your store configuration and preferences</p>
              </div>
            </div>

            <div className="row g-4">
              {/* Account Info */}
              <div className="col-12 col-lg-6">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-header bg-body-tertiary d-flex align-items-center gap-2 py-3 px-4">
                    <Shield size={18} className="text-primary" />
                    <h5 className="mb-0 text-body-emphasis">Account Information</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="mb-4">
                      <label className="form-label fs-9 fw-bold">Admin Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={user?.email ?? ''}
                        readOnly
                        disabled
                      />
                      <p className="form-text text-body-tertiary fs-10 mb-0">Authenticated administrator email.</p>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fs-9 fw-bold">Account UID</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        value={user?.uid ?? ''}
                        readOnly
                        disabled
                        style={{ fontSize: '0.75rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label fs-9 fw-bold">Role & Permissions</label>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <span className="badge badge-phoenix badge-phoenix-primary fs-10">
                          Full Administrator Access
                        </span>
                        <Link href="/admin/admins" className="btn btn-sm btn-subtle-primary py-1 px-2.5 fs-10 fw-bold">
                          Manage Admin Team →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Settings */}
              <div className="col-12 col-lg-6">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-header bg-body-tertiary d-flex align-items-center gap-2 py-3 px-4">
                    <Store size={18} className="text-primary" />
                    <h5 className="mb-0 text-body-emphasis">Store Information</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="mb-3">
                      <label className="form-label fs-9 fw-bold">Store Brand Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={settings.storeName}
                        onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-9 fw-bold">Store Currency</label>
                      <select
                        className="form-select form-select-sm"
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      >
                        <option value="INR">Indian Rupee (₹ INR)</option>
                        <option value="USD">US Dollar ($ USD)</option>
                        <option value="EUR">Euro (€ EUR)</option>
                        <option value="GBP">British Pound (£ GBP)</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-9 fw-bold">Customer Support Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="card-footer bg-body-tertiary border-top border-translucent p-3">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveSettings}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Store Settings'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="col-12 col-lg-6">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-header bg-body-tertiary d-flex align-items-center gap-2 py-3 px-4">
                    <Bell size={18} className="text-primary" />
                    <h5 className="mb-0 text-body-emphasis">Notification Triggers</h5>
                  </div>
                  <div className="card-body p-4">
                    {[
                      { label: 'New order placed', desc: 'Get notified when a customer places an order', defaultChecked: true },
                      { label: 'Low stock alert', desc: 'Alert when product stock goes below threshold', defaultChecked: true },
                      { label: 'New customer registered', desc: 'Alert when a new customer signs up', defaultChecked: false },
                      { label: 'Order delivered', desc: 'Notify when an order status changes to delivered', defaultChecked: true },
                    ].map((item, i) => (
                      <div className={`d-flex justify-content-between align-items-start${i < 3 ? ' mb-4' : ''}`} key={i}>
                        <div>
                          <p className="mb-0 fw-semibold text-body-emphasis fs-9">{item.label}</p>
                          <p className="mb-0 text-body-tertiary fs-10">{item.desc}</p>
                        </div>
                        <div className="form-check form-switch mb-0 ms-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            defaultChecked={item.defaultChecked}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="col-12 col-lg-6">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-header bg-body-tertiary d-flex align-items-center gap-2 py-3 px-4">
                    <Palette size={18} className="text-primary" />
                    <h5 className="mb-0 text-body-emphasis">Admin Theme &amp; Appearance</h5>
                  </div>
                  <div className="card-body p-4">
                    <p className="text-body-secondary fs-9 mb-4">
                      The admin panel is configured with the <strong>Phoenix Bootstrap Admin</strong> design system matching <code>https://caliver-rossel.vercel.app/</code>.
                    </p>
                    <div className="d-flex align-items-center gap-3">
                      <button
                        type="button"
                        className="btn btn-phoenix-secondary btn-sm d-flex align-items-center"
                        onClick={() => setThemeMode('light')}
                      >
                        <span className="fas fa-sun text-warning me-2"></span> Light Mode
                      </button>
                      <button
                        type="button"
                        className="btn btn-phoenix-secondary btn-sm d-flex align-items-center"
                        onClick={() => setThemeMode('dark')}
                      >
                        <span className="fas fa-moon text-primary me-2"></span> Dark Mode
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
            <div className="toast show align-items-center text-bg-dark border-0 shadow-lg" role="alert">
              <div className="d-flex">
                <div className="toast-body fs-9">{toast}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white me-2 m-auto"
                  onClick={() => setToast(null)}
                ></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
