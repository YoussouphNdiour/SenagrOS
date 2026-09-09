'use client';

import { Bell, LogOut, Menu, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { FarmSwitcher } from './FarmSwitcher';
import { RoleSwitcher } from './RoleSwitcher';

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    farmName?: string | null;
  };
  onMenuClick: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const t = useTranslations('nav');

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-3 md:flex">
        <FarmSwitcher currentFarmName={user.farmName} />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <RoleSwitcher />
        </div>
        <LocaleSwitcher />
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <User className="h-4 w-4 text-green-700" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          title={t('logout')}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
