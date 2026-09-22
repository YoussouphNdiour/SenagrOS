'use client';

import { useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';

export function LocaleSwitcher() {
  const router = useRouter();

  function handleChange(newLocale: Locale) {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    router.refresh();
  }

  // Read current locale from cookie
  const currentLocale = (typeof document !== 'undefined'
    ? document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1]
    : undefined) ?? 'fr';

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleChange(l)}
          className={`rounded px-2 py-1 text-xs font-medium transition ${
            l === currentLocale
              ? 'bg-green-100 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
