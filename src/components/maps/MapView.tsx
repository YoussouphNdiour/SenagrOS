'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { trpc } from '@/lib/trpc';
import { NdviPanel } from './NdviPanel';

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

interface MapViewProps {
  farmLat?: number;
  farmLng?: number;
}

export function MapView({ farmLat, farmLng }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<TileKey>('osm');
  const [selectedParcel, setSelectedParcel] = useState<{
    id: string;
    name: string;
    data: Record<string, unknown>;
  } | null>(null);

  const { data: parcels } = trpc.map.getParcels.useQuery();

  const center: [number, number] = farmLng && farmLat
    ? [farmLng, farmLat]
    : SENEGAL_CENTER;

  // Initialize map
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

  // Switch tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('raster-tiles') as maplibregl.RasterTileSource | undefined;
    if (source) {
      const tileConfig = TILE_SOURCES[activeLayer];
      source.setTiles([tileConfig.url]);
      map.triggerRepaint();
    }
  }, [activeLayer]);

  // Add parcel layers
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

        // Prefer PostGIS geometry over JSONB coordinates
        let geojsonGeometry: { type: string; coordinates: number[][][] } | null = null;
        if ('geojson' in parcel && parcel.geojson) {
          try {
            geojsonGeometry = JSON.parse(parcel.geojson as string);
          } catch { /* ignore parse errors */ }
        }

        const coordinates = geojsonGeometry?.coordinates ?? (data?.coordinates as number[][][] | undefined);
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) continue;

        const sourceId = `parcel-${parcel.id}`;

        const geojson = {
          type: 'Feature' as const,
          properties: {
            id: parcel.id,
            name: parcel.name,
            status: parcel.status,
          },
          geometry: geojsonGeometry
            ? { type: geojsonGeometry.type as 'Polygon', coordinates: geojsonGeometry.coordinates }
            : { type: 'Polygon' as const, coordinates },
        };

        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
        });

        map.addLayer({
          id: `${sourceId}-fill`,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#22c55e',
            'fill-opacity': 0.3,
          },
        });

        map.addLayer({
          id: `${sourceId}-stroke`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#16a34a',
            'line-width': 2,
          },
        });

        // Extend bounds
        for (const ring of coordinates) {
          for (const coord of ring) {
            if (Array.isArray(coord) && coord.length >= 2) {
              bounds.extend([coord[0], coord[1]] as [number, number]);
              hasBounds = true;
            }
          }
        }

        // Click popup
        map.on('click', `${sourceId}-fill`, (e: maplibregl.MapMouseEvent) => {
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

        // Cursor pointer on hover
        map.on('mouseenter', `${sourceId}-fill`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `${sourceId}-fill`, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // Fit map to parcel bounds if we have any
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

      {/* NDVI Panel */}
      <NdviPanel selectedParcel={selectedParcel} onClose={handleClosePanel} />
    </div>
  );
}
