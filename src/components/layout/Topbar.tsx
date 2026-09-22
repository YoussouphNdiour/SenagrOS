'use client';

import { Bell, LogOut, Menu, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { GlobalSearch } from './GlobalSearch';
import { FarmSwitcher } from './FarmSwitcher';
import { trpc } from '@/lib/trpc';

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  onMenuClick: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global Search - center/left area */}
      <div className="hidden flex-1 md:block">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        {/* Farm Switcher */}
        <FarmSwitcher />

        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount != null && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

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
          title="Déconnexion"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
