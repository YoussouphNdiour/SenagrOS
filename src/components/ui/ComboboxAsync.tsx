'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ComboboxAsyncProps<T> {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  searchFn: (query: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  disabled?: boolean;
  className?: string;
}

export function ComboboxAsync<T>({
  label,
  error,
  placeholder,
  value,
  onChange,
  searchFn,
  getLabel,
  getValue,
  disabled = false,
  className = '',
}: ComboboxAsyncProps<T>) {
  const t = useTranslations('common');
  const resolvedPlaceholder = placeholder ?? t('search');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Find the label for the current value when items change
  useEffect(() => {
    if (value && items.length > 0) {
      const found = items.find((item) => getValue(item) === value);
      if (found) {
        setSelectedLabel(getLabel(found));
      }
    }
    if (!value) {
      setSelectedLabel('');
    }
  }, [value, items, getLabel, getValue]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await searchFn(searchQuery);
          setItems(results);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [searchFn],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedLabel('');
    setIsOpen(true);
    handleSearch(val);
  };

  const handleSelect = (item: T) => {
    const itemValue = getValue(item);
    const itemLabel = getLabel(item);
    onChange(itemValue);
    setSelectedLabel(itemLabel);
    setQuery('');
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    handleSearch(query);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const borderClass = error
    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200'
    : 'border-gray-300 focus-within:border-green-500 focus-within:ring-green-200';

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div
        className={`flex w-full items-center rounded-lg border text-sm transition focus-within:outline-none focus-within:ring-2 ${borderClass} ${className}`}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          value={selectedLabel || query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading ? (
          <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-gray-400" />
        ) : (
          <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {isLoading && items.length === 0 ? (
            <li className="flex items-center justify-center px-4 py-3 text-sm text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('loading')}
            </li>
          ) : items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400">{t('noResult')}</li>
          ) : (
            items.map((item) => {
              const itemValue = getValue(item);
              const isSelected = itemValue === value;
              return (
                <li
                  key={itemValue}
                  onClick={() => handleSelect(item)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                    isSelected ? 'bg-green-100 font-medium text-green-800' : 'hover:bg-green-50'
                  }`}
                >
                  {getLabel(item)}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

ComboboxAsync.displayName = 'ComboboxAsync';

// --- Multi-select variant ---

interface ComboboxAsyncMultiProps<T> {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string[];
  onChange: (values: string[]) => void;
  searchFn: (query: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  disabled?: boolean;
  className?: string;
}

export function ComboboxAsyncMulti<T>({
  label,
  error,
  placeholder,
  value = [],
  onChange,
  searchFn,
  getLabel,
  getValue,
  disabled = false,
  className = '',
}: ComboboxAsyncMultiProps<T>) {
  const t = useTranslations('common');
  const resolvedPlaceholder = placeholder ?? t('search');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<Map<string, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Track labels for selected values
  useEffect(() => {
    if (items.length > 0) {
      setSelectedLabels((prev) => {
        const next = new Map(prev);
        for (const item of items) {
          const itemValue = getValue(item);
          if (value.includes(itemValue)) {
            next.set(itemValue, getLabel(item));
          }
        }
        return next;
      });
    }
  }, [value, items, getLabel, getValue]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await searchFn(searchQuery);
          setItems(results);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [searchFn],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    handleSearch(val);
  };

  const handleSelect = (item: T) => {
    const itemValue = getValue(item);
    const itemLabel = getLabel(item);
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue));
      setSelectedLabels((prev) => {
        const next = new Map(prev);
        next.delete(itemValue);
        return next;
      });
    } else {
      onChange([...value, itemValue]);
      setSelectedLabels((prev) => new Map(prev).set(itemValue, itemLabel));
    }
    setQuery('');
  };

  const handleRemove = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
    setSelectedLabels((prev) => {
      const next = new Map(prev);
      next.delete(itemValue);
      return next;
    });
  };

  const handleFocus = () => {
    setIsOpen(true);
    handleSearch(query);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const borderClass = error
    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200'
    : 'border-gray-300 focus-within:border-green-500 focus-within:ring-green-200';

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      )}

      {value.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
            >
              {selectedLabels.get(v) || v}
              <button
                type="button"
                onClick={() => handleRemove(v)}
                disabled={disabled}
                className="rounded-full p-0.5 transition hover:bg-green-200 disabled:cursor-not-allowed"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className={`flex w-full items-center rounded-lg border text-sm transition focus-within:outline-none focus-within:ring-2 ${borderClass} ${className}`}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading ? (
          <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-gray-400" />
        ) : (
          <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-gray-400" />
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {isLoading && items.length === 0 ? (
            <li className="flex items-center justify-center px-4 py-3 text-sm text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('loading')}
            </li>
          ) : items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400">{t('noResult')}</li>
          ) : (
            items.map((item) => {
              const itemValue = getValue(item);
              const isSelected = value.includes(itemValue);
              return (
                <li
                  key={itemValue}
                  onClick={() => handleSelect(item)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                    isSelected ? 'bg-green-100 font-medium text-green-800' : 'hover:bg-green-50'
                  }`}
                >
                  {getLabel(item)}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

ComboboxAsyncMulti.displayName = 'ComboboxAsyncMulti';
