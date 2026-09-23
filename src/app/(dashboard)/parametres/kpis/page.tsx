'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Trash2, ChevronDown, ChevronUp, BarChart3, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_OPTIONS = [
  { value: 'elevage', label: 'Élevage' },
  { value: 'vegetal', label: 'Végétal' },
  { value: 'finance', label: 'Finance' },
  { value: 'autre', label: 'Autre' },
];

const VALUE_TYPE_OPTIONS = [
  { value: 'number', label: 'Nombre' },
  { value: 'percentage', label: 'Pourcentage (%)' },
  { value: 'currency', label: 'Montant (FCFA)' },
];

const categoryColor: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  elevage: 'warning',
  vegetal: 'success',
  finance: 'info',
  autre: 'default',
};

// ---- Create KPI Modal ----
function CreateKpiModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [valueType, setValueType] = useState<'number' | 'percentage' | 'currency'>('number');
  const [category, setCategory] = useState<'elevage' | 'vegetal' | 'finance' | 'autre'>('autre');
  const [targetValue, setTargetValue] = useState('');
  const [error, setError] = useState('');

  const create = trpc.farmKpi.createDefinition.useMutation({
    onSuccess: () => { onCreated(); onClose(); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Nouvel indicateur</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nom *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Taux de mise bas 2026" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explication de cet indicateur" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Catégorie</label>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type de valeur</label>
              <Select
                options={VALUE_TYPE_OPTIONS}
                value={valueType}
                onChange={(e) => setValueType(e.target.value as typeof valueType)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unité</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, kg/ha, FCFA..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Valeur cible</label>
              <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Objectif" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => {
              if (!name.trim()) { setError('Le nom est requis'); return; }
              create.mutate({
                name: name.trim(),
                description: description || undefined,
                unit: unit || undefined,
                valueType,
                category,
                targetValue: targetValue || undefined,
              });
            }}
            disabled={create.isPending}
          >
            {create.isPending ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Add Value Modal ----
function AddValueModal({ kpiId, kpiName, unit, onClose, onCreated }: {
  kpiId: string;
  kpiName: string;
  unit?: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [value, setValue] = useState('');
  const [measuredAt, setMeasuredAt] = useState(today);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const add = trpc.farmKpi.addValue.useMutation({
    onSuccess: () => { onCreated(); onClose(); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-gray-800">Saisir une valeur</h2>
        <p className="mb-4 text-sm text-gray-500">{kpiName}</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Valeur {unit && `(${unit})`} *
            </label>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date de mesure</label>
            <Input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contexte, source..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => {
              if (!value) { setError('La valeur est requise'); return; }
              add.mutate({ kpiId, value, measuredAt, notes: notes || undefined });
            }}
            disabled={add.isPending}
          >
            {add.isPending ? 'Ajout...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- KPI Row ----
function KpiRow({ kpi }: {
  kpi: {
    id: string;
    name: string;
    description?: string | null;
    unit?: string | null;
    valueType?: string | null;
    category?: string | null;
    targetValue?: string | null;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const utils = trpc.useUtils();
  const { data: values } = trpc.farmKpi.listValues.useQuery(
    { kpiId: kpi.id },
    { enabled: expanded },
  );

  const deleteKpi = trpc.farmKpi.deleteDefinition.useMutation({
    onSuccess: () => utils.farmKpi.listDefinitions.invalidate(),
  });

  const deleteValue = trpc.farmKpi.deleteValue.useMutation({
    onSuccess: () => utils.farmKpi.listValues.invalidate({ kpiId: kpi.id }),
  });

  const cat = kpi.category ?? 'autre';
  const lastValue = values?.[0];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-800">{kpi.name}</span>
            <Badge variant={categoryColor[cat] ?? 'default'}>
              {CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat}
            </Badge>
            {kpi.unit && <span className="text-xs text-gray-400">({kpi.unit})</span>}
          </div>
          {kpi.description && (
            <p className="mt-1 text-xs text-gray-400 italic">{kpi.description}</p>
          )}
          {lastValue && (
            <p className="mt-1 text-sm text-green-700 font-medium">
              Dernière valeur : {lastValue.value} {kpi.unit ?? ''} — {lastValue.measuredAt}
            </p>
          )}
          {kpi.targetValue && (
            <p className="text-xs text-gray-400">Objectif : {kpi.targetValue} {kpi.unit ?? ''}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 transition"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600 transition"
            title="Saisir une valeur"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { if (confirm('Supprimer cet indicateur et toutes ses valeurs ?')) deleteKpi.mutate({ id: kpi.id }); }}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {!values ? (
            <p className="text-sm text-gray-400">Chargement...</p>
          ) : values.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune valeur enregistrée.</p>
          ) : (
            <div className="space-y-1">
              {values.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                  <span className="font-medium text-gray-700">{v.value} {kpi.unit ?? ''}</span>
                  <span className="text-gray-400">{v.measuredAt}</span>
                  {v.notes && <span className="text-gray-400 italic">{v.notes}</span>}
                  <button
                    type="button"
                    onClick={() => deleteValue.mutate({ id: v.id })}
                    className="ml-2 rounded p-1 text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddValueModal
          kpiId={kpi.id}
          kpiName={kpi.name}
          unit={kpi.unit}
          onClose={() => setShowAdd(false)}
          onCreated={() => utils.farmKpi.listValues.invalidate({ kpiId: kpi.id })}
        />
      )}
    </div>
  );
}

// ---- Main Page ----
export default function KpisPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [catFilter, setCatFilter] = useState('');

  const utils = trpc.useUtils();
  const { data: kpis, isLoading } = trpc.farmKpi.listDefinitions.useQuery();

  const filtered = catFilter
    ? (kpis ?? []).filter((k) => k.category === catFilter)
    : (kpis ?? []);

  const catFilterOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...CATEGORY_OPTIONS,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/parametres"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Indicateurs personnalisés</h1>
          <p className="text-sm text-gray-500">Définissez et suivez vos propres KPIs par ferme</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-52">
          <Select
            options={catFilterOptions}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvel indicateur
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-200" />
            <p className="font-medium text-gray-500">Aucun indicateur</p>
            <p className="mt-1 text-sm text-gray-400">
              Créez des indicateurs personnalisés pour votre ferme (ex: GMQ objectif, taux germination...)
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Créer un indicateur
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((kpi) => (
            <KpiRow key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateKpiModal
          onClose={() => setShowCreate(false)}
          onCreated={() => utils.farmKpi.listDefinitions.invalidate()}
        />
      )}
    </div>
  );
}
