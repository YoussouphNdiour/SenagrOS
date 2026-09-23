'use client';

import {
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  Droplets,
  Home,
  Leaf,
  Map,
  MapPin,
  Package,
  Settings,
  Sprout,
  Tractor,
  Users,
  Warehouse,
  X,
  FileText,
  Wheat,
  Eye,
  Scissors,
  ShoppingCart,
  Wallet,
  Receipt,
  BookOpen,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

import type { LucideIcon } from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  section: string;
  items: NavLink[];
}

type NavItem = NavLink | NavSection;

function useNavItems(): NavItem[] {
  const t = useTranslations('nav');
  return [
    { label: t('dashboard'), href: '/dashboard', icon: Home },
    { label: t('quick'), href: '/quick', icon: Zap },
    { label: t('notifications'), href: '/notifications', icon: Bell },
    {
      section: 'Exploitation',
      items: [
        { label: t('assets'), href: '/assets', icon: Package },
        { label: t('parcelles'), href: '/assets/land', icon: Map },
        { label: 'Cultures', href: '/assets/plant', icon: Sprout },
        { label: t('animaux'), href: '/assets/animal', icon: Leaf },
        { label: t('equipements'), href: '/assets/equipment', icon: Tractor },
        { label: 'Carte NDVI', href: '/map', icon: MapPin },
      ],
    },
    {
      section: 'Production',
      items: [
        { label: t('logs'), href: '/logs', icon: FileText },
        { label: 'Activités', href: '/logs/activity', icon: ClipboardList },
        { label: 'Semis', href: '/logs/seeding', icon: Wheat },
        { label: t('observations'), href: '/observations', icon: Eye },
        { label: 'Récoltes', href: '/logs/harvest', icon: Scissors },
        { label: t('intrants'), href: '/intrants', icon: Package },
        { label: 'Irrigation', href: '/logs/irrigation', icon: Droplets },
        { label: t('calendar'), href: '/calendrier', icon: Calendar },
        { label: t('plans'), href: '/plans', icon: ClipboardList },
        { label: "Entretien PV", href: '/plans/pv', icon: Sprout },
      ],
    },
    {
      section: 'Ventes & Finances',
      items: [
        { label: 'Ventes', href: '/ventes', icon: ShoppingCart },
        { label: 'Finances', href: '/finances', icon: Wallet },
        { label: 'Facturation', href: '/facturation', icon: Receipt },
        { label: 'Comptabilité', href: '/comptabilite', icon: BookOpen },
      ],
    },
    {
      section: 'Gestion',
      items: [
        { label: t('stocks'), href: '/stocks', icon: Warehouse },
        { label: t('reports'), href: '/reports', icon: BarChart3 },
        { label: "TDB Élevage", href: '/reports/elevage', icon: Leaf },
        { label: "TDB Végétal", href: '/reports/vegetal', icon: Sprout },
        { label: t('employes'), href: '/employes', icon: Users },
        { label: t('parametres'), href: '/parametres', icon: Settings },
        { label: "KPIs personnalisés", href: '/parametres/kpis', icon: BarChart3 },
      ],
    },
  ];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = useNavItems();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-white shadow-lg transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-green-700">SenagrOS</span>
          </Link>
          <button onClick={onClose} className="md:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item, idx) => {
            if ('href' in item) {
              const link = item as NavLink;
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            }

            const group = item as NavSection;
            return (
              <div key={idx}>
                <p className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.section}
                </p>
                {group.items.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <SubIcon className="h-5 w-5" />
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
