'use client';

import { FileText, Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

export function FacturationKpis() {
  const t = useTranslations('finances');
  const { data } = trpc.finance.invoiceKpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        title={t('kpiDevis')}
        value={data?.devis ?? 0}
        icon={FileText}
        color="green"
      />
      <KpiCard
        title={t('kpiProForma')}
        value={data?.proforma ?? 0}
        icon={FileText}
        color="green"
      />
      <KpiCard
        title={t('kpiFactures')}
        value={data?.factures ?? 0}
        icon={Receipt}
        color="orange"
      />
    </div>
  );
}
