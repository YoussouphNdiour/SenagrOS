import { Suspense } from 'react';
import { CartProvider } from '@/components/storefront/CartProvider';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { auth } from '@/server/auth';

/** Public storefront layout: no sidebar / BottomNav, simple header + footer. */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null;

  return (
    <CartProvider isBuyer={user?.role === 'buyer'}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Suspense fallback={<div className="h-[61px] border-b border-gray-100 bg-white" />}>
          <StorefrontHeader user={user} />
        </Suspense>
        <main className="flex-1">{children}</main>
        <StorefrontFooter />
      </div>
    </CartProvider>
  );
}
