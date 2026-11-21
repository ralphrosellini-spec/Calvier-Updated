'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeToOrders, getProducts } from '@/lib/firebase-db';
import type { Order, Product } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for orders
    const unsubscribe = subscribeToOrders((newOrders) => {
      const sorted = [...newOrders].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setOrders(sorted);
      setLoading(false);
    });

    // Fetch products
    getProducts().then((data) => {
      setProducts(data);
    });

    return () => unsubscribe();
  }, []);

  const totalRevenue = orders.reduce((acc, order) => {
    if (order.status !== 'cancelled') {
      return acc + (Number(order.total) || 0);
    }
    return acc;
  }, 0);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length;

  const completedOrdersCount = orders.filter((o) => o.status === 'delivered').length;
  const completedPercent = totalOrders > 0 ? Math.round((completedOrdersCount / totalOrders) * 100) : 0;
  const pendingPercent = totalOrders > 0 ? 100 - completedPercent : 0;

  // Unique customer count
  const customerEmails = new Set(
    orders.map((o) => (o.shippingAddress?.email || o.userId || '').toLowerCase()).filter(Boolean)
  );
  const totalCustomers = Math.max(customerEmails.size, 1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'badge-phoenix-success';
      case 'processing':
        return 'badge-phoenix-warning';
      case 'shipped':
        return 'badge-phoenix-info';
      case 'cancelled':
        return 'badge-phoenix-danger';
      default:
        return 'badge-phoenix-secondary';
    }
  };

  return (
    <AdminGuard>
      <main className="main" id="top">

        <div className="content">
          {/* Mobile back-to-store button */}
          <div className="d-lg-none mb-3">
            <Link href="/" className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 py-1 px-3">
              <span className="fas fa-arrow-left fs-10"></span>
              <span className="fs-10">Back to Storefront</span>
            </Link>
          </div>

          <div className="pb-5">
            {/* Header Section */}
            <div className="row g-4 mb-4 align-items-center">
              <div className="col-12 col-xxl-6">
                <div>
                  <h2 className="mb-2 text-body-emphasis fw-bolder">Ecommerce Dashboard</h2>
                  <h5 className="text-body-tertiary fw-semibold">
                    Here&apos;s what&apos;s going on at your business right now
                  </h5>
                </div>
              </div>
              <div className="col-12 col-xxl-6 text-xxl-end">
                <Link href="/admin/products/add" className="btn btn-primary me-2">
                  <span className="fas fa-plus me-2"></span>Add product
                </Link>
                <Link href="/admin/orders" className="btn btn-phoenix-secondary">
                  <span className="fas fa-list me-2"></span>View all orders
                </Link>
              </div>
            </div>

            {/* Quick Stat Stack Counters (Matching we() from reference) */}
            <div className="row align-items-center g-4 mb-5">
              {/* Counter 1: New Orders */}
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center">
                  <span className="fa-stack" style={{ minHeight: '46px', minWidth: '46px' }}>
                    <span className="fa-solid fa-square fa-stack-2x text-success-light"></span>
                    <span className="fa-stack-1x fa-solid fa-star text-success"></span>
                  </span>
                  <div className="ms-3">
                    <h4 className="mb-0 text-body-emphasis fw-bold">{pendingOrders} new orders</h4>
                    <p className="text-body-secondary fs-9 mb-0">Awaiting processing</p>
                  </div>
                </div>
              </div>

              {/* Counter 2: On hold / Processing */}
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center">
                  <span className="fa-stack" style={{ minHeight: '46px', minWidth: '46px' }}>
                    <span className="fa-solid fa-square fa-stack-2x text-warning-light"></span>
                    <span className="fa-stack-1x fa-solid fa-pause text-warning"></span>
                  </span>
                  <div className="ms-3">
                    <h4 className="mb-0 text-body-emphasis fw-bold">{deliveredOrders} delivered</h4>
                    <p className="text-body-secondary fs-9 mb-0">Fulfilled successfully</p>
                  </div>
                </div>
              </div>

              {/* Counter 3: Out of stock */}
              <div className="col-12 col-md-auto">
                <div className="d-flex align-items-center">
                  <span className="fa-stack" style={{ minHeight: '46px', minWidth: '46px' }}>
                    <span className="fa-solid fa-square fa-stack-2x text-danger-light"></span>
                    <span className="fa-stack-1x fa-solid fa-box text-danger"></span>
                  </span>
                  <div className="ms-3">
                    <h4 className="mb-0 text-body-emphasis fw-bold">{outOfStockCount} products</h4>
                    <p className="text-body-secondary fs-9 mb-0">Out of stock</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="bg-body-secondary mb-5 mt-2" />

            {/* Main Stat Cards Grid */}
            <div className="row g-4 mb-5">
              {/* Total Revenue */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <h5 className="mb-1 text-body-emphasis">Total sells</h5>
                        <h6 className="text-body-tertiary fs-9 mb-0">Payment received across all channels</h6>
                      </div>
                      <span className="badge badge-phoenix badge-phoenix-success rounded-pill fs-10">
                        <span className="badge-label">+18.5%</span>
                      </span>
                    </div>
                    <h3 className="text-body-highlight fw-bold mb-0">{formatPrice(totalRevenue)}</h3>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <h5 className="mb-1 text-body-emphasis">Total orders</h5>
                        <h6 className="text-body-tertiary fs-9 mb-0">Completed: {completedPercent}%</h6>
                      </div>
                      <span className="badge badge-phoenix badge-phoenix-primary rounded-pill fs-10">
                        <span className="badge-label">Active</span>
                      </span>
                    </div>
                    <h3 className="text-body-highlight fw-bold mb-2">{totalOrders}</h3>
                    <div className="progress bg-body-tertiary" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${completedPercent}%` }}
                        aria-valuenow={completedPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                      <div
                        className="progress-bar bg-warning"
                        role="progressbar"
                        style={{ width: `${pendingPercent}%` }}
                        aria-valuenow={pendingPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catalog Size */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <h5 className="mb-1 text-body-emphasis">Catalog size</h5>
                        <h6 className="text-body-tertiary fs-9 mb-0">Live in Firestore database</h6>
                      </div>
                      <span className="badge badge-phoenix badge-phoenix-info rounded-pill fs-10">
                        <span className="badge-label">Live</span>
                      </span>
                    </div>
                    <h3 className="text-body-highlight fw-bold mb-0">{totalProducts}</h3>
                  </div>
                </div>
              </div>

              {/* Customers */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card h-100 border border-translucent shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <h5 className="mb-1 text-body-emphasis">Customers</h5>
                        <h6 className="text-body-tertiary fs-9 mb-0">Active customer profiles</h6>
                      </div>
                      <span className="badge badge-phoenix badge-phoenix-warning rounded-pill fs-10">
                        <span className="badge-label">+12.4%</span>
                      </span>
                    </div>
                    <h3 className="text-body-highlight fw-bold mb-0">{totalCustomers}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content: Recent Orders & Best Sellers */}
            <div className="row g-5">
              {/* Recent Orders Table */}
              <div className="col-12 col-xl-8">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h3 className="mb-1 text-body-emphasis">Recent orders</h3>
                    <p className="text-body-tertiary fs-9 mb-0">Orders placed across your store</p>
                  </div>
                  <Link href="/admin/orders" className="btn btn-sm btn-link text-primary p-0">
                    View all orders &rarr;
                  </Link>
                </div>

                <div className="card border border-translucent rounded-3 p-0 overflow-hidden shadow-sm">
                  <div className="table-responsive scrollbar">
                    <table className="table fs-9 mb-0 align-middle">
                      <thead className="bg-body-tertiary">
                        <tr>
                          <th className="white-space-nowrap ps-4 py-3">ORDER</th>
                          <th className="ps-4 py-3">CUSTOMER</th>
                          <th className="ps-4 py-3">DATE</th>
                          <th className="text-end ps-4 py-3">TOTAL</th>
                          <th className="text-center ps-4 pe-4 py-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="list">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="text-center py-5">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-5 text-body-tertiary">
                              No orders received yet.
                            </td>
                          </tr>
                        ) : (
                          orders.slice(0, 8).map((order) => (
                            <tr key={order.id} className="hover-actions-trigger">
                              <td className="white-space-nowrap ps-4 py-3">
                                <Link
                                  className="fw-bold font-monospace text-primary text-decoration-none"
                                  href={`/admin/orders/details?id=${order.id}`}
                                >
                                  #{order.id.slice(0, 8)}
                                </Link>
                              </td>
                              <td className="ps-4 py-3">
                                <span className="text-body-emphasis fw-semibold d-block">
                                  {order.shippingAddress?.name || 'Customer'}
                                </span>
                                <span className="text-body-tertiary fs-10">
                                  {order.shippingAddress?.email || ''}
                                </span>
                              </td>
                              <td className="ps-4 py-3 text-body-tertiary">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="text-end ps-4 py-3 fw-bold text-body-highlight">
                                {formatPrice(order.total)}
                              </td>
                              <td className="text-center ps-4 pe-4 py-3">
                                <span className={`badge badge-phoenix fs-10 ${getStatusBadge(order.status)}`}>
                                  <span className="badge-label text-capitalize">{order.status}</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Best Sellers */}
              <div className="col-12 col-xl-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h3 className="mb-0 text-body-emphasis">Best sellers</h3>
                  <Link href="/admin/products" className="btn btn-sm btn-link text-primary p-0">
                    All products &rarr;
                  </Link>
                </div>

                <div className="card border border-translucent rounded-3 p-3 shadow-sm">
                  <div className="d-flex flex-column gap-3">
                    {products
                      .filter((p) => p.isBestSeller || p.isFeatured)
                      .slice(0, 6)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="d-flex align-items-center p-2 rounded-2 hover-bg-secondary-subtle border border-translucent"
                        >
                          <div
                            className="rounded-2 overflow-hidden bg-body-tertiary me-3 flex-shrink-0 d-flex align-items-center justify-content-center"
                            style={{ width: '48px', height: '48px' }}
                          >
                            {product.variants?.[0]?.images?.[0] ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={product.variants[0].images[0]}
                                alt={product.name}
                                className="w-100 h-100 object-fit-cover"
                              />
                            ) : (
                              <span className="text-body-tertiary fs-10 fw-bold">CR</span>
                            )}
                          </div>
                          <div className="flex-grow-1 overflow-hidden me-2">
                            <p className="mb-0 fw-semibold text-body text-truncate fs-9">
                              {product.name}
                            </p>
                            <p className="mb-0 text-body-tertiary fs-10 text-capitalize">
                              {product.category}
                            </p>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <span className="fw-bold text-body-highlight fs-9">
                              {formatPrice(product.price)}
                            </span>
                            <span className="d-block badge badge-phoenix badge-phoenix-warning fs-10 mt-1">
                              Best Seller
                            </span>
                          </div>
                        </div>
                      ))}

                    {products.filter((p) => p.isBestSeller || p.isFeatured).length === 0 && (
                      <p className="text-center text-body-tertiary py-4 mb-0 fs-9">
                        No best sellers marked yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
