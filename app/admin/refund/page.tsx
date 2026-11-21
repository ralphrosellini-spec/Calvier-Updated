'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getOrders, updateOrderStatus } from '@/lib/firebase-db';
import type { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

function RefundContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('id');
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderIdParam || '');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [reason, setReason] = useState('Customer returned item');
  const [refundStatus, setRefundStatus] = useState<'partial' | 'full'>('full');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data);
      if (!selectedOrderId && data.length > 0) {
        setSelectedOrderId(data[0].id);
        setRefundAmount(data[0].total);
      }
    });
  }, [selectedOrderId]);

  useEffect(() => {
    const matched = orders.find((o) => o.id === selectedOrderId);
    if (matched) {
      setRefundAmount(matched.total);
    }
  }, [selectedOrderId, orders]);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setSaving(true);
    try {
      await updateOrderStatus(selectedOrderId, 'cancelled');
      setToast('Refund processed successfully! Order status updated to cancelled/refunded.');
      setTimeout(() => {
        router.push('/admin/orders');
      }, 1200);
    } catch {
      setToast('Failed to process refund.');
    } finally {
      setSaving(false);
    }
  };

  const currentOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="content">
          {/* Mobile back link */}
          <div className="d-lg-none mb-3">
            <Link href="/admin" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Dashboard</span>
            </Link>
          </div>
      <div className="mb-9">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 text-body-emphasis fw-bolder">Process Refund</h2>
            <p className="text-body-secondary fs-9 mb-0">
              Manage product returns, payment chargebacks, and refund settlements
            </p>
          </div>
          <Link href="/admin/orders" className="btn btn-phoenix-secondary btn-sm">
            ← Back to orders
          </Link>
        </div>

        <div className="row g-5">
          <div className="col-12 col-xl-8">
            <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
              <form onSubmit={handleProcessRefund}>
                <div className="mb-4">
                  <label className="form-label fs-9 fw-bold">Select Order</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id.slice(0, 8)} — {o.shippingAddress?.name || 'Customer'} ({formatPrice(o.total)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-9 fw-bold">Refund Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={refundStatus}
                      onChange={(e) => {
                        const val = e.target.value as 'partial' | 'full';
                        setRefundStatus(val);
                        if (val === 'full' && currentOrder) {
                          setRefundAmount(currentOrder.total);
                        }
                      }}
                    >
                      <option value="full">Full Refund (100%)</option>
                      <option value="partial">Partial Refund</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fs-9 fw-bold">Refund Amount (₹)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      max={currentOrder?.total || 999999}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      disabled={refundStatus === 'full'}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fs-9 fw-bold">Reason for Refund</label>
                  <select
                    className="form-select form-select-sm mb-2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Customer returned item">Customer returned item</option>
                    <option value="Damaged in transit">Damaged in transit</option>
                    <option value="Order cancelled by customer">Order cancelled by customer</option>
                    <option value="Item out of stock">Item out of stock</option>
                    <option value="Other">Other</option>
                  </select>
                  <textarea
                    className="form-control fs-9"
                    rows={3}
                    placeholder="Additional notes for accounting..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={saving || !selectedOrderId}
                >
                  <span className="fas fa-undo me-2"></span>
                  {saving ? 'Processing...' : 'Confirm & Process Refund'}
                </button>
              </form>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="card border border-translucent rounded-3 p-4 shadow-sm">
              <h5 className="mb-3 text-body-emphasis">Order Summary</h5>
              {currentOrder ? (
                <div className="fs-9">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-body-secondary">Order ID:</span>
                    <strong className="text-body-emphasis">#{currentOrder.id.slice(0, 8)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-body-secondary">Customer:</span>
                    <span>{currentOrder.shippingAddress?.name || 'Customer'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-body-secondary">Total Paid:</span>
                    <strong className="text-body-emphasis">{formatPrice(currentOrder.total)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-body-secondary">Current Status:</span>
                    <span className="badge badge-phoenix badge-phoenix-info text-capitalize">
                      {currentOrder.status}
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between text-danger fw-bold">
                    <span>Refund Amount:</span>
                    <span>{formatPrice(refundAmount)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-body-tertiary fs-9 mb-0">No order selected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

export default function AdminRefundPage() {
  return (
    <AdminGuard>
      <main className="main" id="top">
        <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
          <RefundContent />
        </Suspense>
      </main>
    </AdminGuard>
  );
}
