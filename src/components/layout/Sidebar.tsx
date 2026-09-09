'use client';

import {
  BarChart3,
  Building2,
  Calendar,
  ClipboardList,
  Droplets,
  Home,
  Leaf,
  Map,
  Package,
  Sprout,
  Store,
  Tractor,
  X,
  FileText,
  Wheat,
  Eye,
  Scissors,
  ShoppingCart,
  Wallet,
  Receipt,
  BookOpen,
  ClipboardCheck,
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
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  sectionKey: string;
  items: NavLink[];
}

type NavItem = NavLink | NavSection;

const navItems: NavItem[] = [
  { labelKey: 'dashboard', href: '/dashboard', icon: Home },
  {
    sectionKey: 'sectionExploitation',
    items: [
      { labelKey: 'assets', href: '/assets', icon: Package },
      { labelKey: 'parcelles', href: '/assets/land', icon: Map },
      { labelKey: 'cultures', href: '/assets/plant', icon: Sprout },
      { labelKey: 'animaux', href: '/assets/animal', icon: Leaf },
      { labelKey: 'equipements', href: '/assets/equipment', icon: Tractor },
    ],
  },
  {
    sectionKey: 'sectionProduction',
    items: [
      { labelKey: 'journal', href: '/logs', icon: FileText },
      { labelKey: 'activites', href: '/logs/activity', icon: ClipboardList },
      { labelKey: 'semis', href: '/logs/seeding', icon: Wheat },
      { labelKey: 'observations', href: '/observations', icon: Eye },
      { labelKey: 'recoltes', href: '/logs/harvest', icon: Scissors },
      { labelKey: 'intrants', href: '/intrants', icon: Package },
      { labelKey: 'irrigation', href: '/logs/irrigation', icon: Droplets },
      { labelKey: 'calendrier', href: '/calendrier', icon: Calendar },
      { labelKey: 'plans', href: '/plans', icon: ClipboardList },
    ],
  },
  {
    sectionKey: 'sectionSalesFinances',
    items: [
      { labelKey: 'ventes', href: '/ventes', icon: ShoppingCart },
      { labelKey: 'finances', href: '/finances', icon: Wallet },
      { labelKey: 'facturation', href: '/facturation', icon: Receipt },
      { labelKey: 'comptabilite', href: '/comptabilite', icon: BookOpen },
    ],
  },
  {
    sectionKey: 'sectionMarketplace',
    items: [
      { labelKey: 'marketplace', href: '/marketplace', icon: Store },
      { labelKey: 'mesProduits', href: '/produits', icon: Package },
      { labelKey: 'commandes', href: '/commandes', icon: ClipboardCheck },
    ],
  },
  {
    sectionKey: 'sectionCooperatives',
    items: [
      { labelKey: 'cooperatives', href: '/parametres/cooperative', icon: Building2 },
    ],
  },
  {
    sectionKey: 'sectionManagement',
    items: [
      { labelKey: 'rapports', href: '/reports', icon: BarChart3 },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');

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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 md:static md:translate-x-0 ${
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
                  {t(link.labelKey)}
                </Link>
              );
            }

            const group = item as NavSection;
            return (
              <div key={idx}>
                <p className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t(group.sectionKey)}
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
                      {t(subItem.labelKey)}
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
