import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/lib/auth-context';
import { CustomerLayoutWrapper } from '@/components/layout/CustomerLayoutWrapper';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CALVIER ROSSEL — Luxury Shoes & Bags',
  description: 'CALVIER ROSSEL is an internationally recognized luxury fashion house crafting timeless leather shoes and bags in limited editions.',
  authors: [{ name: 'CALVIER ROSSEL' }],
  openGraph: {
    title: 'CALVIER ROSSEL — Luxury Shoes & Bags',
    description: 'CALVIER ROSSEL is an internationally recognized luxury fashion house crafting timeless leather shoes and bags in limited editions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@calvierrossel',
    title: 'CALVIER ROSSEL — Luxury Shoes & Bags',
    description: 'CALVIER ROSSEL is an internationally recognized luxury fashion house crafting timeless leather shoes and bags in limited editions.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
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
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <CustomerLayoutWrapper>
              {children}
            </CustomerLayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
