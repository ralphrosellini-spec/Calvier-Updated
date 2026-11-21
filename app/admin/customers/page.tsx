'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminCustomers, type AdminCustomer } from '@/lib/firebase-db';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [filtered, setFiltered] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'repeat'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await getAdminCustomers();
      setCustomers(list);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let list = [...customers];

    if (activeTab === 'new') {
      list = list.filter((c) => c.totalOrders === 1);
    } else if (activeTab === 'repeat') {
      list = list.filter((c) => c.totalOrders > 1);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [customers, activeTab, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allCount = customers.length;
  const newCount = customers.filter((c) => c.totalOrders === 1).length;
  const repeatCount = customers.filter((c) => c.totalOrders > 1).length;

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
            {/* Header */}
            <div className="row g-2 mb-4 align-items-center">
              <div className="col-auto">
                <h2 className="mb-0 text-body-emphasis fw-bolder">Customers</h2>
              </div>
            </div>

            {/* Tabs matching ie() from reference */}
            <ul className="nav nav-links mb-3 mb-lg-4 mx-n3 flex-row gap-3">
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'all'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('all')}
                >
                  All <span className="text-body-quaternary fw-normal">({allCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'new'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('new')}
                >
                  New customers <span className="text-body-quaternary fw-normal">({newCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'repeat'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('repeat')}
                >
                  Repeat customers <span className="text-body-quaternary fw-normal">({repeatCount})</span>
                </button>
              </li>
            </ul>

            {/* Filter Controls */}
            <div className="card border border-translucent rounded-3 mb-4 shadow-sm">
              <div className="card-body p-3">
                <div className="row g-3 justify-content-between align-items-center">
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2">
                    <div className="search-box position-relative" style={{ width: '22rem' }}>
                      <input
                        className="form-control form-control-sm rounded-pill ps-5 bg-body-tertiary"
                        type="search"
                        placeholder="Search customers by name, email, city..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <span
                        className="fas fa-search position-absolute top-50 translate-middle-y ms-3 text-body-tertiary"
                        style={{ fontSize: '0.8rem' }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers Table matching ie() */}
            <div className="card border border-translucent rounded-3 overflow-hidden shadow-sm">
              <div className="table-responsive scrollbar">
                <table className="table table-sm fs-9 mb-0 align-middle">
                  <thead className="bg-body-tertiary">
                    <tr>
                      <th className="white-space-nowrap ps-3 py-3" style={{ width: '26px' }}>
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                            onChange={toggleSelectAll}
                          />
                        </div>
                      </th>
                      <th className="ps-3 py-3" style={{ minWidth: '200px' }}>
                        CUSTOMER
                      </th>
                      <th className="ps-3 py-3" style={{ minWidth: '220px' }}>
                        EMAIL
                      </th>
                      <th className="text-end ps-3 py-3" style={{ width: '100px' }}>
                        ORDERS
                      </th>
                      <th className="text-end ps-3 py-3" style={{ width: '130px' }}>
                        TOTAL SPENT
                      </th>
                      <th className="ps-4 py-3" style={{ width: '150px' }}>
                        CITY
                      </th>
                      <th className="text-end pe-4 py-3" style={{ width: '140px' }}>
                        LAST ORDER
                      </th>
                      <th className="text-end pe-3 py-3" style={{ width: '80px' }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="list">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading customers...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-body-tertiary">
                          No customers found yet. Customer records are generated when orders are placed.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((customer) => {
                        const isSelected = selectedIds.includes(customer.id);
                        const initial = customer.name.charAt(0).toUpperCase();

                        return (
                          <tr key={customer.id} className="hover-actions-trigger">
                            <td className="ps-3 py-3">
                              <div className="form-check mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(customer.id)}
                                />
                              </div>
                            </td>
                            <td className="ps-3 py-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-2 flex-shrink-0"
                                  style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}
                                >
                                  {initial}
                                </div>
                                <div>
                                  <Link
                                    className="fw-bold text-body-emphasis text-decoration-none hover-text-primary d-block"
                                    href={`/admin/customers/details?email=${encodeURIComponent(
                                      customer.email
                                    )}`}
                                  >
                                    {customer.name}
                                  </Link>
                                  <span className="text-body-tertiary fs-10">
                                    Customer ID: #{customer.id.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="ps-3 py-3 text-body-secondary">{customer.email}</td>
                            <td className="text-end ps-3 py-3 fw-bold text-body-highlight">
                              {customer.totalOrders}
                            </td>
                            <td className="text-end ps-3 py-3 fw-bold text-body-highlight">
                              {formatPrice(customer.totalSpent)}
                            </td>
                            <td className="ps-4 py-3 text-body-secondary">{customer.city}</td>
                            <td className="text-end pe-4 py-3 text-body-tertiary fs-10">
                              {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : '"”'}
                            </td>
                            <td className="text-end pe-3 py-3">
                              <Link
                                href={`/admin/customers/details?email=${encodeURIComponent(
                                  customer.email
                                )}`}
                                className="btn btn-sm btn-phoenix-secondary p-1"
                                title="View Customer Details"
                              >
                                <span className="fas fa-eye fs-10"></span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="card-footer d-flex align-items-center justify-content-between py-2 px-3 bg-body-tertiary">
                <span className="text-body-tertiary fs-10">
                  Showing {filtered.length} of {customers.length} customers
                </span>
                <span className="text-body-tertiary fs-10">Aggregated from Firestore</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
