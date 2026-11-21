'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { subscribeToProducts, deleteProduct } from '@/lib/firebase-db';
import type { Product } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'discount'>('all');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Real-time listener for products
  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter products based on search, tab, and category
  useEffect(() => {
    let list = [...products];

    // Tab filter
    if (activeTab === 'published') {
      list = list.filter((p) => p.status === 'in_stock');
    } else if (activeTab === 'drafts') {
      list = list.filter((p) => p.status === 'out_of_stock' || (p.status as string) === 'draft');
    } else if (activeTab === 'discount') {
      list = list.filter((p) => p.originalPrice && p.originalPrice > p.price);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    setFiltered(list);
  }, [products, activeTab, categoryFilter, search]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      showToastMsg('Product deleted successfully.');
    } catch {
      showToastMsg('Failed to delete product.');
    } finally {
      setDeleteId(null);
    }
  };

  // Bulk select toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Counts for tabs
  const allCount = products.length;
  const publishedCount = products.filter((p) => p.status === 'in_stock').length;
  const draftsCount = products.filter((p) => p.status === 'out_of_stock' || (p.status as string) === 'draft').length;
  const discountCount = products.filter((p) => p.originalPrice && p.originalPrice > p.price).length;

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
            {/* Header & Tabs */}
            <div className="row g-3 mb-4 align-items-center">
              <div className="col-auto">
                <h2 className="mb-0 text-body-emphasis fw-bolder">Products</h2>
              </div>
            </div>

            {/* Navigation Filter Tabs (matching se() from reference) */}
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
                    activeTab === 'published'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('published')}
                >
                  Published <span className="text-body-quaternary fw-normal">({publishedCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'drafts'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('drafts')}
                >
                  Drafts / Out of stock{' '}
                  <span className="text-body-quaternary fw-normal">({draftsCount})</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent px-3 py-2 fs-9 fw-semibold cursor-pointer ${
                    activeTab === 'discount'
                      ? 'active text-primary border-bottom border-primary border-2'
                      : 'text-body-tertiary hover-text-body'
                  }`}
                  onClick={() => setActiveTab('discount')}
                >
                  On discount <span className="text-body-quaternary fw-normal">({discountCount})</span>
                </button>
              </li>
            </ul>

            {/* Controls Bar: Search, Filters, Export, Add Product */}
            <div className="card border border-translucent rounded-3 mb-4 shadow-sm">
              <div className="card-body p-3">
                <div className="row g-3 justify-content-between align-items-center">
                  {/* Left: Search & Category Filter */}
                  <div className="col-12 col-md-auto d-flex flex-wrap align-items-center gap-2">
                    <div className="search-box position-relative" style={{ width: '18rem' }}>
                      <input
                        className="form-control form-control-sm rounded-pill ps-5 bg-body-tertiary"
                        type="search"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <span
                        className="fas fa-search position-absolute top-50 translate-middle-y ms-3 text-body-tertiary"
                        style={{ fontSize: '0.8rem' }}
                      ></span>
                    </div>

                    <select
                      className="form-select form-select-sm"
                      style={{ width: '11rem' }}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Category: All</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right: Actions */}
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2">
                    <Link href="/admin/products/add" className="btn btn-primary btn-sm">
                      <span className="fas fa-plus me-2"></span>Add product
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table matching Phoenix se() */}
            <div className="card border border-translucent rounded-3 overflow-hidden shadow-sm">
              <div className="table-responsive scrollbar">
                <table className="table fs-9 mb-0 align-middle">
                  <thead className="bg-body-tertiary">
                    <tr>
                      <th className="white-space-nowrap ps-3 py-3" style={{ width: '20px' }}>
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                            onChange={toggleSelectAll}
                          />
                        </div>
                      </th>
                      <th style={{ width: '60px' }}></th>
                      <th className="ps-3 py-3" style={{ minWidth: '260px' }}>
                        PRODUCT NAME
                      </th>
                      <th className="text-end ps-3 py-3" style={{ width: '120px' }}>
                        PRICE
                      </th>
                      <th className="ps-3 py-3" style={{ width: '140px' }}>
                        CATEGORY
                      </th>
                      <th className="ps-3 py-3" style={{ width: '180px' }}>
                        TAGS
                      </th>
                      <th className="ps-3 py-3" style={{ width: '140px' }}>
                        VENDOR
                      </th>
                      <th className="ps-3 py-3" style={{ width: '130px' }}>
                        PUBLISHED ON
                      </th>
                      <th className="text-end pe-4 py-3" style={{ width: '100px' }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="list">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-5 text-body-tertiary">
                          No products found. Click &quot;Add product&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((product) => {
                        const isSelected = selectedIds.includes(product.id);
                        const thumbnail =
                          product.variants?.find((v) => v.images && v.images.length > 0)?.images?.[0] ||
                          product.variants?.[0]?.images?.[0] ||
                          '';

                        return (
                          <tr key={product.id} className="hover-actions-trigger">
                            <td className="ps-3 py-3">
                              <div className="form-check mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(product.id)}
                                />
                              </div>
                            </td>
                            <td className="py-2">
                              <div
                                className="rounded-2 overflow-hidden bg-body-tertiary border border-translucent d-flex align-items-center justify-content-center"
                                style={{ width: '48px', height: '48px' }}
                              >
                                {thumbnail ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={thumbnail}
                                    alt={product.name}
                                    className="w-100 h-100 object-fit-cover"
                                  />
                                ) : (
                                  <span className="text-body-tertiary fs-10 fw-bold">CR</span>
                                )}
                              </div>
                            </td>
                            <td className="ps-3 py-3">
                              <Link
                                className="fw-bold text-body-highlight text-decoration-none hover-text-primary d-block"
                                href={`/admin/products/edit/${product.id}`}
                              >
                                {product.name}
                              </Link>
                              <span className="text-body-tertiary fs-10">
                                Status:{' '}
                                <span
                                  className={`badge badge-phoenix fs-10 ${
                                    product.status === 'in_stock'
                                      ? 'badge-phoenix-success'
                                      : 'badge-phoenix-danger'
                                  }`}
                                >
                                  {product.status === 'in_stock' ? 'In stock' : 'Out of stock'}
                                </span>
                              </span>
                            </td>
                            <td className="text-end ps-3 py-3 fw-bold text-body-highlight">
                              {formatPrice(product.price)}
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="d-block text-body-tertiary text-decoration-line-through fs-10">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </td>
                            <td className="ps-3 py-3 text-body-secondary text-capitalize">
                              {product.category || '"”'}
                            </td>
                            <td className="ps-3 py-3">
                              <div className="d-flex flex-wrap gap-1">
                                {product.tags && product.tags.length > 0 ? (
                                  product.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="badge bg-body-tertiary text-body fs-10">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-body-tertiary">&mdash;</span>
                                )}
                              </div>
                            </td>
                            <td className="ps-3 py-3 text-body-secondary">
                              {product.brand || 'Calvier Rossel'}
                            </td>
                            <td className="ps-3 py-3 text-body-tertiary">
                              {formatDate(product.createdAt)}
                            </td>
                            <td className="text-end pe-4 py-3">
                              <div className="d-inline-flex gap-2">
                                <Link
                                  href={`/product/${product.slug || product.id}`}
                                  target="_blank"
                                  className="btn btn-sm btn-phoenix-secondary p-1"
                                  title="View on storefront"
                                >
                                  <span className="fas fa-eye fs-10"></span>
                                </Link>
                                <Link
                                  href={`/admin/products/edit/${product.id}`}
                                  className="btn btn-sm btn-phoenix-primary p-1"
                                  title="Edit product"
                                >
                                  <span className="fas fa-edit fs-10"></span>
                                </Link>
                                <button
                                  className="btn btn-sm btn-phoenix-danger p-1"
                                  title="Delete product"
                                  onClick={() => setDeleteId(product.id)}
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

              {/* Table Footer */}
              <div className="card-footer d-flex align-items-center justify-content-between py-2 px-3 bg-body-tertiary">
                <span className="text-body-tertiary fs-10">
                  Showing {filtered.length} of {products.length} products
                </span>
                <span className="text-body-tertiary fs-10">Real-time synchronized with Firestore</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border border-translucent">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Product</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDeleteId(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    Are you sure you want to delete this product? This action cannot be undone and will
                    remove the product from the storefront.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-phoenix-secondary"
                    onClick={() => setDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(deleteId)}
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            className="position-fixed bottom-0 end-0 p-3"
            style={{ zIndex: 1100 }}
          >
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
