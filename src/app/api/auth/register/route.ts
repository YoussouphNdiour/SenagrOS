import bcrypt from 'bcryptjs';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { farmInvitations, farmMembers, farms, users } from '@/server/db/schema';

/**
 * Inscription, selon deux parcours.
 *
 * - proprietaire : cree la ferme, l'utilisateur et son rattachement.
 * - ouvrier      : rejoint une ferme existante via un code d'invitation.
 *
 * Chaque parcours s'execute dans une transaction : sans elle, un echec apres
 * la creation de la ferme laisserait une ferme orpheline sans proprietaire.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, accountType, farmName, farmDescription, invitationCode } = body;

    if (!name || !email || !password || !accountType) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (accountType !== 'owner' && accountType !== 'worker') {
      return NextResponse.json({ error: 'Type de compte invalide' }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (accountType === 'owner') {
      if (!farmName || farmName.length < 2) {
        return NextResponse.json(
          { error: 'Le nom de la ferme est requis (min 2 caractères)' },
          { status: 400 },
        );
      }

      await db.transaction(async (tx) => {
        const [farm] = await tx
          .insert(farms)
          .values({
            name: farmName,
            description: farmDescription || null,
            timezone: 'Africa/Dakar',
            currency: 'XOF',
            locale: 'fr',
            seasonType: 'hivernage',
          })
          .returning({ id: farms.id });

        const [user] = await tx
          .insert(users)
          .values({
            name,
            email,
            passwordHash,
            role: 'owner',
            farmId: farm.id,
            locale: 'fr',
            isActive: true,
          })
          .returning({ id: users.id });

        await tx.insert(farmMembers).values({
          farmId: farm.id,
          userId: user.id,
          role: 'owner',
        });
      });

      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Parcours ouvrier
    if (!invitationCode) {
      return NextResponse.json({ error: "Le code d'invitation est requis" }, { status: 400 });
    }

    const [invitation] = await db
      .select()
      .from(farmInvitations)
      .where(
        and(
          eq(farmInvitations.token, invitationCode.trim()),
          gt(farmInvitations.expiresAt, new Date()),
          isNull(farmInvitations.acceptedAt),
        ),
      )
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Code d'invitation invalide, expiré ou déjà utilisé" },
        { status: 400 },
      );
    }

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: invitation.role as 'owner' | 'manager' | 'worker' | 'viewer',
          farmId: invitation.farmId,
          locale: 'fr',
          isActive: true,
        })
        .returning({ id: users.id });

      await tx.insert(farmMembers).values({
        farmId: invitation.farmId,
        userId: user.id,
        role: invitation.role,
      });

      // Consommation du code dans la meme transaction que la creation du
      // compte : un code ne doit pas pouvoir servir deux fois.
      await tx
        .update(farmInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(farmInvitations.id, invitation.id));
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
