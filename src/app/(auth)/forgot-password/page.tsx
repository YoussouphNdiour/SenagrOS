'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';

const forgotPasswordSchema = z.object({
  email: z.email('Email invalide'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (_data: ForgotPasswordForm) => {
    // Simulate a brief delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700">SenagrOS</h1>
          <p className="mt-2 text-gray-500">Reinitialiser votre mot de passe</p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              Si ce compte existe, un email de reinitialisation a ete envoye.
            </div>
            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
                Retour a la connexion
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer le lien de reinitialisation'}
            </button>
          </form>
        )}

        {!submitted && (
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
              Retour a la connexion
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
