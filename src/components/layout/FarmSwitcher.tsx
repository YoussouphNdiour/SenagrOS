'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Home, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface FarmSwitcherProps {
  currentFarmName?: string | null;
}

export function FarmSwitcher({ currentFarmName }: FarmSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: coopFarms } = trpc.cooperative.myCooperativeFarms.useQuery();

  // Group by cooperative
  const grouped = new Map<string, { cooperativeName: string; farms: { farmId: string; farmName: string }[] }>();
  if (coopFarms) {
    for (const cf of coopFarms) {
      if (!grouped.has(cf.cooperativeId)) {
        grouped.set(cf.cooperativeId, {
          cooperativeName: cf.cooperativeName,
          farms: [],
        });
      }
      grouped.get(cf.cooperativeId)?.farms.push({
        farmId: cf.farmId,
        farmName: cf.farmName,
      });
    }
  }

  const hasCoopFarms = grouped.size > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 transition"
      >
        <Home className="h-4 w-4 text-green-600" />
        <span className="max-w-[140px] truncate font-medium text-gray-700">
          {currentFarmName ?? 'Ma ferme'}
        </span>
        {hasCoopFarms && <ChevronDown className="h-3 w-3 text-gray-400" />}
      </button>

      {isOpen && hasCoopFarms && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay dismiss pattern */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay dismiss pattern */}
          <div
            role="presentation"
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
            {/* Current farm */}
            <div className="border-b border-gray-100 px-3 pb-2">
              <p className="text-xs font-semibold uppercase text-gray-400">Ma ferme</p>
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-green-50 px-2 py-1.5">
                <Home className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {currentFarmName ?? 'Ma ferme'}
                </span>
              </div>
            </div>

            {/* Cooperative farms */}
            {Array.from(grouped.entries()).map(([coopId, group]) => (
              <div key={coopId} className="px-3 pt-2">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase text-gray-400">
                  <Users className="h-3 w-3" />
                  {group.cooperativeName}
                </p>
                <div className="mt-1 space-y-0.5">
                  {group.farms.map((farm) => (
                    <div
                      key={farm.farmId}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600"
                    >
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {farm.farmName}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
