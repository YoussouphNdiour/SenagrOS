import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BuyerRegisterForm } from '@/components/storefront/BuyerRegisterForm';
import { safeCallbackUrl } from '@/lib/utils/callback-url';
import { auth } from '@/server/auth';

export const metadata: Metadata = { title: 'Créer un compte acheteur — SenagrOS' };

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function BuyerRegisterPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(callbackUrl, '/catalogue');
  const session = await auth();
  if (session?.user?.role === 'buyer') redirect(target);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-800">Créer un compte acheteur</h1>
        <p className="mt-1 text-sm text-gray-500">
          Particuliers, superettes et grandes surfaces : profitez de prix adaptés à vos volumes.
        </p>
        <div className="mt-6">
          <BuyerRegisterForm callbackUrl={target} />
        </div>
      </div>
    </div>
  );
}
