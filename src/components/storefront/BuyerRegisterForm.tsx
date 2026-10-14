'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { registerBuyer } from '@/app/(storefront)/inscription-acheteur/actions';
import { Input } from '@/components/ui/Input';
import {
  BUYER_TYPES,
  buyerTypeLabels,
  buyerTypePriceLabels,
  type RegisterBuyerInput,
  registerBuyerSchema,
  SENEGAL_REGIONS,
} from '@/lib/validators/storefront.validator';

export function BuyerRegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterBuyerInput>({
    resolver: zodResolver(registerBuyerSchema),
    defaultValues: { buyerType: 'particulier', region: 'Dakar' },
  });
  const buyerType = watch('buyerType');

  const onSubmit = async (data: RegisterBuyerInput) => {
    setError('');
    const result = await registerBuyer(data);
    if (!result.ok) {
      setError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setFieldError(field as keyof RegisterBuyerInput, { message });
      }
      return;
    }
    const login = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (login?.error) {
      router.push('/login');
      return;
    }
    // Full navigation so the storefront layout picks up the new session
    window.location.href = callbackUrl;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">Vous êtes</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {BUYER_TYPES.map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer flex-col rounded-lg border-2 px-4 py-3 transition ${
                buyerType === type
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  value={type}
                  {...register('buyerType')}
                  className="accent-green-600"
                />
                <span className="text-sm font-medium text-gray-800">{buyerTypeLabels[type]}</span>
              </span>
              <span className="mt-1 text-xs text-gray-500">{buyerTypePriceLabels[type]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {buyerType !== 'particulier' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="companyName"
            label="Nom de l'enseigne"
            placeholder="Superette Baobab"
            error={errors.companyName?.message}
            {...register('companyName')}
          />
          <Input
            id="ninea"
            label={`NINEA${buyerType === 'grande_surface' ? '' : ' (facultatif)'}`}
            placeholder="005678901"
            error={errors.ninea?.message}
            {...register('ninea')}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="contactName"
          label="Nom complet"
          placeholder="Awa Ndiaye"
          error={errors.contactName?.message}
          {...register('contactName')}
        />
        <Input
          id="phone"
          type="tel"
          label="Téléphone"
          placeholder="77 123 45 67"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="awa@exemple.sn"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <Input
        id="address"
        label="Adresse de livraison"
        placeholder="Rue 10 x 13, Médina"
        error={errors.address?.message}
        {...register('address')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="city"
          label="Ville"
          placeholder="Dakar"
          error={errors.city?.message}
          {...register('city')}
        />
        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium text-gray-700">
            Région
          </label>
          <select
            id="region"
            {...register('region')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            {SENEGAL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Création du compte…' : 'Créer mon compte acheteur'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-green-600 hover:text-green-700"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
