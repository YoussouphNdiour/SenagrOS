'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';

const SENEGAL_CENTER: [number, number] = [-17.4467, 14.6928];

const ZONING_SOURCE = 'parcel-zoning-src';
const ZONING_LAYER = 'parcel-zoning-layer';

/** Memes seuils et memes couleurs que la palette appliquee cote serveur. */
const ZONING_LEGEND = [
  { color: '#22c55e', label: '≥ 0.6 — dense' },
  { color: '#eab308', label: '0.4 – 0.6 — modérée' },
  { color: '#f97316', label: '0.2 – 0.4 — clairsemée' },
  { color: '#ef4444', label: '< 0.2 — sol nu' },
];

interface ParcelMiniMapProps {
  parcelId: string;
  parcelName: string;
  /** GeoJSON string from ST_AsGeoJSON(geometry), null if no PostGIS geometry */
  parcelGeojson: string | null;
}

export function ParcelMiniMap({ parcelId, parcelName, parcelGeojson }: ParcelMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showZoning, setShowZoning] = useState(false);
  const [zoningLoading, setZoningLoading] = useState(false);
  const [zoningError, setZoningError] = useState<string | null>(null);

  const { data: farmBoundary } = trpc.map.getFarmBoundary.useQuery();

  /** Coins de la boite englobante, dans l'ordre attendu par MapLibre. */
  const zoningCorners = useMemo(() => {
    if (!parcelGeojson) return null;
    try {
      const geom = JSON.parse(parcelGeojson) as GeoJSON.Polygon;
      if (geom.type !== 'Polygon') return null;
      let west = Number.POSITIVE_INFINITY;
      let south = Number.POSITIVE_INFINITY;
      let east = Number.NEGATIVE_INFINITY;
      let north = Number.NEGATIVE_INFINITY;
      for (const ring of geom.coordinates) {
        for (const [lng, lat] of ring) {
          if (lng < west) west = lng;
          if (lng > east) east = lng;
          if (lat < south) south = lat;
          if (lat > north) north = lat;
        }
      }
      return [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ] as [[number, number], [number, number], [number, number], [number, number]];
    } catch {
      return null;
    }
  }, [parcelGeojson]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Compute initial center: farm coords > Senegal default
    const lat = farmBoundary?.latitude ? parseFloat(farmBoundary.latitude) : undefined;
    const lng = farmBoundary?.longitude ? parseFloat(farmBoundary.longitude) : undefined;
    const center: [number, number] = lng && lat ? [lng, lat] : SENEGAL_CENTER;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap',
          },
        },
        layers: [{ id: 'raster-layer', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 19 }],
      },
      center,
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;

    map.on('load', () => {
      setMapReady(true);
      const bounds = new maplibregl.LngLatBounds();
      let hasBounds = false;

      // ── Farm boundary ──────────────────────────────────────────────────────
      if (farmBoundary?.geojson) {
        try {
          const geom = JSON.parse(farmBoundary.geojson) as GeoJSON.Geometry;
          map.addSource('farm-boundary', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: geom },
          });
          // Semi-transparent blue fill
          map.addLayer({
            id: 'farm-fill',
            type: 'fill',
            source: 'farm-boundary',
            paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.18 },
          });
          // Dashed blue outline
          map.addLayer({
            id: 'farm-line',
            type: 'line',
            source: 'farm-boundary',
            paint: { 'line-color': '#1d4ed8', 'line-width': 2, 'line-dasharray': [5, 3], 'line-opacity': 1 },
          });

          if (geom.type === 'Polygon') {
            for (const ring of (geom as GeoJSON.Polygon).coordinates) {
              for (const c of ring) {
                bounds.extend([c[0], c[1]]);
                hasBounds = true;
              }
            }
          }
        } catch { /* ignore */ }
      }

      // ── Parcel polygon or marker ───────────────────────────────────────────
      let parcelGeom: { type: string; coordinates: number[][][] } | null = null;
      if (parcelGeojson) {
        try { parcelGeom = JSON.parse(parcelGeojson); } catch { /* ignore */ }
      }

      if (parcelGeom?.coordinates?.length) {
        const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
          type: 'Feature',
          properties: { name: parcelName },
          geometry: { type: 'Polygon', coordinates: parcelGeom.coordinates as number[][][] },
        };

        map.addSource('parcel', { type: 'geojson', data: feature });
        map.addLayer({
          id: 'parcel-fill',
          type: 'fill',
          source: 'parcel',
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.4 },
        });
        map.addLayer({
          id: 'parcel-stroke',
          type: 'line',
          source: 'parcel',
          paint: { 'line-color': '#15803d', 'line-width': 3 },
        });

        // Fit to parcel — takes priority over farm bounds
        const parcelBounds = new maplibregl.LngLatBounds();
        for (const ring of parcelGeom.coordinates) {
          for (const c of ring) {
            parcelBounds.extend([c[0], c[1]]);
          }
        }
        map.fitBounds(parcelBounds, { padding: 60, maxZoom: 17, animate: false });
      } else {
        // No geometry: pin at farm center or Senegal center
        const pinCenter: [number, number] = (lng && lat) ? [lng, lat] : (hasBounds ? bounds.getCenter().toArray() as [number, number] : SENEGAL_CENTER);

        const el = document.createElement('div');
        el.style.cssText =
          'width:24px;height:24px;background:#16a34a;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,.3)';

        new maplibregl.Marker({ element: el })
          .setLngLat(pinCenter)
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div style="font-family:system-ui;font-size:13px"><strong>${parcelName}</strong>
              <div style="margin-top:4px;color:#6b7280;font-size:12px">Aucune géométrie dessinée</div></div>`,
            ),
          )
          .addTo(map);

        if (hasBounds) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 15, animate: false });
        } else {
          map.setCenter(pinCenter);
          map.setZoom(13);
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // farmBoundary loaded async — re-run effect when it arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelGeojson, farmBoundary, parcelName]);

  // ── Calque de zonage ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const removeLayer = () => {
      if (map.getLayer(ZONING_LAYER)) map.removeLayer(ZONING_LAYER);
      if (map.getSource(ZONING_SOURCE)) map.removeSource(ZONING_SOURCE);
    };

    if (!showZoning || !zoningCorners) {
      removeLayer();
      return;
    }

    removeLayer();
    setZoningError(null);
    setZoningLoading(true);

    map.addSource(ZONING_SOURCE, {
      type: 'image',
      url: `/api/parcels/${parcelId}/zoning?index=ndvi`,
      coordinates: zoningCorners,
    });
    map.addLayer({
      id: ZONING_LAYER,
      type: 'raster',
      source: ZONING_SOURCE,
      paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 0 },
    });

    const onIdle = () => setZoningLoading(false);
    const onError = (e: { sourceId?: string }) => {
      if (e.sourceId !== ZONING_SOURCE) return;
      setZoningLoading(false);
      setZoningError("Imagerie indisponible sur les 30 derniers jours.");
    };

    map.once('idle', onIdle);
    map.on('error', onError);

    return () => {
      map.off('error', onError);
      removeLayer();
    };
  }, [showZoning, zoningCorners, parcelId, mapReady]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <div ref={mapContainer} style={{ height: '280px' }} className="w-full" />

      {/* Bascule du zonage */}
      {zoningCorners && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowZoning((v) => !v)}
            title="Afficher la variation du NDVI a l'interieur de la parcelle"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shadow transition ${
              showZoning ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
            }`}
          >
            {zoningLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Layers className="h-3.5 w-3.5" />
            )}
            Zonage NDVI
          </button>

          {showZoning && !zoningError && (
            <div className="rounded-md bg-white/90 px-2 py-1.5 shadow">
              {ZONING_LEGEND.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          )}

          {zoningError && (
            <div className="max-w-44 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800 shadow">
              {zoningError}
            </div>
          )}
        </div>
      )}
      {/* Link to full map */}
      <div className="absolute bottom-2 right-2 z-10">
        <Link
          href={`/map`}
          className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-green-700 shadow hover:bg-white transition"
        >
          Voir sur la carte →
        </Link>
      </div>
    </div>
  );
}
