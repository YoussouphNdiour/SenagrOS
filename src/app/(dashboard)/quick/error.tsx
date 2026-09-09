'use client';

import { useTranslations } from 'next-intl';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tc = useTranslations('common');

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-red-600">{tc('error')}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
      >
        {tc('retry')}
      </button>
    </div>
  );
}
