import { Camera, Globe, Mail, MessageCircle, Phone, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import {
  type ListingCategory,
  listingCategoryEnum,
  listingCategoryLabels,
} from '@/lib/validators/storefront.validator';

const COLUMNS = [
  {
    title: 'SenagrOS',
    links: [
      { href: '/#comment-ca-marche', label: 'Comment ça marche' },
      { href: '/#producteurs', label: 'Nos producteurs' },
      { href: '/catalogue?bio=1', label: 'Produits bio' },
    ],
  },
  {
    title: 'Clients',
    links: [
      { href: '/inscription-acheteur', label: 'Créer un compte acheteur' },
      { href: '/mes-commandes', label: 'Mes commandes' },
      { href: '/panier', label: 'Mon panier' },
    ],
  },
  {
    title: 'Producteurs',
    links: [
      { href: '/login', label: 'Espace producteur' },
      { href: '/register', label: 'Vendre sur SenagrOS' },
    ],
  },
];

const PAYMENTS = ['Paiement à la livraison', 'Wave', 'Orange Money'];

export function StorefrontFooter() {
  return (
    <footer className="mt-20 bg-surface text-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="flex items-center gap-2 text-xl font-bold">
            <ShoppingBasket className="h-6 w-6 text-brand" aria-hidden /> SenagrOS
          </p>
          <p className="mt-3 text-sm text-muted">
            Des produits frais, directement des fermes sénégalaises à votre table.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" aria-hidden /> +221 33 800 00 00
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" aria-hidden /> contact@senagros.sn
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 font-semibold">Rayons</p>
          <ul className="space-y-2.5 text-sm text-muted">
            {listingCategoryEnum.options.map((c: ListingCategory) => (
              <li key={c}>
                <Link href={`/catalogue?categorie=${c}`} className="hover:text-brand">
                  {listingCategoryLabels[c]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-4 font-semibold">{col.title}</p>
            <ul className="space-y-2.5 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold">Moyens de paiement</p>
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <p className="mr-1 text-sm text-muted">Suivez-nous</p>
            <a href="https://facebook.com" aria-label="Facebook" className="rounded border border-line bg-white p-2 text-muted hover:text-brand">
              <Globe className="h-4 w-4" aria-hidden />
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="rounded border border-line bg-white p-2 text-muted hover:text-brand">
              <Camera className="h-4 w-4" aria-hidden />
            </a>
            <a href="https://wa.me/221338000000" aria-label="WhatsApp" className="rounded border border-line bg-white p-2 text-muted hover:text-brand">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
        <p className="py-6 text-sm text-muted">
          © {new Date().getFullYear()} SenagrOS — Du champ à votre table, au Sénégal.
        </p>
      </div>
    </footer>
  );
}
