import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

/** FreshCart-style breadcrumb: green links, gray current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="py-5 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="text-brand hover:text-brand-dark">
            Accueil
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="text-brand hover:text-brand-dark">
                {item.label}
              </Link>
            ) : (
              <span className="text-muted" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
