'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { getOrders, getOrderById, updateOrderStatus } from '@/lib/firebase-db';
import type { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

function OrderDetailsContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      if (orderIdParam) {
        const data = await getOrderById(orderIdParam);
        if (data) {
          setOrder(data);
          setLoading(false);
          return;
        }
      }

      // If no ID specified or not found, grab latest order
      const allOrders = await getOrders();
      if (allOrders.length > 0) {
        setOrder(allOrders[0]);
      }
      setLoading(false);
    }
    loadOrder();
  }, [orderIdParam]);

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!order) return;
    try {
      await updateOrderStatus(order.id, newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      setToast(`Status updated to ${newStatus}.`);
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast('Failed to update status.');
    }
  };

  const getStatusStepClass = (stepStatus: string) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIdx = steps.indexOf(order?.status || 'pending');
    const stepIdx = steps.indexOf(stepStatus);

    if (order?.status === 'cancelled') return 'text-body-tertiary';
    if (stepIdx <= currentIdx) return 'text-success fw-bold';
    return 'text-body-tertiary';
  };

  return (
    <div className="content">
          {/* Mobile back link */}
          <div className="d-lg-none mb-3">
            <Link href="/admin/orders" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Back to Orders</span>
            </Link>
          </div>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading order details...</span>
          </div>
        </div>
      ) : !order ? (
        <div className="text-center py-5">
          <h4 className="text-body-tertiary">No order found</h4>
          <Link href="/admin/orders" className="btn btn-primary btn-sm mt-3">
            Back to Orders
          </Link>
        </div>
      ) : (
        <div className="mb-9">
          {/* Header matching ae() from reference */}
          <div className="d-sm-flex flex-between-center mb-4">
            <div>
              <h2 className="mb-0 text-body-emphasis fw-bolder">
                Order <span>#{order.id.slice(0, 8)}</span>
              </h2>
              <p className="text-body-secondary lh-sm mb-0 mt-1 fs-9">
                Customer:{' '}
                <span className="fw-bold text-body-emphasis">
                  {order.shippingAddress?.name || 'Customer'}
                </span>{' '}
                A Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 mt-3 mt-sm-0">
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm"
                onClick={() => window.print()}
              >
                <span className="fas fa-print me-2"></span>Print invoice
              </button>
              <Link
                href={`/admin/refund?id=${order.id}`}
                className="btn btn-phoenix-danger btn-sm"
              >
                <span className="fas fa-undo me-2"></span>Refund
              </Link>
              <Link href="/admin/orders" className="btn btn-phoenix-primary btn-sm">
                ← Back to orders
              </Link>
            </div>
          </div>

          <div className="row g-5">
            {/* Left Column: Ordered Items, Calculation, Fulfillment Timeline */}
            <div className="col-12 col-xl-8">
              {/* Ordered Products Table */}
              <div className="card border border-translucent rounded-3 mb-4 shadow-sm overflow-hidden">
                <div className="card-header bg-body-tertiary py-3 px-4 border-bottom border-translucent">
                  <h5 className="mb-0 text-body-emphasis">Ordered Items ({order.items?.length || 0})</h5>
                </div>
                <div className="table-responsive">
                  <table className="table fs-9 mb-0 align-middle">
                    <thead className="bg-body-tertiary text-uppercase fs-10">
                      <tr>
                        <th className="ps-4" style={{ width: '60px' }}></th>
                        <th className="ps-3">Product Name</th>
                        <th className="text-end ps-3" style={{ width: '120px' }}>Price</th>
                        <th className="text-center ps-3" style={{ width: '80px' }}>Qty</th>
                        <th className="text-end pe-4" style={{ width: '120px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item, idx) => (
                        <tr key={idx} className="border-bottom border-translucent">
                          <td className="ps-4 py-3">
                            <div
                              className="rounded-2 overflow-hidden bg-body-tertiary border border-translucent d-flex align-items-center justify-content-center"
                              style={{ width: '48px', height: '48px' }}
                            >
                              {item.productImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-100 h-100 object-fit-cover"
                                />
                              ) : (
                                <span className="text-body-tertiary fs-10 fw-bold">CR</span>
                              )}
                            </div>
                          </td>
                          <td className="ps-3 py-3">
                            <p className="mb-0 fw-bold text-body-highlight">{item.productName}</p>
                            <span className="text-body-tertiary fs-10">
                              Variant: {item.color || 'Default'} | Size: {item.size || 'Standard'}
                            </span>
                          </td>
                          <td className="text-end ps-3 py-3 text-body-highlight">
                            {formatPrice(item.price)}
                          </td>
                          <td className="text-center ps-3 py-3 fw-bold">{item.quantity}</td>
                          <td className="text-end pe-4 py-3 fw-bold text-body-highlight">
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation breakdown */}
                <div className="p-4 bg-body-tertiary border-top border-translucent">
                  <div className="d-flex justify-content-between mb-2 fs-9">
                    <span className="text-body-secondary">Subtotal</span>
                    <span className="text-body-highlight fw-semibold">{formatPrice(order.subtotal || order.total)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 fs-9">
                    <span className="text-body-secondary">Shipping charge</span>
                    <span className="text-success fw-semibold">
                      {order.shipping ? formatPrice(order.shipping) : 'Free Shipping'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 fs-9">
                    <span className="text-body-secondary">Taxes</span>
                    <span className="text-body-highlight fw-semibold">Inclusive</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between fs-8">
                    <span className="text-body-emphasis fw-bold">Grand Total</span>
                    <span className="text-primary fw-bolder fs-7">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Timeline Status Tracker */}
              <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                <h5 className="mb-4 text-body-emphasis">Fulfillment Tracking</h5>
                <div className="row g-3 text-center">
                  <div className="col-3">
                    <div className="d-flex flex-column align-items-center">
                      <span className={`fas fa-check-circle fs-5 mb-2 ${getStatusStepClass('pending')}`}></span>
                      <span className="fs-9 fw-bold text-body-emphasis">Order Placed</span>
                      <span className="fs-10 text-body-tertiary">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="d-flex flex-column align-items-center">
                      <span className={`fas fa-cog fs-5 mb-2 ${getStatusStepClass('processing')}`}></span>
                      <span className="fs-9 fw-bold text-body-emphasis">Processing</span>
                      <span className="fs-10 text-body-tertiary">In warehouse</span>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="d-flex flex-column align-items-center">
                      <span className={`fas fa-truck fs-5 mb-2 ${getStatusStepClass('shipped')}`}></span>
                      <span className="fs-9 fw-bold text-body-emphasis">Shipped</span>
                      <span className="fs-10 text-body-tertiary">In transit</span>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="d-flex flex-column align-items-center">
                      <span className={`fas fa-home fs-5 mb-2 ${getStatusStepClass('delivered')}`}></span>
                      <span className="fs-9 fw-bold text-body-emphasis">Delivered</span>
                      <span className="fs-10 text-body-tertiary">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Customer Info, Shipping Address, Status Controller */}
            <div className="col-12 col-xl-4">
              {/* Order Status Controller */}
              <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                <h5 className="mb-3 text-body-emphasis">Manage Order Status</h5>
                <label className="form-label fs-9 text-body-tertiary">Current Status</label>
                <select
                  className="form-select form-select-sm mb-3 text-capitalize fw-bold"
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value as Order['status'])}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className="fs-10 text-body-tertiary">
                  Changes reflect immediately in the customer portal and dashboard.
                </span>
              </div>

              {/* Customer Profile Card */}
              <div className="card border border-translucent rounded-3 p-4 mb-4 shadow-sm">
                <h5 className="mb-3 text-body-emphasis">Customer Details</h5>
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-3"
                    style={{ width: '42px', height: '42px', fontSize: '1rem' }}
                  >
                    {(order.shippingAddress?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h6 className="mb-0 text-body-emphasis fw-bold">
                      {order.shippingAddress?.name || 'Customer'}
                    </h6>
                    <span className="text-body-tertiary fs-9">{order.shippingAddress?.email || '"”'}</span>
                  </div>
                </div>
                <div className="fs-9">
                  <p className="mb-1 text-body-secondary">
                    <span className="fas fa-phone me-2 text-body-tertiary"></span>
                    {order.shippingAddress?.phone || 'Not provided'}
                  </p>
                  <p className="mb-0 text-body-secondary">
                    <span className="fas fa-envelope me-2 text-body-tertiary"></span>
                    {order.shippingAddress?.email || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card border border-translucent rounded-3 p-4 shadow-sm">
                <h5 className="mb-3 text-body-emphasis">Shipping Address</h5>
                <p className="fs-9 text-body-secondary mb-2">
                  <strong className="text-body-emphasis d-block">{order.shippingAddress?.name}</strong>
                  {order.shippingAddress?.line1}
                  <br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                  {order.shippingAddress?.postalCode}
                  <br />
                  {order.shippingAddress?.country || 'India'}
                </p>

                <h6 className="text-body-emphasis fs-9 mt-3 mb-1">Payment Method</h6>
                <p className="fs-9 text-body-secondary mb-0">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Prepaid)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default function AdminOrderDetailsPage() {
  return (
    <AdminGuard>
      <main className="main" id="top">
        <Suspense fallback={<div className="p-5 text-center">Loading...</div>}>
          <OrderDetailsContent />
        </Suspense>
      </main>
    </AdminGuard>
  );
}
