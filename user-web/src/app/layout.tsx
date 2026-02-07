import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import Providers from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Selfpayout',
  description: 'Scan, bag, and pay from your phone.'
};

const themeHydrationScript = `
(function() {
  try {
    var storageKey = 'selfcheckout-theme';
    var stored = window.localStorage.getItem(storageKey);
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersLight ? 'light' : 'dark');
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } catch (error) {
    document.documentElement.classList.add('dark');
  }
})();`.trim();

const unionIdHydrationScript = `
(function() {
  try {
    var storageKey = 'selfcheckout-union-id';
    var existing = window.localStorage.getItem(storageKey);
    if (existing) return;
    var id = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : 'uid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(storageKey, id);
  } catch (error) {
    // No-op if storage is unavailable.
  }
})();`.trim();

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={inter.className}>
      <script dangerouslySetInnerHTML={{ __html: themeHydrationScript }} />
      <script dangerouslySetInnerHTML={{ __html: unionIdHydrationScript }} />
      <Providers>
        <main className="flex min-h-screen w-screen flex-1 flex-col px-0 py-6">{children}</main>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
