import { redirect } from 'next/navigation';
import { auth } from '../auth';
import { db } from '../db';
import { getBuyerProfileByUserId } from './storefront.service';

/** Server Components: returns the logged-in buyer profile or redirects to login/registration. */
export async function requireBuyerPage(callbackUrl: string) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  const profile = await getBuyerProfileByUserId(db, session.user.id);
  if (!profile) redirect(`/inscription-acheteur?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return { session, profile };
}
