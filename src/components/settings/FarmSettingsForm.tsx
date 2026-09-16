'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const farmSettingsSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  description: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FarmSettingsInput = z.infer<typeof farmSettingsSchema>;

interface FarmSettingsFormProps {
  farmId: string;
}

export function FarmSettingsForm({ farmId }: FarmSettingsFormProps) {
  const [success, setSuccess] = useState(false);

  // farmId will be used when tRPC query is connected
  void farmId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FarmSettingsInput>({
    resolver: zodResolver(farmSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      latitude: '',
      longitude: '',
    },
  });

  const onSubmit = async (_values: FarmSettingsInput) => {
    // TODO: Connect to tRPC mutation when available
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Informations de l&apos;exploitation</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom de l'exploitation"
            placeholder="Ex: Ferme de Diama"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Description"
            placeholder="Description de l'exploitation..."
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Latitude"
            placeholder="Ex: 16.5167"
            error={errors.latitude?.message}
            {...register('latitude')}
          />
          <Input
            label="Longitude"
            placeholder="Ex: -15.4333"
            error={errors.longitude?.message}
            {...register('longitude')}
          />
        </div>

        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Parametres de l&apos;exploitation mis a jour avec succes
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
