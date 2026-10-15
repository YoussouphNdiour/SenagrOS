'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';

const baseSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères'),
  email: z.email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  confirmPassword: z.string(),
  accountType: z.enum(['owner', 'worker']),
  // Owner fields
  farmName: z.string().optional(),
  farmDescription: z.string().optional(),
  // Worker field
  invitationCode: z.string().optional(),
});

const registerSchema = baseSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.accountType === 'owner') {
        return !!data.farmName && data.farmName.length >= 2;
      }
      return true;
    },
    {
      message: 'Le nom de la ferme est requis (min 2 caractères)',
      path: ['farmName'],
    }
  )
  .refine(
    (data) => {
      if (data.accountType === 'worker') {
        return !!data.invitationCode && data.invitationCode.length > 0;
      }
      return true;
    },
    {
      message: "Le code d'invitation est requis",
      path: ['invitationCode'],
    }
  );

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: 'owner' },
  });

  const accountType = watch('accountType');

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          accountType: data.accountType,
          farmName: data.farmName,
          farmDescription: data.farmDescription,
          invitationCode: data.invitationCode,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Erreur lors de l'inscription");
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('Erreur réseau');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700">SenagrOS</h1>
          <p className="mt-2 text-gray-500">Créer un nouveau compte</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Account type selector */}
          {/* fieldset/legend : c'est un groupe de boutons radio, pas un champ
              unique — un <label> n'y aurait aucun controle a designer. */}
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="mb-2 block text-sm font-medium text-gray-700">
              Type de compte
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition ${
                  accountType === 'owner'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value="owner"
                  {...register('accountType')}
                  className="sr-only"
                />
                <svg
                  aria-hidden="true"
                  className={`mb-2 h-8 w-8 ${accountType === 'owner' ? 'text-green-600' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5Z"
                  />
                </svg>
                <span className={`text-sm font-medium ${accountType === 'owner' ? 'text-green-700' : 'text-gray-600'}`}>
                  Propriétaire
                </span>
                <span className="mt-1 text-center text-xs text-gray-400">
                  Je crée ma ferme
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition ${
                  accountType === 'worker'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value="worker"
                  {...register('accountType')}
                  className="sr-only"
                />
                <svg
                  aria-hidden="true"
                  className={`mb-2 h-8 w-8 ${accountType === 'worker' ? 'text-green-600' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
                <span className={`text-sm font-medium ${accountType === 'worker' ? 'text-green-700' : 'text-gray-600'}`}>
                  Travailleur
                </span>
                <span className="mt-1 text-center text-xs text-gray-400">
                  J&apos;ai un code d&apos;invitation
                </span>
              </label>
            </div>
          </fieldset>

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="Moussa Diop"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="moussa@ferme.sn"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Farm name - owner only */}
          {accountType === 'owner' && (
            <>
              <div>
                <label htmlFor="farmName" className="mb-1 block text-sm font-medium text-gray-700">
                  Nom de la ferme
                </label>
                <input
                  id="farmName"
                  type="text"
                  {...register('farmName')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Ferme de Diamniadio"
                />
                {errors.farmName && (
                  <p className="mt-1 text-sm text-red-500">{errors.farmName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="farmDescription" className="mb-1 block text-sm font-medium text-gray-700">
                  Description <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  id="farmDescription"
                  type="text"
                  {...register('farmDescription')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Maraîchage et céréales"
                />
              </div>
            </>
          )}

          {/* Invitation code - worker only */}
          {accountType === 'worker' && (
            <div>
              <label htmlFor="invitationCode" className="mb-1 block text-sm font-medium text-gray-700">
                Code d&apos;invitation
              </label>
              <input
                id="invitationCode"
                type="text"
                {...register('invitationCode')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono tracking-widest focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="XXXX-XXXX-XXXX"
              />
              {errors.invitationCode && (
                <p className="mt-1 text-sm text-red-500">{errors.invitationCode.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Demandez ce code au propriétaire de la ferme
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Inscription...'
              : accountType === 'owner'
                ? 'Créer ma ferme'
                : 'Rejoindre la ferme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
