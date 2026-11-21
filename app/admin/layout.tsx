/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Admin Portal — Calvier Rossel',
  description: 'Ecommerce Management System',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-portal-wrapper">
      {/* Nunito Sans font used by Phoenix */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,300;1,400;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet"
      />

      {/* FontAwesome 6 Icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        crossOrigin="anonymous"
      />

      {/* Simplebar CSS */}
      <link rel="stylesheet" href="/site/vendors/simplebar/simplebar.min.css" />

      {/* Unicons CSS — via CDN since local file is missing */}
      <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" />

      {/* Phoenix Theme CSS */}
      <link rel="stylesheet" href="/site/assets/css/theme.min.css" id="style-default" />
      <link rel="stylesheet" href="/site/assets/css/user.min.css" id="user-style-default" />

      {/* Admin specific resets to ensure 100% Phoenix fidelity */}
      <style>{`
        body {
          font-family: "Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          background-color: var(--phoenix-body-bg, #f5f7fa) !important;
          color: var(--phoenix-body-color, #31374a) !important;
          margin: 0;
          padding: 0;
          font-feature-settings: normal !important;
          -webkit-font-smoothing: antialiased;
        }
        .admin-portal-wrapper {
          min-height: 100vh;
        }
        .admin-portal-wrapper * {
          box-sizing: border-box;
        }
        .navbar-vertical {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: 15.875rem;
          z-index: 1020;
          background-color: var(--phoenix-navbar-vertical-bg, #ffffff);
          border-right: 1px solid var(--phoenix-border-color, #e3e6ed);
          transition: width 0.2s ease, transform 0.2s ease;
          overflow-y: auto;
        }
        .navbar-top {
          position: fixed;
          top: 0;
          left: 15.875rem;
          right: 0;
          z-index: 1019;
          height: var(--phoenix-navbar-top-height, 4.25rem);
          background-color: var(--phoenix-navbar-top-bg, #ffffff);
          border-bottom: 1px solid var(--phoenix-border-color, #e3e6ed);
          transition: left 0.2s ease;
        }
        @media (min-width: 992px) {
          .content {
            margin-left: 15.875rem !important;
            padding-top: calc(var(--phoenix-navbar-top-height, 4.25rem) + 1.5rem) !important;
            padding-left: 2rem !important;
            padding-right: 2rem !important;
            padding-bottom: 4rem !important;
          }
          html.navbar-vertical-collapsed .navbar-vertical {
            width: 4rem !important;
          }
          html.navbar-vertical-collapsed .navbar-vertical .navbar-vertical-content {
            width: 4rem !important;
          }
          html.navbar-vertical-collapsed .navbar-top {
            left: 4rem !important;
          }
          html.navbar-vertical-collapsed .content {
            margin-left: 4rem !important;
          }
        }
        @media (max-width: 991.98px) {
          .navbar-vertical {
            transform: translateX(-100%);
            z-index: 1030 !important;
            overflow-y: auto;
            max-height: 100vh;
          }
          .navbar-vertical.show {
            transform: translateX(0);
            box-shadow: 0.5rem 0 2rem rgba(0,0,0,0.25);
          }
          .navbar-top {
            left: 0 !important;
            z-index: 1025;
          }
          .content {
            margin-left: 0 !important;
            padding-top: calc(var(--phoenix-navbar-top-height, 4.25rem) + 1rem) !important;
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
            padding-bottom: 2rem !important;
          }
          .table-responsive {
            font-size: 0.8rem;
          }
          .btn { font-size: 0.8rem; }
          h2 { font-size: 1.3rem !important; }
          h3 { font-size: 1.1rem !important; }
          .card { margin-bottom: 0.75rem; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        }
        @media (max-width: 575.98px) {
          .content {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .row.g-5 { --bs-gutter-x: 0.75rem; --bs-gutter-y: 0.75rem; }
          .col-auto .btn { font-size: 0.7rem; padding: 0.25rem 0.5rem; }
        }
      `}</style>

      {/* Synchronous inline initialization: guarantees window.config and window._ exist before any external scripts run */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.config = window.config || {
              config: {
                phoenixIsNavbarVerticalCollapsed: false,
                phoenixTheme: "light",
                phoenixNavbarTopStyle: "default",
                phoenixNavbarVerticalStyle: "default",
                phoenixNavbarPosition: "vertical",
                phoenixNavbarTopShape: "default",
                phoenixIsRTL: false,
                phoenixSupportChat: false
              },
              reset: function() {},
              set: function(e) {
                if (window.config && window.config.config) {
                  Object.assign(window.config.config, e);
                }
              }
            };
            window._ = window._ || {};
            window._.merge = window._.merge || function(target) {
              target = target || {};
              for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if (source && typeof source === 'object') {
                  for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                      target[key] = source[key];
                    }
                  }
                }
              }
              return target;
            };
          `,
        }}
      />

      {/* Phoenix Scripts */}
      <Script src="/site/assets/js/config.js" strategy="afterInteractive" />
      <Script src="/site/vendors/lodash/lodash.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/simplebar/simplebar.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/popper/popper.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/bootstrap/bootstrap.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/anchorjs/anchor.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/is/is.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/feather-icons/feather.min.js" strategy="afterInteractive" />
      <Script src="/site/vendors/dayjs/dayjs.min.js" strategy="afterInteractive" />
      <Script src="/site/assets/js/phoenix.js" strategy="lazyOnload" />

      {/* Page content — each page handles its own main/content wrapper */}
      {children}
    </div>
  );
}
