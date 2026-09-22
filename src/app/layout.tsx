import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from '@/components/Providers';
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SenagrOS — Système de Gestion Agricole',
  description: 'FMIS open-source pour les exploitations agricoles d\'Afrique de l\'Ouest',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : defaultLocale;

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SenagrOS" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
