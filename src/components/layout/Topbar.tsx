'use client';

import { Bell, LogOut, Menu, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { SearchInput } from '@/components/ui/SearchInput';
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
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Open dropdown when there is a non-empty debounced query
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery();

  const { data: searchResults, isFetching } = trpc.search.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1 },
  );

  const hasResults =
    searchResults &&
    (searchResults.assets.length > 0 ||
      searchResults.logs.length > 0 ||
      searchResults.plans.length > 0);

  function handleResultClick(path: string) {
    setDropdownOpen(false);
    setSearchInput('');
    setDebouncedQuery('');
    router.push(path);
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-3 md:flex">
        <FarmSwitcher currentFarmName={user.farmName} />
      </div>

      {/* Search — hidden on mobile, visible on md+ */}
      <div ref={containerRef} className="relative hidden w-72 md:block">
        <SearchInput
          value={searchInput}
          onChange={(val) => setSearchInput(val)}
          placeholder={tCommon('search')}
        />

        {dropdownOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {isFetching && (
              <div className="px-4 py-3 text-sm text-gray-500">{tCommon('loading')}</div>
            )}

            {!isFetching && !hasResults && (
              <div className="px-4 py-3 text-sm text-gray-500">{tCommon('noResult')}</div>
            )}

            {!isFetching && hasResults && (
              <div className="divide-y divide-gray-100">
                {searchResults.assets.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t('assets')}
                    </p>
                    {searchResults.assets.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => handleResultClick(`/assets/${item.id}`)}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.type}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.logs.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t('logs')}
                    </p>
                    {searchResults.logs.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => handleResultClick(`/logs/${item.id}`)}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.type}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.plans.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t('plans')}
                    </p>
                    {searchResults.plans.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => handleResultClick(`/plans/${item.id}`)}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <RoleSwitcher />
        </div>
        <LocaleSwitcher />
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
          type="button"
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
