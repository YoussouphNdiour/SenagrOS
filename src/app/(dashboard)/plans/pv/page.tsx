import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { PvPlansClient } from '@/components/plans/PvPlansClient';

export const metadata = { title: "Plans d'entretien PV — SenagrOS" };

export default async function PvPlansPage() {
  const session = await auth();
  if (!session?.user?.farmId) {
    redirect('/dashboard');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plans d&apos;entretien PV</h1>
          <p className="mt-1 text-sm text-gray-500">
            Planifiez les interventions agronomiques : désherbage, traitements phytosanitaires, apports d&apos;engrais
          </p>
        </div>
      </div>

      <PvPlansClient />
    </div>
  );
}
