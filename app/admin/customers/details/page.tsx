'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getAdminCustomers, type AdminCustomer } from '@/lib/firebase-db';
import { formatPrice, formatDate } from '@/lib/utils';

function CustomerDetailsContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const all = await getAdminCustomers();
      if (emailParam) {
        const found = all.find((c) => c.email.toLowerCase() === emailParam.toLowerCase());
        if (found) {
          setCustomer(found);
          setLoading(false);
          return;
        }
      }
      if (all.length > 0) {
        setCustomer(all[0]);
      }
      setLoading(false);
    }
    load();
  }, [emailParam]);

  const initial = (customer?.name || 'Customer').charAt(0).toUpperCase();

  return (
    <div className="content">
          {/* Mobile back link */}
          <div className="d-lg-none mb-3">
            <Link href="/admin/customers" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Back to Customers</span>
            </Link>
          </div>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading customer details...</span>
          </div>
        </div>
      ) : !customer ? (
        <div className="text-center py-5">
          <h4 className="text-body-tertiary">No customer details available</h4>
          <Link href="/admin/customers" className="btn btn-primary btn-sm mt-3">
            Back to Customers
          </Link>
        </div>
      ) : (
        <div className="mb-9">
          {/* Header matching w() from reference */}
          <div className="d-sm-flex flex-between-center mb-4">
            <div>
              <h2 className="mb-0 text-body-emphasis fw-bolder">Customer details</h2>
              <p className="text-body-secondary fs-9 mb-0 mt-1">
                Customer ID: #{customer.id.slice(0, 8)}
              </p>
            </div>
            <div className="mt-3 mt-sm-0">
              <Link href="/admin/customers" className="btn btn-phoenix-secondary btn-sm">
                ← Back to customers
              </Link>
            </div>
          </div>

          <div className="row g-5">
            {/* Left Column: Customer Profile & Order History */}
            <div className="col-12 col-xl-8">
              {/* Profile Card */}
              <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                <div className="d-flex align-items-center mb-4">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-3 flex-shrink-0"
                    style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}
                  >
                    {initial}
                  </div>
                  <div>
                    <h4 className="mb-1 text-body-emphasis">{customer.name}</h4>
                    <p className="mb-1 text-body-secondary fs-9">
                      <span className="fas fa-envelope me-2 text-body-tertiary"></span>
                      {customer.email}
                    </p>
                    <p className="mb-0 text-body-secondary fs-9">
                      <span className="fas fa-map-marker-alt me-2 text-body-tertiary"></span>
                      {customer.city}
                    </p>
                  </div>
                </div>

                <div className="row g-3 text-center border-top border-translucent pt-3">
                  <div className="col-6 border-end border-translucent">
                    <span className="text-body-tertiary fs-10 text-uppercase fw-bold">Total Orders</span>
                    <h3 className="mb-0 text-body-highlight fw-bold">{customer.totalOrders}</h3>
                  </div>
                  <div className="col-6">
                    <span className="text-body-tertiary fs-10 text-uppercase fw-bold">Total Spent</span>
                    <h3 className="mb-0 text-primary fw-bold">{formatPrice(customer.totalSpent)}</h3>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="card border border-translucent rounded-3 overflow-hidden shadow-sm">
                <div className="card-header bg-body-tertiary py-3 px-4 border-bottom border-translucent">
                  <h5 className="mb-0 text-body-emphasis">Order History ({customer.orders.length})</h5>
                </div>
                <div className="table-responsive">
                  <table className="table fs-9 mb-0 align-middle">
                    <thead className="bg-body-tertiary">
                      <tr>
                        <th className="ps-4 py-3">ORDER</th>
                        <th className="ps-3 py-3">DATE</th>
                        <th className="ps-3 py-3">ITEMS</th>
                        <th className="text-end ps-3 py-3">TOTAL</th>
                        <th className="text-center ps-3 pe-4 py-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((ord) => (
                        <tr key={ord.id} className="border-bottom border-translucent">
                          <td className="ps-4 py-3">
                            <Link
                              className="fw-bold font-monospace text-primary text-decoration-none"
                              href={`/admin/orders/details?id=${ord.id}`}
                            >
                              #{ord.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="ps-3 py-3 text-body-tertiary">
                            {formatDate(ord.createdAt)}
                          </td>
                          <td className="ps-3 py-3 text-body-secondary">
                            {ord.items?.length || 1} items
                          </td>
                          <td className="text-end ps-3 py-3 fw-bold text-body-highlight">
                            {formatPrice(ord.total)}
                          </td>
                          <td className="text-center ps-3 pe-4 py-3">
                            <span
                              className={`badge badge-phoenix fs-10 ${
                                ord.status === 'delivered'
                                  ? 'badge-phoenix-success'
                                  : ord.status === 'cancelled'
                                  ? 'badge-phoenix-danger'
                                  : 'badge-phoenix-warning'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Notes & Contact Information */}
            <div className="col-12 col-xl-4">
              <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                <h5 className="mb-3 text-body-emphasis">Contact Information</h5>
                <p className="fs-9 text-body-secondary mb-2">
                  <strong className="text-body-emphasis d-block">Full Name:</strong>
                  {customer.name}
                </p>
                <p className="fs-9 text-body-secondary mb-2">
                  <strong className="text-body-emphasis d-block">Email Address:</strong>
                  {customer.email}
                </p>
                <p className="fs-9 text-body-secondary mb-2">
                  <strong className="text-body-emphasis d-block">City / Region:</strong>
                  {customer.city}
                </p>
                <p className="fs-9 text-body-secondary mb-0">
                  <strong className="text-body-emphasis d-block">Last Order Placed:</strong>
                  {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : '"”'}
                </p>
              </div>

              <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                <h5 className="mb-3 text-body-emphasis">Customer Notes</h5>
                <p className="fs-9 text-body-tertiary mb-0">
                  Verified customer profile registered with store orders and fulfillment history.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomerDetailsPage() {
  return (
    <AdminGuard>
      <main className="main" id="top">
        <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
          <CustomerDetailsContent />
        </Suspense>
      </main>
    </AdminGuard>
  );
}
