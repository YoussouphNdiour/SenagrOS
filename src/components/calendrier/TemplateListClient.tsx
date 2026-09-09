'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cropTypeLabels } from '@/lib/validators/calendar.validator';
import { Trash2 } from 'lucide-react';

interface StageItem {
  name: string;
  order: number;
  durationDays: number;
  actions: string[];
}

export function TemplateListClient() {
  const router = useRouter();
  const t = useTranslations('calendrier');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.calendar.listTemplates.useQuery({
    search: search || undefined,
    page,
    limit: 25,
  });

  const deleteMutation = trpc.calendar.deleteTemplate.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder={t('searchTemplate')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">{tc('loading')}</p>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg font-medium">{t('noTemplates')}</p>
            <p className="mt-1 text-sm">{t('createFirstTemplate')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((template) => {
            const stages = (template.stages as StageItem[]) ?? [];
            return (
              <Card key={template.id}>
                <div className="flex items-start justify-between">
                  <Link
                    href={`/calendrier/templates/${template.id}`}
                    className="flex-1"
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="info">
                        {cropTypeLabels[template.cropType] ?? template.cropType}
                      </Badge>
                      {template.variety && (
                        <Badge variant="default">{template.variety}</Badge>
                      )}
                      <Badge variant="success">
                        {template.totalDays ?? 0} {t('templateDays')}
                      </Badge>
                      <Badge variant="default">
                        {stages.length} {t('templateStages')}
                      </Badge>
                    </div>
                    {stages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {stages
                          .sort((a, b) => a.order - b.order)
                          .map((stage) => (
                            <span
                              key={stage.order}
                              className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {stage.name} ({stage.durationDays}j)
                            </span>
                          ))}
                      </div>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('deleteTemplateConfirm'))) {
                        deleteMutation.mutate({ id: template.id });
                      }
                    }}
                    className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            {tc('previous')}
          </Button>
          <span className="text-sm text-gray-600">
            {tc('page')} {page} / {pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >
            {tc('next')}
          </Button>
        </div>
      )}
    </div>
  );
}
