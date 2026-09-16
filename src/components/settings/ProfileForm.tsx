'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const profileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  email: z.string().email('Email invalide'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Minimum 6 caracteres'),
    newPassword: z.string().min(6, 'Minimum 6 caracteres'),
    confirmPassword: z.string().min(6, 'Minimum 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (_values: ProfileInput) => {
    // TODO: Connect to tRPC mutation when available
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const onPasswordSubmit = async (_values: PasswordInput) => {
    // TODO: Connect to tRPC mutation when available
    setPasswordSuccess(true);
    resetPassword();
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations personnelles</h3>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nom"
              placeholder="Votre nom"
              error={profileErrors.name?.message}
              {...registerProfile('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              error={profileErrors.email?.message}
              {...registerProfile('email')}
            />
          </div>

          {profileSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Profil mis a jour avec succes
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={profileSubmitting}>
              {profileSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password change */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Changer le mot de passe</h3>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            placeholder="********"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword('currentPassword')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="********"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="********"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />
          </div>

          {passwordSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Mot de passe mis a jour avec succes
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={passwordSubmitting}>
              {passwordSubmitting ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
