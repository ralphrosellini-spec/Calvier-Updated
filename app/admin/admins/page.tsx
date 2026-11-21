'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  subscribeToAdmins,
  addAdminEmail,
  removeAdminEmail,
  MASTER_ADMIN_EMAIL,
  isMasterAdminEmail,
  type AdminUser,
} from '@/lib/firebase-db';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import { Shield, ShieldAlert, UserPlus, Trash2, CheckCircle2, AlertCircle, Search, Lock } from 'lucide-react';

export default function AdminManagementPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'manager'>('admin');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal / Confirm Delete
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAdmins((data) => {
      setAdmins(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredAdmins(admins);
    } else {
      const q = search.toLowerCase();
      setFilteredAdmins(
        admins.filter(
          (a) =>
            a.email.toLowerCase().includes(q) ||
            (a.name && a.name.toLowerCase().includes(q)) ||
            a.role.toLowerCase().includes(q)
        )
      );
    }
  }, [search, admins]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid administrator email address.', 'error');
      return;
    }

    // Check if already in list
    if (admins.some((a) => a.email.toLowerCase() === cleanEmail)) {
      showToast('This email is already an active administrator.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addAdminEmail(
        cleanEmail,
        role,
        name.trim() || cleanEmail.split('@')[0],
        user?.email || 'Admin'
      );
      showToast(`Admin privileges successfully granted to ${cleanEmail}`, 'success');
      setEmail('');
      setName('');
      setRole('admin');
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to add administrator', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!deleteTarget) return;

    if (isMasterAdminEmail(deleteTarget.email)) {
      showToast('The Master Administrator account cannot be revoked.', 'error');
      setDeleteTarget(null);
      return;
    }

    try {
      await removeAdminEmail(deleteTarget.email);
      showToast(`Admin access revoked for ${deleteTarget.email}`, 'success');
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to revoke administrator access', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const getRoleBadge = (admin: AdminUser) => {
    if (admin.isMaster || admin.role === 'master_admin') {
      return <span className="badge badge-phoenix fs-10 badge-phoenix-warning text-uppercase"><Lock size={10} className="me-1 inline" /> Master Admin</span>;
    }
    if (admin.role === 'super_admin') {
      return <span className="badge badge-phoenix fs-10 badge-phoenix-primary text-uppercase">Super Admin</span>;
    }
    if (admin.role === 'manager') {
      return <span className="badge badge-phoenix fs-10 badge-phoenix-info text-uppercase">Catalog Manager</span>;
    }
    return <span className="badge badge-phoenix fs-10 badge-phoenix-secondary text-uppercase">Administrator</span>;
  };

  return (
    <AdminGuard>
      <div className="content">
        {/* Mobile back link */}
        <div className="d-lg-none mb-3">
          <Link href="/admin" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
            <span className="fas fa-arrow-left fs-10"></span>
            <span className="fs-10">Dashboard</span>
          </Link>
        </div>
        {/* Breadcrumb & Title */}
        <div className="mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
              <li className="breadcrumb-item active">Admins & Team</li>
            </ol>
          </nav>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h2 className="text-body-emphasis fw-bolder mb-1">Administrators & Access Control</h2>
              <p className="text-body-tertiary fs-9 mb-0">
                Manage authorized administrator emails. Anyone added here can sign in and access the Calvier Rossel Admin Portal.
              </p>
            </div>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div
            className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center py-2 px-3 mb-4 shadow-sm`}
            role="alert"
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} className="me-2 shrink-0" /> : <AlertCircle size={16} className="me-2 shrink-0" />}
            <span className="fs-9 fw-semibold">{toast.message}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-md-4">
            <div className="card h-100 border border-translucent">
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle bg-primary-subtle text-primary p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{admins.length}</h4>
                  <p className="fs-10 text-body-tertiary text-uppercase mb-0">Total Authorized Admins</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <div className="card h-100 border border-translucent">
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle bg-warning-subtle text-warning p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <Lock size={22} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '200px' }}>{MASTER_ADMIN_EMAIL}</h6>
                  <p className="fs-10 text-body-tertiary text-uppercase mb-0">Permanent Master Admin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4">
            <div className="card h-100 border border-translucent">
              <div className="card-body p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{admins.filter(a => a.active).length}</h4>
                  <p className="fs-10 text-body-tertiary text-uppercase mb-0">Active Permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Add Admin Form Card */}
          <div className="col-12 col-xl-4">
            <div className="card border border-translucent shadow-sm h-100">
              <div className="card-header border-bottom border-translucent p-3">
                <div className="d-flex align-items-center gap-2">
                  <UserPlus size={18} className="text-primary" />
                  <h5 className="mb-0 text-body-emphasis">Add Administrator</h5>
                </div>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleAddAdmin}>
                  <div className="mb-3">
                    <label className="form-label fs-9 fw-bold" htmlFor="admin-email-input">
                      Administrator Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="admin-email-input"
                      className="form-control"
                      placeholder="e.g. colleague@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <small className="text-body-tertiary fs-10 mt-1 d-block">
                      When this user logs in with Google or Email, they will automatically see the Admin Panel.
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-9 fw-bold" htmlFor="admin-name-input">
                      Full Name or Role Title
                    </label>
                    <input
                      type="text"
                      id="admin-name-input"
                      className="form-control"
                      placeholder="e.g. Store Manager"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fs-9 fw-bold" htmlFor="admin-role-select">
                      Access Role
                    </label>
                    <select
                      id="admin-role-select"
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'super_admin' | 'admin' | 'manager')}
                    >
                      <option value="admin">Administrator (Orders, Products, Customers)</option>
                      <option value="super_admin">Super Administrator (Full System Access)</option>
                      <option value="manager">Catalog Manager (Products & Content Only)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-100 py-2 d-flex align-items-center justify-center gap-2 fs-9 fw-bold"
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Grant Admin Access
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 p-3 bg-body-tertiary rounded-2 border border-translucent">
                  <div className="d-flex align-items-start gap-2">
                    <ShieldAlert size={16} className="text-warning shrink-0 mt-0.5" />
                    <p className="fs-10 text-body-tertiary mb-0 leading-relaxed">
                      <strong>Security Note:</strong> Only grant access to trusted team members. Non-admins cannot see the Admin Panel link in the customer store and will be rejected by security guards if navigating to <code>/admin</code> directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Administrators Table */}
          <div className="col-12 col-xl-8">
            <div className="card border border-translucent shadow-sm">
              <div className="card-header border-bottom border-translucent p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <Shield size={18} className="text-primary" />
                  <h5 className="mb-0 text-body-emphasis">Active Administrators</h5>
                </div>

                <div className="position-relative" style={{ maxWidth: '260px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm pe-4"
                    placeholder="Search admins..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search size={14} className="position-absolute end-0 top-50 translate-middle-y me-2 text-body-tertiary" />
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm fs-9 mb-0 align-middle">
                    <thead>
                      <tr className="bg-body-highlight text-body-tertiary text-uppercase fs-10">
                        <th className="py-3 px-3">Administrator</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Authorized On</th>
                        <th className="py-3 px-3 text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-translucent">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                            Loading administrators...
                          </td>
                        </tr>
                      ) : filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-body-tertiary">
                            No administrators found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredAdmins.map((admin) => {
                          const isMaster = admin.isMaster || isMasterAdminEmail(admin.email);
                          const initial = (admin.name || admin.email).charAt(0).toUpperCase();

                          return (
                            <tr key={admin.id} className="hover-bg-body-tertiary transition-colors">
                              <td className="py-3 px-3">
                                <div className="d-flex align-items-center gap-2.5">
                                  <div
                                    className={`rounded-circle d-flex align-items-center justify-content-center fw-bold fs-9 text-white shrink-0 ${
                                      isMaster ? 'bg-warning' : 'bg-primary'
                                    }`}
                                    style={{ width: '34px', height: '34px' }}
                                  >
                                    {initial}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="mb-0 fw-bold text-body-emphasis text-truncate">
                                      {admin.name || admin.email.split('@')[0]}
                                    </p>
                                    <p className="mb-0 text-body-tertiary fs-10 font-mono text-truncate">
                                      {admin.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                {getRoleBadge(admin)}
                              </td>
                              <td className="py-3 px-3">
                                <span className="badge badge-phoenix badge-phoenix-success fs-10">Active</span>
                              </td>
                              <td className="py-3 px-3 text-body-tertiary">
                                {formatDate(admin.addedAt)}
                              </td>
                              <td className="py-3 px-3 text-end">
                                {isMaster ? (
                                  <span className="badge badge-phoenix fs-10 badge-phoenix-secondary" title="Master admin cannot be deleted">
                                    <Lock size={11} className="me-1 inline" /> Protected
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setDeleteTarget(admin)}
                                    className="btn btn-sm btn-outline-danger py-1 px-2.5 fs-10 d-inline-flex align-items-center gap-1"
                                    title="Revoke admin access"
                                  >
                                    <Trash2 size={12} />
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revoke Confirmation Modal */}
        {deleteTarget && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border border-translucent shadow-lg">
                <div className="modal-header border-bottom border-translucent">
                  <h5 className="modal-title text-danger d-flex align-items-center gap-2">
                    <AlertCircle size={18} /> Revoke Administrator Access
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDeleteTarget(null)}
                  />
                </div>
                <div className="modal-body py-4">
                  <p className="mb-2 text-body">
                    Are you sure you want to revoke admin privileges for:
                  </p>
                  <p className="fw-bold font-mono text-body-emphasis mb-3 bg-body-tertiary p-2 rounded">
                    {deleteTarget.email}
                  </p>
                  <p className="text-body-tertiary fs-9 mb-0">
                    This user will immediately lose access to the Admin Portal and will only be able to view customer-facing pages.
                  </p>
                </div>
                <div className="modal-footer border-top border-translucent">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleRevoke}
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
