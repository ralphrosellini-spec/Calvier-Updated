'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', icon: 'trending-up', href: '/admin' },
    { label: 'Orders', icon: 'shopping-bag', href: '/admin/orders' },
    { label: 'Products', icon: 'package', href: '/admin/products' },
    { label: 'Site Content', icon: 'image', href: '/admin/content' },
    { label: 'Customers', icon: 'users', href: '/admin/customers' },
    { label: 'Admins & Team', icon: 'shield', href: '/admin/admins' },
    { label: 'Settings', icon: 'settings', href: '/admin/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const displayName = user?.email ?? 'Admin';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Vertical Nav */}
      <nav className="navbar navbar-vertical navbar-expand-lg">
        <div className="collapse navbar-collapse" id="navbarVerticalCollapse">
          <div className="navbar-vertical-content">
            {/* Brand */}
            <Link className="navbar-brand d-flex align-items-center mb-0" href="/admin">
              <p className="text-body-emphasis fw-bolder fs-5 mb-0">CALVIER ROSSEL</p>
            </Link>
            <p className="text-primary fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', marginTop: '-4px', marginBottom: '12px' }}>
              ADMIN PORTAL
            </p>

            {/* User info */}
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                style={{ width: '36px', height: '36px', fontSize: '0.8rem', flexShrink: 0 }}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="mb-0 fw-semibold text-body text-truncate" style={{ fontSize: '0.85rem' }}>{displayName}</p>
                <p className="mb-0 text-body-tertiary" style={{ fontSize: '0.7rem' }}>Administrator</p>
              </div>
            </div>

            {/* Nav items */}
            <ul className="navbar-nav flex-column" id="navbarVerticalNav">
              <li className="nav-item">
                <p className="navbar-vertical-label">Navigation</p>
                <hr className="navbar-vertical-line" />
                {navItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <div className="nav-item-wrapper" key={item.href}>
                      <Link
                        className={`nav-link label-1${isActive ? ' active' : ''}`}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="d-flex align-items-center">
                          <span className="nav-link-icon">
                            <span data-feather={item.icon}></span>
                          </span>
                          <span className="nav-link-text">{item.label}</span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </li>

              <li className="nav-item mt-3">
                <p className="navbar-vertical-label">Store</p>
                <hr className="navbar-vertical-line" />
                <div className="nav-item-wrapper">
                  <Link className="nav-link label-1" href="/" target="_blank">
                    <div className="d-flex align-items-center">
                      <span className="nav-link-icon">
                        <span data-feather="external-link"></span>
                      </span>
                      <span className="nav-link-text">View Store</span>
                    </div>
                  </Link>
                </div>
                <div className="nav-item-wrapper">
                  <button
                    className="nav-link label-1 border-0 bg-transparent w-100 text-start text-danger"
                    onClick={handleSignOut}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <span className="nav-link-icon">
                        <span data-feather="log-out"></span>
                      </span>
                      <span className="nav-link-text">Sign Out</span>
                    </div>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Top horizontal navbar for mobile */}
      <nav className="navbar navbar-top navbar-expand">
        <div className="collapse navbar-collapse" id="navbarTopCollapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <div className="nav-item-wrapper">
                <h5 className="nav-link text-body fw-semibold mb-0">
                  {navItems.find(item => item.href === pathname)?.label ?? 'Admin'}
                </h5>
              </div>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                  style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  {initials}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
