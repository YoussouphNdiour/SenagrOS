'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sprout, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function FarmSwitcher() {
  const { data: farm } = trpc.search.currentFarm.useQuery();
  const farmName = farm?.name ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const displayName = farmName ?? 'Ma Ferme';

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <Sprout className="h-4 w-4 text-green-600" />
        <span className="hidden max-w-[120px] truncate sm:inline">
          {displayName}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Ferme active
            </p>
          </div>

          <div className="p-1">
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              <Sprout className="h-4 w-4" />
              <span className="truncate">{displayName}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 p-1">
            <button
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une ferme</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
