import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales } from '@/lib/i18n/config';

export function proxy(request: NextRequest) {
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (!localeCookie || !locales.includes(localeCookie as typeof locales[number])) {
    const acceptLang = request.headers.get('accept-language') || '';
    const detected = acceptLang.split(',').map(l => l.split(';')[0].trim().substring(0, 2))
      .find(l => locales.includes(l as typeof locales[number]));
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', detected || defaultLocale, { path: '/', maxAge: 365 * 24 * 60 * 60 });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|sw\\.js|.*\\..*).*)'],
};
