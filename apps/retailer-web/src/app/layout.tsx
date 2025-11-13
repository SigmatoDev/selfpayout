import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Selfcheckout Retailer Workspace',
  description: 'Mobile-friendly POS and inventory hub for shop owners'
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

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={inter.className}>
      <script dangerouslySetInnerHTML={{ __html: themeHydrationScript }} />
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
