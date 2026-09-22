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

const navItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: Home },
  { label: 'Actions rapides', href: '/quick', icon: Zap },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  {
    section: 'Exploitation',
    items: [
      { label: 'Assets', href: '/assets', icon: Package },
      { label: 'Parcelles', href: '/assets/land', icon: Map },
      { label: 'Cultures', href: '/assets/plant', icon: Sprout },
      { label: 'Animaux', href: '/assets/animal', icon: Leaf },
      { label: 'Equipements', href: '/assets/equipment', icon: Tractor },
      { label: 'Carte NDVI', href: '/map', icon: MapPin },
    ],
  },
  {
    section: 'Production',
    items: [
      { label: 'Journal', href: '/logs', icon: FileText },
      { label: 'Activités', href: '/logs/activity', icon: ClipboardList },
      { label: 'Semis', href: '/logs/seeding', icon: Wheat },
      { label: 'Observations', href: '/observations', icon: Eye },
      { label: 'Récoltes', href: '/logs/harvest', icon: Scissors },
      { label: 'Intrants', href: '/intrants', icon: Package },
      { label: 'Irrigation', href: '/logs/irrigation', icon: Droplets },
      { label: 'Calendrier', href: '/calendrier', icon: Calendar },
      { label: 'Plans', href: '/plans', icon: ClipboardList },
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
      { label: 'Stocks', href: '/stocks', icon: Warehouse },
      { label: 'Rapports', href: '/reports', icon: BarChart3 },
      { label: 'Employés', href: '/employes', icon: Users },
      { label: 'Paramètres', href: '/parametres', icon: Settings },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
