import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SelfPayout Super Admin',
  description: 'Control center for retailer onboarding and subscriptions'
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={inter.className}>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default AppLayout;
