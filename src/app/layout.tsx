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
  other: {
    'theme-color': '#16a34a',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SenagrOS',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (locales.includes(cookieStore.get('NEXT_LOCALE')?.value as Locale)
    ? cookieStore.get('NEXT_LOCALE')!.value : defaultLocale) as Locale;

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
