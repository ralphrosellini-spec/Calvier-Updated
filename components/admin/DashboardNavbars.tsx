'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardNavbars() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // Vertical navbar collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile sidebar open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Notification dropdown open state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Nine dots dropdown open state
  const [isNineDotsOpen, setIsNineDotsOpen] = useState(false);
  // User profile dropdown open state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion open states
  const [isEcommerceOpen, setIsEcommerceOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);

  const notifRef = useRef<HTMLLIElement>(null);
  const nineDotsRef = useRef<HTMLLIElement>(null);
  const userMenuRef = useRef<HTMLLIElement>(null);

  // Initialize theme, collapse state and feather icons
  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem('phoenixTheme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
    document.documentElement.setAttribute('data-bs-theme', savedTheme);

    // Check collapsed state
    try {
      const savedCollapsed = JSON.parse(localStorage.getItem('phoenixIsNavbarVerticalCollapsed') || 'false');
      setIsCollapsed(savedCollapsed);
      if (savedCollapsed) {
        document.documentElement.classList.add('navbar-vertical-collapsed');
      } else {
        document.documentElement.classList.remove('navbar-vertical-collapsed');
      }
    } catch {
      // ignore
    }

    // Click outside to close dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (nineDotsRef.current && !nineDotsRef.current.contains(target)) {
        setIsNineDotsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Re-run feather icons on path change or collapse toggle
  useEffect(() => {
    const initFeather = () => {
      // @ts-expect-error feather loaded from script
      if (typeof window !== 'undefined' && window.feather) {
        // @ts-expect-error feather
        window.feather.replace({ 'stroke-width': 1.5 });
      }
    };
    initFeather();
    const t = setTimeout(initFeather, 400);
    return () => clearTimeout(t);
  }, [pathname, isCollapsed, isEcommerceOpen, isAdminOpen]);

  // Toggle dark/light theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-bs-theme', nextTheme);
    localStorage.setItem('phoenixTheme', nextTheme);
  };

  // Toggle vertical sidebar collapse
  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (nextState) {
      document.documentElement.classList.add('navbar-vertical-collapsed');
    } else {
      document.documentElement.classList.remove('navbar-vertical-collapsed');
    }
    localStorage.setItem('phoenixIsNavbarVerticalCollapsed', JSON.stringify(nextState));
  };

  // Toggle mobile sidebar
  const toggleMobileNav = () => {
    setIsMobileOpen(prev => !prev);
  };

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const displayName = user?.displayName || user?.email || 'Administrator';
  const displayEmail = user?.email || 'admin@caliver-rossel.com';
  const initial = displayName.charAt(0).toUpperCase();

  // Navigation Items
  const adminNavItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Add product', href: '/admin/products/add' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Customers', href: '/admin/customers' },
    { label: 'Customer details', href: '/admin/customers/details' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Order details', href: '/admin/orders/details' },
    { label: 'Refund', href: '/admin/refund' },
    { label: 'Site Content', href: '/admin/content' },
    { label: 'Admins & Team', href: '/admin/admins' },
    { label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* 1. VERTICAL NAVBAR (SIDEBAR)                              */}
      {/* ========================================================= */}
      <nav
        className={`navbar navbar-vertical navbar-expand-lg ${isMobileOpen ? 'show' : ''}`}
        id="navbarVerticalCollapse"
      >
        <div className="collapse navbar-collapse show h-100 d-flex flex-column">
          <div className="navbar-vertical-content flex-grow-1 overflow-auto w-100">
            {/* Top Brand inside Vertical Nav */}
            <div className="navbar-vertical-header d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-translucent">
              <Link className="navbar-brand d-flex align-items-center mb-0" href="/admin" onClick={() => setIsMobileOpen(false)}>
                <span className="text-body-emphasis fw-bolder fs-6 mb-0 letter-spacing-1">
                  CALVIER ROSSEL
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-sm btn-link text-body-tertiary p-1 d-lg-none"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close navigation"
              >
                <span className="fas fa-times fs-7"></span>
              </button>
            </div>

            {/* Quick Mobile Back Link */}
            <div className="px-3 pt-3 pb-2 d-lg-none">
              <Link
                href="/"
                className="btn btn-outline-primary w-100 btn-sm d-flex align-items-center justify-content-center gap-2 py-2"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="fas fa-arrow-left fs-9"></span>
                <span className="fw-semibold fs-9">Back to Storefront</span>
              </Link>
            </div>

            <ul className="navbar-nav flex-column mt-3" id="navbarVerticalNav">
              {/* Apps Section */}
              <li className="nav-item">
                <p className="navbar-vertical-label px-4 text-uppercase text-body-tertiary fw-bold fs-10 mb-2">
                  Apps
                </p>
                <hr className="navbar-vertical-line my-1" />

                {/* E-Commerce Parent Item */}
                <div className="nav-item-wrapper">
                  <button
                    className="nav-link dropdown-indicator label-1 w-100 border-0 bg-transparent text-start"
                    onClick={() => setIsEcommerceOpen(prev => !prev)}
                    aria-expanded={isEcommerceOpen}
                  >
                    <div className="d-flex align-items-center">
                      <div className="dropdown-indicator-icon-wrapper me-2">
                        <span
                          className={`fas fa-caret-right dropdown-indicator-icon transition-transform ${
                            isEcommerceOpen ? 'rotate-90 text-primary' : ''
                          }`}
                          style={{
                            display: 'inline-block',
                            transform: isEcommerceOpen ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.15s ease',
                          }}
                        ></span>
                      </div>
                      <span className="nav-link-icon me-2">
                        <span data-feather="shopping-cart"></span>
                      </span>
                      <span className="nav-link-text fw-semibold">E commerce</span>
                    </div>
                  </button>

                  {/* Submenu under E-commerce */}
                  {isEcommerceOpen && (
                    <div className="parent-wrapper label-1 ps-3">
                      <ul className="nav collapse parent show flex-column">
                        {/* Admin Submenu Item */}
                        <li className="nav-item">
                          <button
                            className="nav-link dropdown-indicator w-100 border-0 bg-transparent text-start py-2"
                            onClick={() => setIsAdminOpen(prev => !prev)}
                            aria-expanded={isAdminOpen}
                          >
                            <div className="d-flex align-items-center">
                              <div className="dropdown-indicator-icon-wrapper me-2">
                                <span
                                  className="fas fa-caret-right dropdown-indicator-icon"
                                  style={{
                                    display: 'inline-block',
                                    transform: isAdminOpen ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s ease',
                                  }}
                                ></span>
                              </div>
                              <span className="nav-link-text fw-medium">Admin</span>
                            </div>
                          </button>

                          {isAdminOpen && (
                            <div className="parent-wrapper ps-3">
                              <ul className="nav collapse parent show flex-column">
                                {adminNavItems.map(item => {
                                  const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href));
                                  return (
                                    <li className="nav-item" key={item.href}>
                                      <Link
                                        className={`nav-link py-1 fs-9 ${
                                          isActive
                                            ? 'active fw-bold text-primary'
                                            : 'text-body-secondary hover-text-primary'
                                        }`}
                                        href={item.href}
                                        onClick={() => setIsMobileOpen(false)}
                                      >
                                        <span className="nav-link-text">{item.label}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </li>

                        {/* Customer Storefront Submenu Item */}
                        <li className="nav-item mt-1">
                          <button
                            className="nav-link dropdown-indicator w-100 border-0 bg-transparent text-start py-2"
                            onClick={() => setIsCustomerOpen(prev => !prev)}
                            aria-expanded={isCustomerOpen}
                          >
                            <div className="d-flex align-items-center">
                              <div className="dropdown-indicator-icon-wrapper me-2">
                                <span
                                  className="fas fa-caret-right dropdown-indicator-icon"
                                  style={{
                                    display: 'inline-block',
                                    transform: isCustomerOpen ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s ease',
                                  }}
                                ></span>
                              </div>
                              <span className="nav-link-text fw-medium">Customer</span>
                            </div>
                          </button>

                          {isCustomerOpen && (
                            <div className="parent-wrapper ps-3">
                              <ul className="nav collapse parent show flex-column">
                                <li className="nav-item">
                                  <Link className="nav-link py-1 fs-9 text-body-secondary" href="/" target="_blank">
                                    <span className="nav-link-text">Homepage ↗</span>
                                  </Link>
                                </li>
                                <li className="nav-item">
                                  <Link className="nav-link py-1 fs-9 text-body-secondary" href="/shop" target="_blank">
                                    <span className="nav-link-text">Product details ↗</span>
                                  </Link>
                                </li>
                                <li className="nav-item">
                                  <Link className="nav-link py-1 fs-9 text-body-secondary" href="/shop" target="_blank">
                                    <span className="nav-link-text">Products filter ↗</span>
                                  </Link>
                                </li>
                                <li className="nav-item">
                                  <Link className="nav-link py-1 fs-9 text-body-secondary" href="/checkout" target="_blank">
                                    <span className="nav-link-text">Cart & Checkout ↗</span>
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          )}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </li>

              {/* Account / Quick links */}
              <li className="nav-item mt-4">
                <p className="navbar-vertical-label px-4 text-uppercase text-body-tertiary fw-bold fs-10 mb-2">
                  System
                </p>
                <hr className="navbar-vertical-line my-1" />

                <div className="nav-item-wrapper">
                  <Link className="nav-link label-1" href="/admin/settings">
                    <div className="d-flex align-items-center">
                      <span className="nav-link-icon me-2">
                        <span data-feather="settings"></span>
                      </span>
                      <span className="nav-link-text">Settings</span>
                    </div>
                  </Link>
                </div>

                <div className="nav-item-wrapper">
                  <Link className="nav-link label-1" href="/" target="_blank">
                    <div className="d-flex align-items-center">
                      <span className="nav-link-icon me-2">
                        <span data-feather="external-link"></span>
                      </span>
                      <span className="nav-link-text">View Live Store</span>
                    </div>
                  </Link>
                </div>

                <div className="nav-item-wrapper">
                  <button
                    className="nav-link label-1 border-0 bg-transparent w-100 text-start text-danger"
                    onClick={handleSignOut}
                  >
                    <div className="d-flex align-items-center">
                      <span className="nav-link-icon me-2 text-danger">
                        <span data-feather="log-out"></span>
                      </span>
                      <span className="nav-link-text text-danger">Sign Out</span>
                    </div>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          {/* Vertical Navbar Footer: Collapse Toggle */}
          <div className="navbar-vertical-footer border-top border-translucent p-2">
            <button
              className="btn navbar-vertical-toggle border-0 fw-semibold w-100 white-space-nowrap d-flex align-items-center justify-content-center text-body-tertiary hover-text-body"
              type="button"
              onClick={toggleCollapse}
              title="Toggle Collapsed View"
            >
              <span className={`uil ${isCollapsed ? 'uil-arrow-from-right' : 'uil-left-arrow-to-left'} fs-8 me-2`}></span>
              <span className="navbar-vertical-footer-text fs-9">
                {isCollapsed ? 'Expand View' : 'Collapsed View'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay backdrop — closes sidebar on outside tap */}
      {isMobileOpen && (
        <div
          className="d-lg-none"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1015,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================= */}
      {/* 2. TOP NAVBAR (#navbarDefault)                            */}
      {/* ========================================================= */}
      <nav className="navbar navbar-top fixed-top navbar-expand" id="navbarDefault">
        <div className="collapse navbar-collapse justify-content-between px-3 px-lg-4">
          {/* Brand & Mobile Hamburger */}
          <div className="navbar-logo d-flex align-items-center">
            <button
              className="btn navbar-toggler navbar-toggler-humburger-icon hover-bg-transparent me-2 d-lg-none"
              type="button"
              onClick={toggleMobileNav}
              aria-label="Toggle Navigation"
            >
              <span className="navbar-toggle-icon">
                <span className="toggle-line mb-1 bg-body-emphasis" style={{ display: 'block', width: '20px', height: '2px' }}></span>
                <span className="toggle-line mb-1 bg-body-emphasis" style={{ display: 'block', width: '20px', height: '2px' }}></span>
                <span className="toggle-line bg-body-emphasis" style={{ display: 'block', width: '20px', height: '2px' }}></span>
              </span>
            </button>

            <Link className="navbar-brand me-1 me-sm-3 d-flex align-items-center" href="/admin">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-2 bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-2"
                  style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}
                >
                  CR
                </div>
                <h5 className="logo-text mb-0 fw-bold d-none d-sm-block text-body-highlight">
                  Caliver Rossel
                </h5>
              </div>
            </Link>
          </div>

          {/* Search Box */}
          <div className="search-box navbar-top-search-box d-none d-lg-block" style={{ width: '24rem' }}>
            <form className="position-relative" onSubmit={handleSearchSubmit}>
              <input
                className="form-control search-input fuzzy-search rounded-pill form-control-sm ps-5 bg-body-tertiary"
                type="search"
                placeholder="Search products, orders, customers..."
                aria-label="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span
                className="fas fa-search search-box-icon text-body-tertiary position-absolute top-50 translate-middle-y ms-3"
                style={{ fontSize: '0.85rem' }}
              ></span>
            </form>
          </div>

          {/* Right-Side Icons */}
          <ul className="navbar-nav navbar-nav-icons flex-row align-items-center gap-2">
            {/* View Store Button */}
            <li className="nav-item me-1 d-none d-md-block">
              <Link href="/" target="_blank" className="btn btn-sm btn-phoenix-secondary fs-10 px-3">
                <span className="fas fa-store me-1"></span> View Store
              </Link>
            </li>

            {/* Dark / Light Theme Toggle */}
            <li className="nav-item">
              <button
                className="btn btn-link text-body-tertiary p-2 rounded-circle hover-bg-secondary-subtle"
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              >
                {theme === 'dark' ? (
                  <span className="fas fa-sun fs-8 text-warning"></span>
                ) : (
                  <span className="fas fa-moon fs-8 text-body-tertiary"></span>
                )}
              </button>
            </li>

            {/* Notifications Dropdown */}
            <li className="nav-item dropdown" ref={notifRef}>
              <button
                className="btn btn-link text-body-tertiary p-2 rounded-circle hover-bg-secondary-subtle position-relative"
                type="button"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                aria-expanded={isNotificationsOpen}
              >
                <span className="fas fa-bell fs-8"></span>
                <span
                  className="position-absolute top-0 end-0 p-1 bg-danger border border-light rounded-circle"
                  style={{ marginTop: '6px', marginRight: '6px' }}
                ></span>
              </button>

              {isNotificationsOpen && (
                <div
                  className="dropdown-menu dropdown-menu-end shadow-lg border border-translucent py-0 show"
                  style={{
                    width: '22rem',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 1050,
                  }}
                >
                  <div className="card border-0">
                    <div className="card-header bg-body-tertiary d-flex justify-content-between align-items-center py-2 px-3">
                      <h6 className="mb-0 text-body-emphasis fw-bold fs-9">Notifications</h6>
                      <button
                        className="btn btn-link p-0 text-primary fs-10"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="card-body p-0 max-vh-50 overflow-auto">
                      <div className="list-group list-group-flush fs-9">
                        <Link
                          href="/admin/orders"
                          className="list-group-item list-group-item-action py-3 px-3 border-0 border-bottom"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          <div className="d-flex align-items-center">
                            <div className="badge badge-phoenix badge-phoenix-success me-3 p-2 rounded-circle">
                              <span className="fas fa-shopping-bag"></span>
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-semibold text-body-highlight">New order received</p>
                              <p className="mb-0 text-body-tertiary fs-10">Customer placed an order</p>
                            </div>
                          </div>
                        </Link>
                        <Link
                          href="/admin/products"
                          className="list-group-item list-group-item-action py-3 px-3 border-0"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          <div className="d-flex align-items-center">
                            <div className="badge badge-phoenix badge-phoenix-warning me-3 p-2 rounded-circle">
                              <span className="fas fa-exclamation-triangle"></span>
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-semibold text-body-highlight">Catalog status</p>
                              <p className="mb-0 text-body-tertiary fs-10">Live inventory synchronization active</p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                    <div className="card-footer text-center py-2 bg-body-tertiary border-top border-translucent">
                      <Link
                        href="/admin/orders"
                        className="fs-10 fw-bold text-primary"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        View all orders →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* Nine Dots Apps Grid */}
            <li className="nav-item dropdown" ref={nineDotsRef}>
              <button
                className="btn btn-link text-body-tertiary p-2 rounded-circle hover-bg-secondary-subtle"
                type="button"
                onClick={() => setIsNineDotsOpen(prev => !prev)}
                aria-expanded={isNineDotsOpen}
              >
                <span className="fas fa-th fs-8"></span>
              </button>

              {isNineDotsOpen && (
                <div
                  className="dropdown-menu dropdown-menu-end shadow-lg border border-translucent p-3 show"
                  style={{
                    width: '18rem',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 1050,
                  }}
                >
                  <div className="row g-2 text-center">
                    <div className="col-4">
                      <Link
                        href="/admin"
                        className="d-flex flex-column align-items-center p-2 rounded-2 hover-bg-secondary-subtle text-decoration-none text-body"
                        onClick={() => setIsNineDotsOpen(false)}
                      >
                        <span className="fas fa-chart-pie fs-6 text-primary mb-1"></span>
                        <span className="fs-10 fw-semibold">Dashboard</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        href="/admin/products"
                        className="d-flex flex-column align-items-center p-2 rounded-2 hover-bg-secondary-subtle text-decoration-none text-body"
                        onClick={() => setIsNineDotsOpen(false)}
                      >
                        <span className="fas fa-box-open fs-6 text-success mb-1"></span>
                        <span className="fs-10 fw-semibold">Products</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        href="/admin/orders"
                        className="d-flex flex-column align-items-center p-2 rounded-2 hover-bg-secondary-subtle text-decoration-none text-body"
                        onClick={() => setIsNineDotsOpen(false)}
                      >
                        <span className="fas fa-shopping-cart fs-6 text-info mb-1"></span>
                        <span className="fs-10 fw-semibold">Orders</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        href="/admin/customers"
                        className="d-flex flex-column align-items-center p-2 rounded-2 hover-bg-secondary-subtle text-decoration-none text-body"
                        onClick={() => setIsNineDotsOpen(false)}
                      >
                        <span className="fas fa-users fs-6 text-warning mb-1"></span>
                        <span className="fs-10 fw-semibold">Customers</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        href="/admin/content"
                        className="d-flex flex-column align-items-center p-2 rounded-2 hover-bg-secondary-subtle text-decoration-none text-body"
                        onClick={() => setIsNineDotsOpen(false)}
                      >
                        <span className="fas fa-images fs-6 text-danger mb-1"></span>
                        <span className="fs-10 fw-semibold">Content</span>
                      </Link>
                    </div>
                    <div className="col-4">
                      <Link
                        href="/admin/settings"
                        className="d-flex flex-column align-items-center p-2 rounded-2 hover-bg-secondary-subtle text-decoration-none text-body"
                        onClick={() => setIsNineDotsOpen(false)}
                      >
                        <span className="fas fa-cog fs-6 text-secondary mb-1"></span>
                        <span className="fs-10 fw-semibold">Settings</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* User Profile Dropdown */}
            <li className="nav-item dropdown ms-1" ref={userMenuRef}>
              <button
                className="btn btn-link p-0 border-0 bg-transparent"
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                aria-expanded={isUserMenuOpen}
              >
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                  style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}
                >
                  {initial}
                </div>
              </button>

              {isUserMenuOpen && (
                <div
                  className="dropdown-menu dropdown-menu-end shadow-lg border border-translucent py-0 show"
                  style={{
                    width: '17rem',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 1050,
                  }}
                >
                  <div className="card border-0">
                    <div className="card-body p-3 text-center border-bottom border-translucent">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto mb-2"
                        style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}
                      >
                        {initial}
                      </div>
                      <h6 className="mb-0 text-body-emphasis fw-bold">{displayName}</h6>
                      <p className="fs-10 text-body-tertiary mb-0 text-truncate">{displayEmail}</p>
                      <span className="badge badge-phoenix badge-phoenix-primary mt-2 fs-10">Administrator</span>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/admin/settings"
                        className="dropdown-item py-2 rounded-2 fs-9 text-body d-flex align-items-center"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span className="fas fa-user me-2 text-body-tertiary"></span>
                        Profile & Settings
                      </Link>
                      <Link
                        href="/"
                        target="_blank"
                        className="dropdown-item py-2 rounded-2 fs-9 text-body d-flex align-items-center"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span className="fas fa-external-link-alt me-2 text-body-tertiary"></span>
                        Open Storefront
                      </Link>
                    </div>

                    <div className="card-footer p-2 bg-body-tertiary border-top border-translucent">
                      <button
                        className="btn btn-phoenix-secondary btn-sm d-flex align-items-center justify-content-center w-100 text-danger"
                        onClick={handleSignOut}
                      >
                        <span className="fas fa-sign-out-alt me-2"></span>
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
