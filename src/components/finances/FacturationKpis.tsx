'use client';

import { FileText, Receipt } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KpiCard } from '@/components/ui/KpiCard';

export function FacturationKpis() {
  const { data } = trpc.finance.invoiceKpis.useQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        title="Devis"
        value={data?.devis ?? 0}
        icon={FileText}
        color="green"
      />
      <KpiCard
        title="Pro Forma"
        value={data?.proforma ?? 0}
        icon={FileText}
        color="green"
      />
      <KpiCard
        title="Factures de vente"
        value={data?.factures ?? 0}
        icon={Receipt}
        color="orange"
      />
    </div>
  );
}
