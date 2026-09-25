'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { trpc } from '@/lib/trpc';
import { NdviPanel } from './NdviPanel';
import { DrawPolygonPanel } from './DrawPolygonPanel';
import type { DrawnPolygon } from './DrawPolygonPanel';

const SENEGAL_CENTER: [number, number] = [-17.4467, 14.6928];

const TILE_SOURCES = {
  osm: {
    label: 'OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery',
  },
} as const;

type TileKey = keyof typeof TILE_SOURCES;

// Draw preview layer IDs
const DRAW_LINE_SOURCE = 'draw-line-src';
const DRAW_LINE_LAYER = 'draw-line-layer';
const DRAW_FILL_SOURCE = 'draw-fill-src';
const DRAW_FILL_LAYER = 'draw-fill-layer';
const DRAW_POINTS_SOURCE = 'draw-points-src';
const DRAW_POINTS_LAYER = 'draw-points-layer';

// Farm boundary layer IDs
const FARM_BOUNDARY_SOURCE = 'farm-boundary-src';
const FARM_BOUNDARY_LAYER = 'farm-boundary-layer';

type DrawTarget = 'parcel' | 'farm';

interface MapViewProps {
  farmLat?: number;
  farmLng?: number;
}

export function MapView({ farmLat, farmLng }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [activeLayer, setActiveLayer] = useState<TileKey>('osm');
  const [mapReady, setMapReady] = useState(false);

  // NDVI panel
  const [selectedParcel, setSelectedParcel] = useState<{
    id: string;
    name: string;
    data: Record<string, unknown>;
  } | null>(null);

  // Draw mode
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTarget, setDrawTarget] = useState<DrawTarget>('parcel');
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);
  const [drawnPolygon, setDrawnPolygon] = useState<DrawnPolygon | null>(null);
  const isDrawingRef = useRef(false);

  const { data: parcels, refetch: refetchParcels } = trpc.map.getParcels.useQuery();
  const { data: farmBoundary, refetch: refetchBoundary } = trpc.map.getFarmBoundary.useQuery();
  const { data: landParcels } = trpc.asset.listLandParcels.useQuery();
  const saveFarmBoundary = trpc.map.saveFarmBoundary.useMutation();

  const center: [number, number] = farmLng && farmLat ? [farmLng, farmLat] : SENEGAL_CENTER;

  // ── Initialize map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [TILE_SOURCES.osm.url],
            tileSize: 256,
            attribution: TILE_SOURCES.osm.attribution,
          },
        },
        layers: [
          {
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center,
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-left');

    map.on('load', () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Switch tile layer ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('raster-tiles') as maplibregl.RasterTileSource | undefined;
    if (source) {
      source.setTiles([TILE_SOURCES[activeLayer].url]);
      map.triggerRepaint();
    }
  }, [activeLayer, mapReady]);

  // ── Render parcel polygons + markers ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !parcels) return;

    // Remove existing markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();
    let hasBounds = false;

    for (const parcel of parcels) {
      const sourceId = `parcel-${parcel.id}`;

      // Clean up old layers/sources for this parcel
      if (map.getLayer(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
      if (map.getLayer(`${sourceId}-stroke`)) map.removeLayer(`${sourceId}-stroke`);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      const data = parcel.data as Record<string, unknown> | null;

      // Try PostGIS geometry first, then JSONB coordinates fallback
      let geojsonGeometry: { type: string; coordinates: number[][][] } | null = null;
      if (parcel.geojson) {
        try {
          geojsonGeometry = JSON.parse(parcel.geojson as string);
        } catch { /* ignore */ }
      }

      const coordinates =
        geojsonGeometry?.coordinates ??
        (data?.coordinates as number[][][] | undefined);

      if (coordinates && Array.isArray(coordinates) && coordinates.length > 0) {
        // Parcel HAS geometry — draw polygon
        const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
          type: 'Feature',
          properties: { id: parcel.id, name: parcel.name, status: parcel.status },
          geometry: {
            type: 'Polygon',
            coordinates: geojsonGeometry
              ? (geojsonGeometry.coordinates as number[][][])
              : coordinates,
          },
        };

        map.addSource(sourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: `${sourceId}-fill`,
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.4 },
        });
        map.addLayer({
          id: `${sourceId}-stroke`,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#15803d', 'line-width': 3 },
        });

        for (const ring of geojson.geometry.coordinates) {
          for (const coord of ring) {
            bounds.extend([coord[0], coord[1]] as [number, number]);
            hasBounds = true;
          }
        }

        map.on('click', `${sourceId}-fill`, (e) => {
          if (isDrawingRef.current) return;
          const surfaceHa = (data?.surface_ha as number) ?? '-';
          const soilType = (data?.soil_type as string) ?? '-';
          const irrigationType = (data?.irrigation_type as string) ?? '-';

          new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family:system-ui;font-size:14px">
                <strong style="font-size:15px">${parcel.name}</strong>
                <div style="margin-top:6px;color:#374151">
                  <div><b>Surface:</b> ${surfaceHa} ha</div>
                  <div><b>Type de sol:</b> ${soilType}</div>
                  <div><b>Irrigation:</b> ${irrigationType}</div>
                </div>
                <a href="/assets/land/${parcel.id}" style="display:inline-block;margin-top:8px;color:#16a34a;font-size:12px;text-decoration:underline">Voir la parcelle →</a>
              </div>`,
            )
            .addTo(map);

          setSelectedParcel({ id: parcel.id, name: parcel.name, data: (data ?? {}) as Record<string, unknown> });
        });

        map.on('mouseenter', `${sourceId}-fill`, () => {
          if (!isDrawingRef.current) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `${sourceId}-fill`, () => {
          if (!isDrawingRef.current) map.getCanvas().style.cursor = '';
        });
      } else {
        // Parcel has NO geometry — show a pin at farm center (prefer farmBoundary query coords over prop)
        const fbLat = farmBoundary?.latitude ? parseFloat(farmBoundary.latitude) : undefined;
        const fbLng = farmBoundary?.longitude ? parseFloat(farmBoundary.longitude) : undefined;
        const farmCenter: [number, number] =
          fbLng && fbLat && !Number.isNaN(fbLng) && !Number.isNaN(fbLat)
            ? [fbLng, fbLat]
            : center;
        const el = document.createElement('div');
        el.style.cssText =
          'width:28px;height:28px;background:#16a34a;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,.3);cursor:pointer';
        el.title = parcel.name;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(farmCenter)
          .setPopup(
            new maplibregl.Popup({ offset: 25, maxWidth: '240px' }).setHTML(
              `<div style="font-family:system-ui;font-size:13px">
                <strong>${parcel.name}</strong>
                <div style="margin-top:4px;color:#6b7280;font-size:12px">Aucune géométrie dessinée</div>
                <a href="/assets/land/${parcel.id}" style="display:inline-block;margin-top:6px;color:#16a34a;font-size:12px;text-decoration:underline">Voir la parcelle →</a>
              </div>`,
            ),
          )
          .addTo(map);

        markersRef.current.push(marker);

        el.addEventListener('click', () => {
          if (!isDrawingRef.current) {
            setSelectedParcel({ id: parcel.id, name: parcel.name, data: (data ?? {}) as Record<string, unknown> });
          }
        });
      }
    }

    if (hasBounds) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    } else if (farmBoundary?.geojson) {
      // No parcel geometry — center on farm boundary if available
      try {
        const geom = JSON.parse(farmBoundary.geojson) as GeoJSON.Geometry;
        if (geom.type === 'Polygon') {
          const fb = new maplibregl.LngLatBounds();
          for (const ring of (geom as GeoJSON.Polygon).coordinates) {
            for (const c of ring) fb.extend([c[0], c[1]]);
          }
          map.fitBounds(fb, { padding: 80, maxZoom: 15 });
        }
      } catch { /* ignore */ }
    } else if (farmBoundary?.latitude && farmBoundary?.longitude) {
      // Center on farm lat/lng
      map.flyTo({ center: [parseFloat(farmBoundary.longitude), parseFloat(farmBoundary.latitude)], zoom: 14 });
    }
  }, [parcels, mapReady, center, farmBoundary]);

  // ── Farm boundary ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !farmBoundary) return;

    // Remove old layers/sources
    if (map.getLayer(`${FARM_BOUNDARY_LAYER}-fill`)) map.removeLayer(`${FARM_BOUNDARY_LAYER}-fill`);
    if (map.getLayer(FARM_BOUNDARY_LAYER)) map.removeLayer(FARM_BOUNDARY_LAYER);
    if (map.getSource(FARM_BOUNDARY_SOURCE)) map.removeSource(FARM_BOUNDARY_SOURCE);

    if (farmBoundary.geojson) {
      // Farm has a drawn boundary polygon — show it as a blue filled polygon
      try {
        const geom = JSON.parse(farmBoundary.geojson as string) as GeoJSON.Geometry;
        const feature: GeoJSON.Feature = {
          type: 'Feature',
          properties: { name: farmBoundary.name },
          geometry: geom,
        };

        map.addSource(FARM_BOUNDARY_SOURCE, { type: 'geojson', data: feature });
        // Visible blue fill
        map.addLayer({
          id: `${FARM_BOUNDARY_LAYER}-fill`,
          type: 'fill',
          source: FARM_BOUNDARY_SOURCE,
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.18 },
        });
        // Solid blue outline
        map.addLayer({
          id: FARM_BOUNDARY_LAYER,
          type: 'line',
          source: FARM_BOUNDARY_SOURCE,
          paint: { 'line-color': '#1d4ed8', 'line-width': 3, 'line-dasharray': [6, 3], 'line-opacity': 1 },
        });
      } catch { /* ignore */ }
    } else if (farmBoundary.latitude && farmBoundary.longitude) {
      // No polygon but farm has lat/lng — place a house-shaped marker
      const lat = parseFloat(farmBoundary.latitude);
      const lng = parseFloat(farmBoundary.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const el = document.createElement('div');
        el.title = farmBoundary.name ?? 'Ferme';
        el.style.cssText =
          'width:32px;height:32px;background:#1d4ed8;border:2px solid white;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:default';
        el.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="white" stroke-width="2"/></svg>';

        new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup({ offset: 20 }).setHTML(
              `<div style="font-family:system-ui;font-size:13px"><strong>${farmBoundary.name ?? 'Ferme'}</strong>
              <div style="margin-top:4px;color:#6b7280;font-size:11px">Aucune limite tracée — cliquez "Limite ferme" pour dessiner</div></div>`,
            ),
          )
          .addTo(map);
      }
    }
  }, [farmBoundary, mapReady]);

  // ── Draw mode — map click handler ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      setDrawVertices((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
    };

    const handleDblClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      setDrawVertices((prev) => {
        if (prev.length >= 3) finishDrawFromVertices(prev);
        return prev;
      });
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // ── Draw preview layers ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const clearDrawLayers = () => {
      if (map.getLayer(DRAW_FILL_LAYER)) map.removeLayer(DRAW_FILL_LAYER);
      if (map.getLayer(DRAW_LINE_LAYER)) map.removeLayer(DRAW_LINE_LAYER);
      if (map.getSource(DRAW_LINE_SOURCE)) map.removeSource(DRAW_LINE_SOURCE);
      if (map.getSource(DRAW_FILL_SOURCE)) map.removeSource(DRAW_FILL_SOURCE);
      if (map.getLayer(DRAW_POINTS_LAYER)) map.removeLayer(DRAW_POINTS_LAYER);
      if (map.getSource(DRAW_POINTS_SOURCE)) map.removeSource(DRAW_POINTS_SOURCE);
    };

    if (drawVertices.length === 0) {
      clearDrawLayers();
      return;
    }

    // Line outline
    const lineCoords: number[][] =
      drawVertices.length === 1
        ? [drawVertices[0], [drawVertices[0][0] + 0.00001, drawVertices[0][1]]]
        : [...drawVertices, drawVertices[0]];

    const lineFeature: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: lineCoords },
    };

    if (map.getSource(DRAW_LINE_SOURCE)) {
      (map.getSource(DRAW_LINE_SOURCE) as maplibregl.GeoJSONSource).setData(lineFeature);
    } else {
      map.addSource(DRAW_LINE_SOURCE, { type: 'geojson', data: lineFeature });
      map.addLayer({
        id: DRAW_LINE_LAYER,
        type: 'line',
        source: DRAW_LINE_SOURCE,
        paint: { 'line-color': '#f97316', 'line-width': 3, 'line-dasharray': [4, 2] },
      });
    }

    // Polygon fill (≥3 vertices)
    if (drawVertices.length >= 3) {
      const ring = [...drawVertices, drawVertices[0]];
      const fillFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] },
      };

      if (map.getSource(DRAW_FILL_SOURCE)) {
        (map.getSource(DRAW_FILL_SOURCE) as maplibregl.GeoJSONSource).setData(fillFeature);
      } else {
        map.addSource(DRAW_FILL_SOURCE, { type: 'geojson', data: fillFeature });
        map.addLayer({
          id: DRAW_FILL_LAYER,
          type: 'fill',
          source: DRAW_FILL_SOURCE,
          paint: { 'fill-color': '#f97316', 'fill-opacity': 0.2 },
        });
      }
    }

    // Vertex circles
    const pointsData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: drawVertices.map((v) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: v },
      })),
    };

    if (map.getSource(DRAW_POINTS_SOURCE)) {
      (map.getSource(DRAW_POINTS_SOURCE) as maplibregl.GeoJSONSource).setData(pointsData);
    } else {
      map.addSource(DRAW_POINTS_SOURCE, { type: 'geojson', data: pointsData });
      map.addLayer({
        id: DRAW_POINTS_LAYER,
        type: 'circle',
        source: DRAW_POINTS_SOURCE,
        paint: { 'circle-radius': 6, 'circle-color': '#f97316', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 },
      });
    }
  }, [drawVertices, mapReady]);

  // ── Draw helpers ──────────────────────────────────────────────────────────
  const finishDrawFromVertices = useCallback((vertices: [number, number][]) => {
    if (vertices.length < 3) return;
    const closed: [number, number][] = [...vertices, vertices[0]];
    setDrawnPolygon({ coordinates: [closed] });
    setIsDrawing(false);
    isDrawingRef.current = false;
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = '';
  }, []);

  const clearDrawPreview = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer(DRAW_FILL_LAYER)) map.removeLayer(DRAW_FILL_LAYER);
    if (map.getLayer(DRAW_LINE_LAYER)) map.removeLayer(DRAW_LINE_LAYER);
    if (map.getSource(DRAW_LINE_SOURCE)) map.removeSource(DRAW_LINE_SOURCE);
    if (map.getSource(DRAW_FILL_SOURCE)) map.removeSource(DRAW_FILL_SOURCE);
    if (map.getLayer(DRAW_POINTS_LAYER)) map.removeLayer(DRAW_POINTS_LAYER);
    if (map.getSource(DRAW_POINTS_SOURCE)) map.removeSource(DRAW_POINTS_SOURCE);
    map.getCanvas().style.cursor = '';
  }, []);

  const startDraw = useCallback((target: DrawTarget) => {
    setDrawTarget(target);
    setIsDrawing(true);
    isDrawingRef.current = true;
    setDrawVertices([]);
    setDrawnPolygon(null);
    setSelectedParcel(null);
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = 'crosshair';
  }, []);

  const handleStartDrawParcel = useCallback(() => startDraw('parcel'), [startDraw]);
  const handleStartDrawFarm = useCallback(() => startDraw('farm'), [startDraw]);

  const handleCancelDraw = useCallback(() => {
    setIsDrawing(false);
    isDrawingRef.current = false;
    setDrawVertices([]);
    setDrawnPolygon(null);
    clearDrawPreview();
  }, [clearDrawPreview]);

  const handleFinishDraw = useCallback(() => {
    finishDrawFromVertices(drawVertices);
  }, [drawVertices, finishDrawFromVertices]);

  const handleUndoVertex = useCallback(() => {
    setDrawVertices((prev) => prev.slice(0, -1));
  }, []);

  const handleSavedParcel = useCallback(() => {
    handleCancelDraw();
    refetchParcels();
  }, [handleCancelDraw, refetchParcels]);

  const handleSaveFarmBoundary = useCallback(async () => {
    if (!drawnPolygon) return;
    await saveFarmBoundary.mutateAsync({ coordinates: drawnPolygon.coordinates });
    handleCancelDraw();
    refetchBoundary();
  }, [drawnPolygon, saveFarmBoundary, handleCancelDraw, refetchBoundary]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Layer switcher */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg bg-white p-1 shadow-md">
        {(Object.keys(TILE_SOURCES) as TileKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveLayer(key)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeLayer === key ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {TILE_SOURCES[key].label}
          </button>
        ))}
      </div>

      {/* Draw controls — bottom-left */}
      <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-2">
        {/* Parcel draw panel */}
        <DrawPolygonPanel
          isDrawing={isDrawing && drawTarget === 'parcel'}
          vertices={drawVertices}
          drawnPolygon={drawTarget === 'parcel' ? drawnPolygon : null}
          parcels={(landParcels ?? []).map((p) => ({ id: p.id, name: p.name }))}
          onStartDraw={handleStartDrawParcel}
          onCancelDraw={handleCancelDraw}
          onFinishDraw={handleFinishDraw}
          onUndoVertex={handleUndoVertex}
          onSaved={handleSavedParcel}
        />

        {/* Farm boundary draw button */}
        {!isDrawing && (
          <button
            type="button"
            onClick={handleStartDrawFarm}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-md hover:bg-blue-50 transition-colors"
            title="Dessiner la limite de la ferme"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Limite ferme
          </button>
        )}

        {/* Farm boundary drawing mode overlay */}
        {isDrawing && drawTarget === 'farm' && (
          <div className="rounded-lg bg-white shadow-lg p-3 min-w-55">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-700">Limite ferme</span>
              <button type="button" onClick={handleCancelDraw} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {drawVertices.length === 0
                ? 'Cliquez pour placer les points'
                : `${drawVertices.length} point${drawVertices.length > 1 ? 's' : ''} — double-clic ou "Terminer"`}
            </p>
            <div className="flex gap-2">
              {drawVertices.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoVertex}
                  className="rounded px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  ← Annuler
                </button>
              )}
              {drawVertices.length >= 3 && (
                <button
                  type="button"
                  onClick={() => {
                    finishDrawFromVertices(drawVertices);
                  }}
                  className="flex-1 rounded px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Terminer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Farm boundary confirm save */}
        {!isDrawing && drawnPolygon && drawTarget === 'farm' && (
          <div className="rounded-lg bg-white shadow-lg p-4 min-w-55">
            <p className="text-sm font-semibold text-gray-800 mb-2">Enregistrer la limite ?</p>
            <p className="text-xs text-gray-500 mb-3">{drawnPolygon.coordinates[0].length - 1} points tracés</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleCancelDraw} className="flex-1 rounded px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200">Annuler</button>
              <button
                type="button"
                onClick={handleSaveFarmBoundary}
                disabled={saveFarmBoundary.isPending}
                className="flex-1 rounded px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saveFarmBoundary.isPending ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NDVI Panel */}
      <NdviPanel selectedParcel={selectedParcel} onClose={() => setSelectedParcel(null)} />
    </div>
  );
}
