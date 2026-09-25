'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';

const SENEGAL_CENTER: [number, number] = [-17.4467, 14.6928];

interface ParcelMiniMapProps {
  parcelId: string;
  parcelName: string;
  /** GeoJSON string from ST_AsGeoJSON(geometry), null if no PostGIS geometry */
  parcelGeojson: string | null;
}

export function ParcelMiniMap({ parcelId, parcelName, parcelGeojson }: ParcelMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const { data: farmBoundary } = trpc.map.getFarmBoundary.useQuery();

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
    };
    // farmBoundary loaded async — re-run effect when it arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelGeojson, farmBoundary]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <div ref={mapContainer} style={{ height: '280px' }} className="w-full" />
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
