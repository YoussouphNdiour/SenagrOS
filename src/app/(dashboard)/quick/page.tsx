import Link from 'next/link';
import { Scissors, Eye, Package, Droplets, Baby, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function QuickPage() {
  const t = await getTranslations('quick');

  const actions = [
    {
      label: t('harvest'),
      description: 'Enregistrer une récolte',
      href: '/quick/harvest',
      icon: Scissors,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: t('observation'),
      description: 'Saisir une observation terrain',
      href: '/quick/observation',
      icon: Eye,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: t('input'),
      description: 'Enregistrer une application',
      href: '/quick/input',
      icon: Package,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      label: t('irrigation'),
      description: 'Enregistrer un arrosage',
      href: '/quick/irrigation',
      icon: Droplets,
      color: 'bg-cyan-100 text-cyan-700',
    },
    {
      label: t('birth'),
      description: 'Déclarer une naissance',
      href: '/quick/birth',
      icon: Baby,
      color: 'bg-pink-100 text-pink-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>
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
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800">{a.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{a.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
