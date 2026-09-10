import Link from 'next/link';
import { Building2, Users, Globe, Bell } from 'lucide-react';

const settingsLinks = [
  {
    title: 'Coopérative',
    description: 'Gérer les coopératives, inviter des fermes',
    href: '/parametres/cooperative',
    icon: Building2,
  },
  {
    title: 'Membres',
    description: 'Gérer les rôles et permissions des membres',
    href: '/employes',
    icon: Users,
  },
  {
    title: 'Langue & Région',
    description: 'Langue d\'affichage, fuseau horaire, devise',
    href: '/parametres/region',
    icon: Globe,
  },
  {
    title: 'Notifications',
    description: 'Alertes de stock, rappels de calendrier',
    href: '/parametres/notifications',
    icon: Bell,
  },
];

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configuration de l&apos;exploitation
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-green-300 hover:bg-green-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <Icon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{link.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
