'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { trpc } from '@/lib/trpc';
import { NdviPanel } from './NdviPanel';
import { DrawPolygonPanel } from './DrawPolygonPanel';
import type { DrawnPolygon } from './DrawPolygonPanel';

const SENEGAL_CENTER: [number, number] = [-17.4467, 14.6928]; // [lng, lat]

const TILE_SOURCES = {
  osm: {
    label: 'OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery',
  },
} as const;

type TileKey = keyof typeof TILE_SOURCES;

/** Source/layer IDs used for the in-progress draw polygon */
// Separate sources: line outline, polygon fill, vertex circles
const DRAW_LINE_SOURCE = 'draw-line-src';
const DRAW_LINE_LAYER = 'draw-line-layer';
const DRAW_FILL_SOURCE = 'draw-fill-src';
const DRAW_FILL_LAYER = 'draw-fill-layer';
const DRAW_POINTS_SOURCE = 'draw-points-src';
const DRAW_POINTS_LAYER = 'draw-points-layer';
// Farm boundary
const FARM_BOUNDARY_SOURCE = 'farm-boundary-src';
const FARM_BOUNDARY_LAYER = 'farm-boundary-layer';

interface MapViewProps {
  farmLat?: number;
  farmLng?: number;
}

export function MapView({ farmLat, farmLng }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<TileKey>('osm');

  // ── Parcel selection (NDVI panel) ──────────────────────────────────────
  const [selectedParcel, setSelectedParcel] = useState<{
    id: string;
    name: string;
    data: Record<string, unknown>;
  } | null>(null);

  // ── Draw mode state ───────────────────────────────────────────────────
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawVertices, setDrawVertices] = useState<[number, number][]>([]);
  const [drawnPolygon, setDrawnPolygon] = useState<DrawnPolygon | null>(null);
  const isDrawingRef = useRef(false); // kept in sync for map event listeners

  const { data: parcels, refetch: refetchParcels } = trpc.map.getParcels.useQuery();
  const { data: farmBoundary } = trpc.map.getFarmBoundary.useQuery();

  // Parcels available for assignment in draw mode (only land type with no geometry yet,
  // but we allow reassigning so we show all land parcels via a separate query)
  const { data: landParcels } = trpc.asset.listLandParcels.useQuery();

  const center: [number, number] = farmLng && farmLat
    ? [farmLng, farmLat]
    : SENEGAL_CENTER;

  // ── Initialize map ─────────────────────────────────────────────────────
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

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Switch tile layer ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('raster-tiles') as maplibregl.RasterTileSource | undefined;
    if (source) {
      source.setTiles([TILE_SOURCES[activeLayer].url]);
      map.triggerRepaint();
    }
  }, [activeLayer]);

  // ── Add parcel layers ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !parcels) return;

    const addParcels = () => {
      // Clean up old sources/layers
      for (const parcel of parcels) {
        const sourceId = `parcel-${parcel.id}`;
        if (map.getLayer(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
        if (map.getLayer(`${sourceId}-stroke`)) map.removeLayer(`${sourceId}-stroke`);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }

      const bounds = new maplibregl.LngLatBounds();
      let hasBounds = false;

      for (const parcel of parcels) {
        const data = parcel.data as Record<string, unknown> | null;

        let geojsonGeometry: { type: string; coordinates: number[][][] } | null = null;
        if ('geojson' in parcel && parcel.geojson) {
          try {
            geojsonGeometry = JSON.parse(parcel.geojson as string);
          } catch { /* ignore */ }
        }

        const coordinates = geojsonGeometry?.coordinates ?? (data?.coordinates as number[][][] | undefined);
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) continue;

        const sourceId = `parcel-${parcel.id}`;

        const geojson = {
          type: 'Feature' as const,
          properties: { id: parcel.id, name: parcel.name, status: parcel.status },
          geometry: geojsonGeometry
            ? { type: geojsonGeometry.type as 'Polygon', coordinates: geojsonGeometry.coordinates }
            : { type: 'Polygon' as const, coordinates },
        };

        map.addSource(sourceId, { type: 'geojson', data: geojson });

        map.addLayer({
          id: `${sourceId}-fill`,
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.3 },
        });

        map.addLayer({
          id: `${sourceId}-stroke`,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#16a34a', 'line-width': 2 },
        });

        for (const ring of coordinates) {
          for (const coord of ring) {
            if (Array.isArray(coord) && coord.length >= 2) {
              bounds.extend([coord[0], coord[1]] as [number, number]);
              hasBounds = true;
            }
          }
        }

        map.on('click', `${sourceId}-fill`, (e: maplibregl.MapMouseEvent) => {
          if (isDrawingRef.current) return; // ignore parcel clicks in draw mode
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
              </div>`,
            )
            .addTo(map);

          setSelectedParcel({
            id: parcel.id,
            name: parcel.name,
            data: (data ?? {}) as Record<string, unknown>,
          });
        });

        map.on('mouseenter', `${sourceId}-fill`, () => {
          if (!isDrawingRef.current) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `${sourceId}-fill`, () => {
          if (!isDrawingRef.current) map.getCanvas().style.cursor = '';
        });
      }

      if (hasBounds) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      }
    };

    if (map.isStyleLoaded()) {
      addParcels();
    } else {
      map.on('load', addParcels);
    }
  }, [parcels]);

  // ── Farm boundary ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !farmBoundary?.geojson) return;

    const addBoundary = () => {
      try {
        const geom = JSON.parse(farmBoundary.geojson as string) as { type: string; coordinates: unknown };

        const feature: GeoJSON.Feature = {
          type: 'Feature',
          properties: { name: farmBoundary.name },
          geometry: geom as GeoJSON.Geometry,
        };

        if (map.getLayer(FARM_BOUNDARY_LAYER)) map.removeLayer(FARM_BOUNDARY_LAYER);
        if (map.getSource(FARM_BOUNDARY_SOURCE)) map.removeSource(FARM_BOUNDARY_SOURCE);

        map.addSource(FARM_BOUNDARY_SOURCE, { type: 'geojson', data: feature });
        map.addLayer({
          id: FARM_BOUNDARY_LAYER,
          type: 'line',
          source: FARM_BOUNDARY_SOURCE,
          paint: {
            'line-color': '#1e40af',
            'line-width': 3,
            'line-dasharray': [6, 3],
            'line-opacity': 0.85,
          },
        });
        map.triggerRepaint();
      } catch { /* ignore parse errors */ }
    };

    addBoundary();
  }, [farmBoundary]);

  // ── Draw mode — map click handler ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleDrawClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      const { lng, lat } = e.lngLat;
      setDrawVertices((prev) => [...prev, [lng, lat]]);
    };

    const handleDrawDblClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      setDrawVertices((prev) => {
        if (prev.length >= 3) {
          finishDrawFromVertices(prev);
        }
        return prev;
      });
    };

    map.on('click', handleDrawClick);
    map.on('dblclick', handleDrawDblClick);

    return () => {
      map.off('click', handleDrawClick);
      map.off('dblclick', handleDrawDblClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update draw preview layers on vertex change ────────────────────────
  // Uses THREE separate sources to avoid geometry-type conflicts and correctly
  // add/remove the fill layer when crossing the 3-vertex threshold.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clearDrawLayers = () => {
      if (map.getLayer(DRAW_FILL_LAYER)) map.removeLayer(DRAW_FILL_LAYER);
      if (map.getLayer(DRAW_LINE_LAYER)) map.removeLayer(DRAW_LINE_LAYER);
      if (map.getSource(DRAW_LINE_SOURCE)) map.removeSource(DRAW_LINE_SOURCE);
      if (map.getSource(DRAW_FILL_SOURCE)) map.removeSource(DRAW_FILL_SOURCE);
      if (map.getLayer(DRAW_POINTS_LAYER)) map.removeLayer(DRAW_POINTS_LAYER);
      if (map.getSource(DRAW_POINTS_SOURCE)) map.removeSource(DRAW_POINTS_SOURCE);
    };

    const updatePreview = () => {
      if (drawVertices.length === 0) {
        clearDrawLayers();
        return;
      }

      // ── 1. Line outline (LineString — always) ─────────────────────────
      // With 1 vertex: short stub to a nearby point so the line renders
      const lineCoords: number[][] =
        drawVertices.length === 1
          ? [drawVertices[0], [drawVertices[0][0] + 0.00001, drawVertices[0][1]]]
          : [...drawVertices, drawVertices[0]]; // close ring visually

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
          paint: {
            'line-color': '#f97316',
            'line-width': 3,
            'line-dasharray': [4, 2],
            'line-opacity': 1,
          },
        });
      }

      // ── 2. Polygon fill (Polygon — only when ≥ 3 vertices) ────────────
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

      // ── 3. Vertex circles (Points — always) ───────────────────────────
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
          paint: {
            'circle-radius': 6,
            'circle-color': '#f97316',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        });
      }
    };

    // addSource / addLayer work even when isStyleLoaded() is false (tile downloads pending).
    // Calling map.once('load', ...) fails because 'load' already fired by draw time.
    updatePreview();
    map.triggerRepaint();
  }, [drawVertices]);

  // ── Draw helpers ───────────────────────────────────────────────────────
  const finishDrawFromVertices = useCallback((vertices: [number, number][]) => {
    if (vertices.length < 3) return;
    const closed: [number, number][] = [...vertices, vertices[0]];
    setDrawnPolygon({ coordinates: [closed] });
    setIsDrawing(false);
    isDrawingRef.current = false;

    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = '';
  }, []);

  const handleStartDraw = useCallback(() => {
    setIsDrawing(true);
    isDrawingRef.current = true;
    setDrawVertices([]);
    setDrawnPolygon(null);
    setSelectedParcel(null);

    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = 'crosshair';
  }, []);

  const handleCancelDraw = useCallback(() => {
    setIsDrawing(false);
    isDrawingRef.current = false;
    setDrawVertices([]);
    setDrawnPolygon(null);

    // Clear all draw preview layers
    const map = mapRef.current;
    if (map) {
      if (map.getLayer(DRAW_FILL_LAYER)) map.removeLayer(DRAW_FILL_LAYER);
      if (map.getLayer(DRAW_LINE_LAYER)) map.removeLayer(DRAW_LINE_LAYER);
      if (map.getSource(DRAW_LINE_SOURCE)) map.removeSource(DRAW_LINE_SOURCE);
      if (map.getSource(DRAW_FILL_SOURCE)) map.removeSource(DRAW_FILL_SOURCE);
      if (map.getLayer(DRAW_POINTS_LAYER)) map.removeLayer(DRAW_POINTS_LAYER);
      if (map.getSource(DRAW_POINTS_SOURCE)) map.removeSource(DRAW_POINTS_SOURCE);
      map.getCanvas().style.cursor = '';
    }
  }, []);

  const handleFinishDraw = useCallback(() => {
    finishDrawFromVertices(drawVertices);
  }, [drawVertices, finishDrawFromVertices]);

  const handleUndoVertex = useCallback(() => {
    setDrawVertices((prev) => prev.slice(0, -1));
  }, []);

  const handleSaved = useCallback(() => {
    handleCancelDraw();
    refetchParcels();
  }, [handleCancelDraw, refetchParcels]);

  const handleClosePanel = useCallback(() => {
    setSelectedParcel(null);
  }, []);

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
              activeLayer === key
                ? 'bg-green-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {TILE_SOURCES[key].label}
          </button>
        ))}
      </div>

      {/* Draw polygon control — bottom-left of map area */}
      <div className="absolute bottom-8 left-3 z-10">
        <DrawPolygonPanel
          isDrawing={isDrawing}
          vertices={drawVertices}
          drawnPolygon={drawnPolygon}
          parcels={(landParcels ?? []).map((p) => ({ id: p.id, name: p.name }))}
          onStartDraw={handleStartDraw}
          onCancelDraw={handleCancelDraw}
          onFinishDraw={handleFinishDraw}
          onUndoVertex={handleUndoVertex}
          onSaved={handleSaved}
        />
      </div>

      {/* NDVI Panel */}
      <NdviPanel selectedParcel={selectedParcel} onClose={handleClosePanel} />
    </div>
  );
}
