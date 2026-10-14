'use client';

import { useMemo } from 'react';
import { useCart } from '@/components/storefront/CartProvider';
import { trpc } from '@/lib/trpc';
import { computeOrderTotals } from '@/lib/validators/order.validator';

/**
 * Prices the cart server-side for the current visitor and groups it by seller
 * farm (one order per farm), with each farm's delivery zones and selected fee.
 */
export function useCartQuote() {
  const cart = useCart();
  const quote = trpc.storefront.quote.useQuery(
    { items: cart.items },
    { enabled: cart.ready && cart.items.length > 0, placeholderData: (prev) => prev },
  );
  const lines = useMemo(
    () => (cart.items.length ? (quote.data?.lines ?? []) : []),
    [cart.items.length, quote.data],
  );
  const farmIds = useMemo(() => [...new Set(lines.map((l) => l.farmId))], [lines]);
  const zones = trpc.storefront.listZones.useQuery({ farmIds }, { enabled: farmIds.length > 0 });

  const groups = useMemo(
    () =>
      farmIds.map((farmId) => {
        const farmLines = lines.filter((l) => l.farmId === farmId);
        const farmZones = (zones.data ?? []).filter((z) => z.farmId === farmId);
        const zone = farmZones.find((z) => z.id === cart.zoneByFarm[farmId]) ?? null;
        const totals = computeOrderTotals(farmLines, zone ? Number(zone.deliveryFee) : 0);
        const minOrder = zone ? Number(zone.minOrderAmount ?? 0) : 0;
        return {
          farmId,
          farmName: farmLines[0]?.farmName ?? '',
          lines: farmLines,
          zones: farmZones,
          zone,
          totals,
          belowMinimum: zone !== null && totals.subtotal < minOrder,
          minOrder,
        };
      }),
    [farmIds, lines, zones.data, cart.zoneByFarm],
  );

  const subtotal = groups.reduce((s, g) => s + g.totals.subtotal, 0);
  const deliveryFee = groups.reduce((s, g) => s + g.totals.deliveryFee, 0);
  const issues = lines.filter(
    (l) => l.quantity < l.minOrderQuantity || l.quantity > l.stockAvailable,
  );

  return {
    cart,
    isLoading: !cart.ready || (cart.items.length > 0 && quote.isLoading),
    buyerType: quote.data?.buyerType ?? null,
    unavailable: quote.data?.unavailable ?? [],
    groups,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    allZonesChosen: groups.every((g) => g.zone !== null),
    hasIssues: issues.length > 0 || groups.some((g) => g.belowMinimum),
  };
}
