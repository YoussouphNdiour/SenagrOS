import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StorefrontTabs } from '@/components/storefront/seller/StorefrontTabs';
import { auth } from '@/server/auth';

export default async function SellerStorefrontLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.farmId || session.user.role === 'viewer') redirect('/dashboard');

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Boutique en ligne</h1>
          <p className="text-sm text-gray-500">
            Vos ventes aux particuliers, superettes et grandes surfaces
          </p>
        </div>
        <Link
          href="/catalogue"
          target="_blank"
          className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline"
        >
          Voir la vitrine <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <StorefrontTabs />
      {children}
    </div>
  );
}
