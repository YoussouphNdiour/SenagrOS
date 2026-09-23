'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Sprout, Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { planStatusLabels, seasonLabels } from '@/lib/validators/plan.validator';
import type { PlanStatus } from '@/lib/validators/plan.validator';

const PV_TASK_TYPES = [
  { value: 'desherbage', label: 'Désherbage' },
  { value: 'phytosanitaire', label: 'Traitement phytosanitaire' },
  { value: 'fertilisation', label: 'Apport d\'engrais' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'taille', label: 'Taille / élagage' },
  { value: 'autre', label: 'Autre' },
];

const RECURRENCE_TYPES = [
  { value: 'none', label: 'Pas de récurrence' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bimensuel' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'custom', label: 'Personnalisé (jours)' },
];

const SEASONS = [
  { value: '', label: 'Choisir une saison' },
  { value: 'hivernage', label: 'Hivernage (Jun-Oct)' },
  { value: 'contre_saison_chaude', label: 'Contre-saison chaude (Mar-Jun)' },
  { value: 'contre_saison_froide', label: 'Contre-saison froide (Nov-Fév)' },
];

function statusVariant(s?: string | null): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'danger';
  if (s === 'active') return 'info';
  return 'default';
}

// ---- Create Plan Modal ----
function CreatePlanModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [season, setSeason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const create = trpc.plan.create.useMutation({
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Nouveau plan d&apos;entretien PV</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nom du plan *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entretien Maïs Hivernage 2026"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Saison</label>
            <Select
              options={SEASONS}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Début</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fin</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Objectifs, culture ciblée, remarques..."
            />
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
                type: 'pv_maintenance',
                season: season || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                notes: notes || undefined,
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

// ---- Add Task Modal ----
function AddTaskModal({ planId, onClose, onCreated }: { planId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('desherbage');
  const [growthStage, setGrowthStage] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const create = trpc.plannedTask.create.useMutation({
    onSuccess: () => { onCreated(); onClose(); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Ajouter une intervention</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nom *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: 1er désherbage" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type d&apos;intervention</label>
            <Select
              options={PV_TASK_TYPES}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stade cultural</label>
            <Input
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              placeholder="Ex: tallage, floraison, post-levée..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date prévue</label>
            <Input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Récurrence</label>
            <Select
              options={RECURRENCE_TYPES}
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
            />
          </div>
          {recurrenceType === 'custom' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Intervalle (jours)</label>
              <Input
                type="number"
                min="1"
                value={recurrenceIntervalDays}
                onChange={(e) => setRecurrenceIntervalDays(e.target.value)}
                placeholder="Ex: 21"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => {
              if (!name.trim()) { setError('Le nom est requis'); return; }
              create.mutate({
                planId,
                name: name.trim(),
                type,
                growthStage: growthStage || undefined,
                recurrenceType,
                recurrenceIntervalDays: recurrenceType === 'custom' && recurrenceIntervalDays
                  ? parseInt(recurrenceIntervalDays, 10)
                  : undefined,
                plannedDate: plannedDate ? `${plannedDate}T00:00:00.000Z` : undefined,
                notes: notes || undefined,
              });
            }}
            disabled={create.isPending}
          >
            {create.isPending ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Plan Card ----
function PlanCard({ plan }: { plan: { id: string; name: string; type: string; status?: string | null; season?: string | null; startDate?: string | null; endDate?: string | null; notes?: string | null } }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  const utils = trpc.useUtils();
  const { data: tasks } = trpc.plannedTask.list.useQuery(
    { planId: plan.id },
    { enabled: expanded },
  );

  const deleteTask = trpc.plannedTask.delete.useMutation({
    onSuccess: () => utils.plannedTask.list.invalidate({ planId: plan.id }),
  });

  const deletePlan = trpc.plan.delete.useMutation({
    onSuccess: () => utils.plan.list.invalidate(),
  });

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sprout className="h-4 w-4 text-green-600" />
            <h3 className="text-base font-semibold text-gray-800">{plan.name}</h3>
            <Badge variant={statusVariant(plan.status)}>
              {planStatusLabels[(plan.status ?? 'active') as PlanStatus] ?? plan.status}
            </Badge>
            {plan.season && (
              <Badge variant="default">{seasonLabels[plan.season] ?? plan.season}</Badge>
            )}
          </div>
          {(plan.startDate || plan.endDate) && (
            <p className="mt-1 text-xs text-gray-500">
              {plan.startDate && `Du ${plan.startDate}`}
              {plan.startDate && plan.endDate && ' '}
              {plan.endDate && `au ${plan.endDate}`}
            </p>
          )}
          {plan.notes && <p className="mt-1 text-xs text-gray-400 italic">{plan.notes}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 transition"
            title={expanded ? 'Masquer les tâches' : 'Voir les tâches'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => { if (confirm('Supprimer ce plan et toutes ses tâches ?')) deletePlan.mutate({ id: plan.id }); }}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {!tasks ? (
            <p className="text-sm text-gray-400">Chargement...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune intervention planifiée.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{task.name}</span>
                      {task.type && (
                        <Badge variant="info">
                          {PV_TASK_TYPES.find((t) => t.value === task.type)?.label ?? task.type}
                        </Badge>
                      )}
                      {task.growthStage && (
                        <Badge variant="default">{task.growthStage}</Badge>
                      )}
                      {task.recurrenceType && task.recurrenceType !== 'none' && (
                        <Badge variant="warning">
                          {RECURRENCE_TYPES.find((r) => r.value === task.recurrenceType)?.label ?? task.recurrenceType}
                        </Badge>
                      )}
                    </div>
                    {task.plannedDate && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Prévue le {new Date(task.plannedDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (confirm('Supprimer cette intervention ?')) deleteTask.mutate({ id: task.id }); }}
                    className="ml-2 rounded p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-green-300 px-3 py-2 text-sm text-green-600 hover:bg-green-50 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une intervention
          </button>
        </div>
      )}

      {showAddTask && (
        <AddTaskModal
          planId={plan.id}
          onClose={() => setShowAddTask(false)}
          onCreated={() => utils.plannedTask.list.invalidate({ planId: plan.id })}
        />
      )}
    </Card>
  );
}

// ---- Main Component ----
export function PvPlansClient() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.plan.list.useQuery({
    type: 'pv_maintenance',
    search: search || undefined,
    status: (statusFilter as '' | 'active' | 'completed' | 'cancelled') || undefined,
    page: 1,
    limit: 50,
  });

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  const items = data?.items ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Rechercher un plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau plan PV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <Sprout className="mx-auto mb-3 h-10 w-10 text-green-300" />
            <p className="text-base font-medium text-gray-600">Aucun plan d&apos;entretien PV</p>
            <p className="mt-1 text-sm text-gray-400">
              Créez votre premier plan pour organiser les interventions sur vos cultures
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Créer un plan
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePlanModal
          onClose={() => setShowCreate(false)}
          onCreated={() => utils.plan.list.invalidate()}
        />
      )}
    </div>
  );
}
