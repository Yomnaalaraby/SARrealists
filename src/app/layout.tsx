import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'SARrealists - NISAR Earth Observation',
  description: 'Interactive scrollytelling experience with NISAR SAR data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}