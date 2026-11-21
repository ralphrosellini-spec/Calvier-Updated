'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { subscribeToOrders, updateOrderStatus, deleteOrder } from '@/lib/firebase-db';
import type { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setOrders(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let list = [...orders];

    // Tab filter
    if (activeTab === 'pending') {
      list = list.filter((o) => o.status === 'pending');
    } else if (activeTab === 'processing') {
      list = list.filter((o) => o.status === 'processing' || o.status === 'shipped');
    } else if (activeTab === 'completed') {
      list = list.filter((o) => o.status === 'delivered');
    } else if (activeTab === 'cancelled') {
      list = list.filter((o) => o.status === 'cancelled');
    } else if (activeTab === 'refunded') {
      list = list.filter((o) => (o.status as string) === 'refunded');
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.shippingAddress?.name || '').toLowerCase().includes(q) ||
          (o.shippingAddress?.email || '').toLowerCase().includes(q) ||
          (o.shippingAddress?.city || '').toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [orders, activeTab, search]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToastMsg(`Order #${orderId.slice(0, 8)} marked as ${newStatus}.`);
    } catch {
      showToastMsg('Failed to update order status.');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrder(orderId);
      showToastMsg('Order removed.');
    } catch {
      showToastMsg('Failed to delete order.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status badges
  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return { cls: 'badge-phoenix-success', label: 'Delivered' };
      case 'processing':
        return { cls: 'badge-phoenix-warning', label: 'Processing' };
      case 'shipped':
        return { cls: 'badge-phoenix-info', label: 'Shipped' };
      case 'cancelled':
        return { cls: 'badge-phoenix-danger', label: 'Cancelled' };
      case 'refunded':
        return { cls: 'badge-phoenix-secondary', label: 'Refunded' };
      default:
        return { cls: 'badge-phoenix-secondary', label: 'Pending' };
    }
  };

  // Counts
  const allCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing' || o.status === 'shipped').length;
  const completedCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

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
            <div className="row g-3 mb-4 align-items-center">
              <div className="col-auto">
                <h2 className="mb-0 text-body-emphasis fw-bolder">Orders</h2>
              </div>
            </div>

            {/* Status Navigation Tabs matching oe() from reference */}
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
                    activeTab === 'pending'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending payment <span className="text-body-quaternary fw-normal">({pendingCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'processing'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('processing')}
                >
                  Processing / Shipped <span className="text-body-quaternary fw-normal">({processingCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'completed'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('completed')}
                >
                  Completed <span className="text-body-quaternary fw-normal">({completedCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'cancelled'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('cancelled')}
                >
                  Cancelled <span className="text-body-quaternary fw-normal">({cancelledCount})</span>
                </button>
              </li>
            </ul>

            {/* Filter Bar */}
            <div className="card border border-translucent rounded-3 mb-4 shadow-sm">
              <div className="card-body p-3">
                <div className="row g-3 justify-content-between align-items-center">
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2">
                    <div className="search-box position-relative" style={{ width: '22rem' }}>
                      <input
                        className="form-control form-control-sm rounded-pill ps-5 bg-body-tertiary"
                        type="search"
                        placeholder="Search by order ID, customer name, email..."
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

            {/* Orders Table matching Phoenix oe() */}
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
                      <th className="pe-3 py-3" style={{ width: '110px' }}>
                        ORDER
                      </th>
                      <th className="text-end pe-3 py-3" style={{ width: '100px' }}>
                        TOTAL
                      </th>
                      <th className="ps-4 py-3" style={{ minWidth: '220px' }}>
                        CUSTOMER
                      </th>
                      <th className="pe-3 py-3" style={{ width: '140px' }}>
                        PAYMENT STATUS
                      </th>
                      <th className="pe-3 py-3" style={{ width: '160px' }}>
                        FULFILMENT STATUS
                      </th>
                      <th className="py-3" style={{ width: '160px' }}>
                        DELIVERY TYPE
                      </th>
                      <th className="text-end pe-4 py-3" style={{ width: '120px' }}>
                        DATE
                      </th>
                      <th className="text-end pe-3 py-3" style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody className="list">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading orders...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5 text-body-tertiary">
                          No orders found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((order) => {
                        const isSelected = selectedIds.includes(order.id);
                        const fulfillment = getFulfillmentBadge(order.status);
                        const customerName = order.shippingAddress?.name || 'Customer';
                        const customerEmail = order.shippingAddress?.email || '"”';
                        const initial = customerName.charAt(0).toUpperCase();

                        return (
                          <tr key={order.id} className="hover-actions-trigger">
                            <td className="ps-3 py-3">
                              <div className="form-check mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(order.id)}
                                />
                              </div>
                            </td>
                            <td className="pe-3 py-3">
                              <Link
                                className="fw-bold font-monospace text-primary text-decoration-none hover-underline"
                                href={`/admin/orders/details?id=${order.id}`}
                              >
                                #{order.id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="text-end pe-3 py-3 fw-bold text-body-highlight">
                              {formatPrice(order.total)}
                            </td>
                            <td className="ps-4 py-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-2 flex-shrink-0"
                                  style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                                >
                                  {initial}
                                </div>
                                <div className="overflow-hidden">
                                  <Link
                                    href={`/admin/orders/details?id=${order.id}`}
                                    className="mb-0 fw-semibold text-body-emphasis text-decoration-none d-block text-truncate"
                                  >
                                    {customerName}
                                  </Link>
                                  <span className="text-body-tertiary fs-10 text-truncate d-block">
                                    {customerEmail}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="pe-3 py-3">
                              <span
                                className={`badge badge-phoenix fs-10 ${
                                  order.paymentMethod === 'cod'
                                    ? 'badge-phoenix-warning'
                                    : 'badge-phoenix-success'
                                }`}
                              >
                                {order.paymentMethod === 'cod' ? 'Pending (COD)' : 'Paid Online'}
                              </span>
                            </td>
                            <td className="pe-3 py-3">
                              <select
                                className={`form-select form-select-sm badge badge-phoenix ${fulfillment.cls} fs-10 fw-bold border-0 py-1 ps-2 pe-4`}
                                style={{ width: 'auto', display: 'inline-block', cursor: 'pointer' }}
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusChange(order.id, e.target.value as Order['status'])
                                }
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 text-body-secondary fs-9">
                              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Standard Delivery'}
                            </td>
                            <td className="text-end pe-4 py-3 text-body-tertiary fs-10">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="text-end pe-3 py-3">
                              <div className="d-inline-flex gap-1">
                                <Link
                                  href={`/admin/orders/details?id=${order.id}`}
                                  className="btn btn-sm btn-phoenix-primary p-1"
                                  title="View Order Details"
                                >
                                  <span className="fas fa-eye fs-10"></span>
                                </Link>
                                <button
                                  className="btn btn-sm btn-phoenix-danger p-1"
                                  title="Delete order record"
                                  onClick={() => handleDelete(order.id)}
                                >
                                  <span className="fas fa-trash fs-10"></span>
                                </button>
                              </div>
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
                  Showing {filtered.length} of {orders.length} orders
                </span>
                <span className="text-body-tertiary fs-10">Live Firestore Realtime Sync</span>
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
