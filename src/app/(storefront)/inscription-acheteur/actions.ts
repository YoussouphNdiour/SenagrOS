'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import {
  type RegisterBuyerInput,
  registerBuyerSchema,
} from '@/lib/validators/storefront.validator';
import { db } from '@/server/db';
import { buyerProfiles, users } from '@/server/db/schema';

export type RegisterBuyerResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Creates a storefront buyer account (users.role = buyer) and its buyer profile. */
export async function registerBuyer(input: RegisterBuyerInput): Promise<RegisterBuyerResult> {
  const parsed = registerBuyerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: 'Formulaire invalide', fieldErrors };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return {
      ok: false,
      error: 'Un compte existe déjà avec cet email',
      fieldErrors: { email: 'Email déjà utilisé' },
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email,
        name: data.contactName,
        passwordHash,
        role: 'buyer',
        locale: 'fr',
        isActive: true,
      })
      .returning({ id: users.id });
    await tx.insert(buyerProfiles).values({
      userId: user.id,
      buyerType: data.buyerType,
      companyName: data.buyerType === 'particulier' ? null : data.companyName,
      contactName: data.contactName,
      phone: data.phone,
      email,
      address: data.address,
      city: data.city,
      region: data.region,
      ninea: data.buyerType === 'particulier' ? null : data.ninea || null,
    });
  });
  return { ok: true };
}
