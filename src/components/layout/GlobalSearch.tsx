'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Package,
  FileText,
  ClipboardList,
  X,
  Command,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const CATEGORY_CONFIG = {
  assets: {
    label: 'Assets',
    icon: Package,
    getHref: (id: string) => `/assets/${id}`,
  },
  logs: {
    label: 'Journal',
    icon: FileText,
    getHref: (id: string) => `/logs/${id}`,
  },
  plans: {
    label: 'Plans',
    icon: ClipboardList,
    getHref: (id: string) => `/plans/${id}`,
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { data, isFetching } = trpc.search.global.useQuery(
    { query: debouncedQuery, limit: 5 },
    {
      enabled: debouncedQuery.length >= 1,
    }
  );

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setIsOpen(false);
      setQuery('');
      router.push(href);
    },
    [router]
  );

  const hasResults =
    data &&
    (data.assets.length > 0 || data.logs.length > 0 || data.plans.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-20 text-sm text-gray-900 transition focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden items-center gap-0.5 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400 sm:flex">
              <Command className="h-3 w-3" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && debouncedQuery.length >= 1 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {isFetching && !data && (
            <div className="px-4 py-3 text-center text-sm text-gray-400">
              Recherche en cours...
            </div>
          )}

          {data && !hasResults && (
            <div className="px-4 py-3 text-center text-sm text-gray-400">
              Aucun résultat pour &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {data &&
            hasResults &&
            (Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key) => {
              const items = data[key];
              if (!items || items.length === 0) return null;
              const config = CATEGORY_CONFIG[key];
              const Icon = config.icon;

              return (
                <div key={key}>
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5">
                    <Icon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {config.label}
                    </span>
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(config.getHref(item.id))}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-green-50"
                    >
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
