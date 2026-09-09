import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Scissors, Eye, Package, Droplets, Baby } from 'lucide-react';

export default async function QuickPage() {
  const t = await getTranslations('quick');

  const actions = [
    { label: t('harvest'), href: '/quick/harvest', icon: Scissors, color: 'bg-green-100 text-green-700' },
    { label: t('observation'), href: '/quick/observation', icon: Eye, color: 'bg-blue-100 text-blue-700' },
    { label: t('input'), href: '/quick/input', icon: Package, color: 'bg-orange-100 text-orange-700' },
    { label: t('irrigation'), href: '/quick/irrigation', icon: Droplets, color: 'bg-cyan-100 text-cyan-700' },
    { label: t('birth'), href: '/quick/birth', icon: Baby, color: 'bg-pink-100 text-pink-700' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800">{t('title')}</h1>
      <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className={`rounded-xl p-4 ${a.color}`}>
              <a.icon className="h-8 w-8" />
            </div>
            <span className="text-sm font-medium text-gray-700">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
