import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import AppNavbar from '@/components/layout/AppNavbar';

export const metadata: Metadata = {
  title: 'Diplomas App',
  description: 'Crea diplomas y genera lotes desde Excel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppNavbar />
        {children}
      </body>
    </html>
  );
}
