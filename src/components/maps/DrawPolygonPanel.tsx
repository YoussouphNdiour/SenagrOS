'use client';

/**
 * DrawPolygonPanel
 *
 * Floating UI panel for drawing a GPS polygon on the MapLibre map.
 * Renders draw instructions + parcel assignment modal.
 * The actual click capture is handled by MapView via the onPolygonComplete callback.
 */

import { useState, useCallback } from 'react';
import { X, Check, Trash2, Pencil } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface DrawnPolygon {
  coordinates: number[][][];
}

interface Parcel {
  id: string;
  name: string;
}

interface DrawPolygonPanelProps {
  /** Whether draw mode is currently active */
  isDrawing: boolean;
  /** Vertices collected so far (lng, lat pairs) */
  vertices: [number, number][];
  /** Completed polygon ready to be assigned */
  drawnPolygon: DrawnPolygon | null;
  /** List of land parcels the user can assign the polygon to */
  parcels: Parcel[];
  onStartDraw: () => void;
  onCancelDraw: () => void;
  onFinishDraw: () => void;
  onUndoVertex: () => void;
  onSaved: () => void;
}

export function DrawPolygonPanel({
  isDrawing,
  vertices,
  drawnPolygon,
  parcels,
  onStartDraw,
  onCancelDraw,
  onFinishDraw,
  onUndoVertex,
  onSaved,
}: DrawPolygonPanelProps) {
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGeometry = trpc.asset.updateGeometry.useMutation();

  const handleSave = useCallback(async () => {
    if (!drawnPolygon || !selectedParcelId) return;
    setSaving(true);
    setError(null);
    try {
      await updateGeometry.mutateAsync({
        id: selectedParcelId,
        coordinates: drawnPolygon.coordinates,
      });
      setSelectedParcelId('');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [drawnPolygon, selectedParcelId, updateGeometry, onSaved]);

  // ── Idle state — just show the "Dessiner" button ────────────────────────
  if (!isDrawing && !drawnPolygon) {
    return (
      <button
        type="button"
        onClick={onStartDraw}
        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-green-50 hover:text-green-700 transition-colors"
        title="Dessiner le contour GPS d'une parcelle"
      >
        <Pencil size={15} />
        Dessiner parcelle
      </button>
    );
  }

  // ── Drawing mode ────────────────────────────────────────────────────────
  if (isDrawing) {
    return (
      <div className="rounded-lg bg-white shadow-lg p-3 min-w-[220px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-green-700">Mode dessin</span>
          <button type="button" onClick={onCancelDraw} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {vertices.length === 0
            ? 'Cliquez sur la carte pour placer le 1er point'
            : vertices.length < 3
              ? `${vertices.length} point${vertices.length > 1 ? 's' : ''} — encore ${3 - vertices.length} minimum`
              : `${vertices.length} points — double-clic ou "Terminer" pour fermer`}
        </p>

        <div className="flex gap-2">
          {vertices.length > 0 && (
            <button
              type="button"
              onClick={onUndoVertex}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              <Trash2 size={12} />
              Annuler point
            </button>
          )}
          {vertices.length >= 3 && (
            <button
              type="button"
              onClick={onFinishDraw}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Check size={12} />
              Terminer
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Polygon drawn — assign to parcel ───────────────────────────────────
  if (drawnPolygon) {
    const ringLen = drawnPolygon.coordinates[0]?.length ?? 0;
    return (
      <div className="rounded-lg bg-white shadow-lg p-4 min-w-[260px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Assigner la parcelle</span>
          <button type="button" onClick={onCancelDraw} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Polygone dessiné · {ringLen - 1} points
        </p>

        <label className="block text-xs font-medium text-gray-700 mb-1">
          Parcelle à mettre à jour
        </label>
        <select
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
          value={selectedParcelId}
          onChange={(e) => setSelectedParcelId(e.target.value)}
        >
          <option value="">Sélectionner une parcelle...</option>
          {parcels.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-xs text-red-600 mb-2">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelDraw}
            className="flex-1 rounded px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            Recommencer
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedParcelId || saving}
            className="flex-1 flex items-center justify-center gap-1 rounded px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check size={12} />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    );
  }

  return null;
}
