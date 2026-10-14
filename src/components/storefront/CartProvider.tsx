'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { trpc } from '@/lib/trpc';

export interface CartLine {
  listingId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  ready: boolean;
  add: (listingId: string, quantity: number) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  remove: (listingId: string) => void;
  clear: () => void;
  zoneByFarm: Record<string, string>;
  setZone: (farmId: string, zoneId: string) => void;
}

const CART_KEY = 'senagros.cart';
const ZONES_KEY = 'senagros.cart.zones';

const CartContext = createContext<CartContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode): cart stays in memory
  }
}

/** Merges two carts, keeping the larger quantity when a product is in both. */
function mergeCarts(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const line of [...a, ...b]) {
    map.set(line.listingId, Math.max(map.get(line.listingId) ?? 0, line.quantity));
  }
  return [...map].map(([listingId, quantity]) => ({ listingId, quantity }));
}

/**
 * Cart state. Always mirrored in localStorage; for logged-in buyers it is also
 * persisted in the database (buyer_profiles.data.cart) and merged on login.
 */
export function CartProvider({
  isBuyer,
  children,
}: {
  isBuyer: boolean;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [zoneByFarm, setZoneByFarm] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const synced = useRef(false);

  const serverCart = trpc.order.getCart.useQuery(undefined, {
    enabled: isBuyer,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const saveCart = trpc.order.saveCart.useMutation();
  const saveRef = useRef(saveCart.mutate);
  saveRef.current = saveCart.mutate;

  useEffect(() => {
    setItems(readStorage<CartLine[]>(CART_KEY, []));
    setZoneByFarm(readStorage<Record<string, string>>(ZONES_KEY, {}));
    if (!isBuyer) setReady(true);
  }, [isBuyer]);

  // Login merge: local cart + DB cart, then persist the result in both places
  useEffect(() => {
    if (!isBuyer || synced.current || !serverCart.data) return;
    synced.current = true;
    const merged = mergeCarts(readStorage<CartLine[]>(CART_KEY, []), serverCart.data);
    setItems(merged);
    writeStorage(CART_KEY, merged);
    saveRef.current({ items: merged });
    setReady(true);
  }, [isBuyer, serverCart.data]);

  useEffect(() => {
    if (isBuyer && serverCart.isError) setReady(true);
  }, [isBuyer, serverCart.isError]);

  // Persist every change made after the initial load (localStorage + DB for buyers)
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    writeStorage(CART_KEY, items);
    if (isBuyer && synced.current) saveRef.current({ items });
  }, [items, isBuyer]);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    dirty.current = true;
    setItems(fn);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      ready,
      add: (listingId, quantity) =>
        update((prev) => {
          const existing = prev.find((l) => l.listingId === listingId);
          return existing
            ? prev.map((l) =>
                l.listingId === listingId ? { ...l, quantity: l.quantity + quantity } : l,
              )
            : [...prev, { listingId, quantity }];
        }),
      setQuantity: (listingId, quantity) =>
        update((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.listingId !== listingId)
            : prev.map((l) => (l.listingId === listingId ? { ...l, quantity } : l)),
        ),
      remove: (listingId) => update((prev) => prev.filter((l) => l.listingId !== listingId)),
      clear: () => update(() => []),
      zoneByFarm,
      setZone: (farmId, zoneId) =>
        setZoneByFarm((prev) => {
          const next = { ...prev, [farmId]: zoneId };
          writeStorage(ZONES_KEY, next);
          return next;
        }),
    }),
    [items, ready, update, zoneByFarm],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
