/**
 * E2E tests — NDVI avec création de parcelle GPS
 *
 * Couvre :
 *  1. Création d'une parcelle "land" via le formulaire UI
 *  2. Ajout des coordonnées GPS via tRPC asset.update
 *  3. Validation NDVI via l'API tRPC (hasGeometry: true)
 *  4. Validation du panneau NdviPanel (injection React state pour contourner WebGL headless)
 *  5. Selecteur de période 3M / 6M / 12M / 24M
 *
 * Fonctionnement :
 *  - Le test s'exécute sur BASE_URL (localhost:3000 par défaut, ou senagros.online en CI)
 *  - La parcelle créée en prod est nommée "Playwright GPS Test" pour faciliter le ménage
 *
 * Screenshots sauvegardés dans docs/guide/screenshots/ :
 *  pw-01-parcel-form.png     — formulaire de création de parcelle
 *  pw-02-parcel-created.png  — page détail après création
 *  pw-03-map-parcels.png     — carte avec parcelles chargées
 *  pw-04-ndvi-panel.png      — panneau NDVI ouvert
 *  pw-05-ndvi-3m.png         — periode 3M
 *  pw-06-ndvi-6m.png         — periode 6M
 */

import { expect, test } from '@playwright/test';

// ─── Config ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

const PARCEL_NAME = `Playwright GPS Test ${Date.now()}`;

/** Polygone ~5 ha dans la forêt classée de Thiès */
const THIES_COORDS: number[][][] = [[
  [-16.935, 14.768],
  [-16.928, 14.768],
  [-16.928, 14.774],
  [-16.935, 14.774],
  [-16.935, 14.768],
]];

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@senagros.local');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

/** Appel tRPC via fetch (côté browser) */
async function trpcMutation(
  page: import('@playwright/test').Page,
  procedure: string,
  input: unknown,
): Promise<unknown> {
  return page.evaluate(
    async ({ proc, inp }) => {
      const res = await fetch(`/api/trpc/${proc}?batch=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': { json: inp } }),
      });
      const json = await res.json() as Array<{ result?: { data?: { json?: unknown } }; error?: unknown }>;
      if (!res.ok || json[0]?.error) {
        throw new Error(`tRPC ${proc} failed: ${JSON.stringify(json[0]?.error ?? json)}`);
      }
      return json[0]?.result?.data?.json;
    },
    { proc: procedure, inp: input },
  );
}

async function trpcQuery(
  page: import('@playwright/test').Page,
  procedure: string,
  input: unknown,
): Promise<unknown> {
  return page.evaluate(
    async ({ proc, inp }) => {
      const params = encodeURIComponent(JSON.stringify({ '0': { json: inp } }));
      const res = await fetch(`/api/trpc/${proc}?batch=1&input=${params}`);
      const json = await res.json() as Array<{ result?: { data?: { json?: unknown } }; error?: unknown }>;
      if (!res.ok || json[0]?.error) {
        throw new Error(`tRPC ${proc} failed: ${JSON.stringify(json[0]?.error ?? json)}`);
      }
      return json[0]?.result?.data?.json;
    },
    { proc: procedure, inp: input },
  );
}

/** Injecte selectedParcel dans le state React de MapView pour ouvrir le NdviPanel
 *  sans dépendre du rendu WebGL (queryRenderedFeatures = 0 en headless). */
async function openNdviPanel(
  page: import('@playwright/test').Page,
  parcel: { id: string; name: string; data: Record<string, unknown> },
) {
  await page.evaluate((p) => {
    // Remonte le fiber React depuis le conteneur MapLibre
    const container = document.querySelector('.maplibregl-map');
    if (!container) throw new Error('MapLibre container not found');
    const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactFiber'));
    if (!fiberKey) throw new Error('React fiber not found');

    let fiber = (container as Record<string, unknown>)[fiberKey] as {
      memoizedState?: { memoizedState?: unknown; queue?: { dispatch?: (v: unknown) => void }; next?: unknown } | null;
      return?: unknown;
    } | null;

    // Cherche le dispatch dont memoizedState est null (selectedParcel, initial value)
    for (let depth = 0; depth < 50 && fiber; depth++) {
      let hook = fiber.memoizedState;
      while (hook) {
        const q = hook.queue as { dispatch?: (v: unknown) => void } | undefined;
        if (q?.dispatch && hook.memoizedState === null) {
          q.dispatch(p); // setSelectedParcel({ id, name, data })
          return;
        }
        hook = (hook as { next?: typeof hook }).next ?? null;
      }
      fiber = (fiber as { return?: typeof fiber }).return ?? null;
    }
    throw new Error('setSelectedParcel dispatch not found in fiber tree');
  }, parcel);
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe.configure({ mode: 'serial' });

test.describe(`NDVI GPS — ${BASE_URL}`, () => {
  let assetId: string;
  // farmId n'est pas nécessaire pour les mutations asset (injecté via session serveur)

  // ── 1. Créer la parcelle via le formulaire ──────────────────────────────
  test('1 — créer une parcelle via le formulaire', async ({ page }) => {
    await login(page);

    await page.goto(`${BASE_URL}/assets/new`);
    await expect(page.locator('h1').filter({ hasText: 'Nouvel asset' })).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: 'docs/guide/screenshots/pw-01-parcel-form.png',
    });

    // Sélectionner le type "Parcelle" (land)
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('land');

    // Remplir le nom
    await page.fill('input[placeholder*="Parcelle"]', PARCEL_NAME);

    // Surface
    const surfaceInput = page.locator('input[type="number"]').first();
    await surfaceInput.fill('5.00');

    // Soumettre
    await page.click('button[type="submit"]');

    // Attendre la redirection vers /assets/{id}
    await page.waitForURL(/\/assets\/[a-f0-9-]{36}$/, { timeout: 15_000 });

    const url = page.url();
    assetId = url.split('/').pop()!;
    expect(assetId).toMatch(/^[a-f0-9-]{36}$/);

    await page.screenshot({
      path: 'docs/guide/screenshots/pw-02-parcel-created.png',
    });

    test.info().annotations.push({ type: 'assetId', description: assetId });
  });

  // ── 2. Ajouter les coordonnées GPS via tRPC update ─────────────────────
  test('2 — ajouter les coordonnées GPS via tRPC', async ({ page }) => {
    await login(page);

    if (!assetId) {
      test.skip(!assetId, 'Test 1 doit passer en premier');
      return;
    }

    const updated = await trpcMutation(page, 'asset.update', {
      id: assetId,
      data: {
        coordinates: THIES_COORDS,
        surface_ha: 5.0,
        soil_type: 'sableux',
        irrigation_type: 'goutte_a_goutte',
      },
    }) as { id: string; name: string } | null;

    expect(updated?.id).toBe(assetId);
    expect(updated?.name).toBe(PARCEL_NAME);

    test.info().annotations.push({
      type: 'info',
      description: `Parcelle ${assetId} mise à jour avec coordonnées GPS Thiès`,
    });
  });

  // ── 3. Vérifier que l'API NDVI retourne hasGeometry: true ──────────────
  test('3 — API NDVI retourne hasGeometry: true', async ({ page }) => {
    await login(page);

    if (!assetId) {
      test.skip(!assetId, 'Test 1 doit passer en premier');
      return;
    }

    const result = await trpcQuery(page, 'ndvi.getTimeSeries', {
      assetId,
      months: 12,
    }) as { data: unknown[]; hasGeometry: boolean } | null;

    expect(result).not.toBeNull();
    expect(result?.hasGeometry).toBe(true);
    // data peut être [] si credentials Sentinel Hub invalides (fallback mock)
    // La valeur importante est hasGeometry: true

    test.info().annotations.push({
      type: 'ndvi',
      description: `hasGeometry=${result?.hasGeometry}, data.length=${result?.data?.length ?? 0}`,
    });
  });

  // ── 4. Carte — la parcelle apparaît sur la carte ───────────────────────
  test('4 — carte chargée avec les parcelles', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/map`);

    // Attendre que MapLibre canvas soit présent
    const canvas = page.locator('canvas.maplibregl-canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Attendre que les données tRPC se chargent (map.getParcels)
    await page.waitForTimeout(3_000);

    // Vérifier que le switcher de couches est présent
    await expect(page.getByRole('button', { name: 'OSM' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Satellite' })).toBeVisible();

    await page.screenshot({
      path: 'docs/guide/screenshots/pw-03-map-parcels.png',
    });

    // Vérifier via fiber que les layers parcelle sont bien dans le style MapLibre
    // Le map est stocké via useRef → hook.memoizedState.current
    const layerIds = await page.evaluate(() => {
      const container = document.querySelector('.maplibregl-map');
      if (!container) return [];
      const fiberKey = Object.keys(container).find((k) => k.startsWith('__reactFiber'));
      if (!fiberKey) return [];
      let fiber = (container as Record<string, unknown>)[fiberKey] as {
        memoizedState?: { memoizedState?: { current?: unknown }; next?: unknown } | null;
        return?: unknown;
      } | null;
      for (let i = 0; i < 50 && fiber; i++) {
        let hook = fiber.memoizedState;
        while (hook) {
          // useRef pattern: hook.memoizedState = { current: <mapInstance> }
          const ref = hook.memoizedState;
          if (ref && typeof ref === 'object' && 'current' in (ref as object)) {
            const cur = (ref as { current?: unknown }).current;
            if (cur && typeof cur === 'object' && 'getCenter' in (cur as object) && 'getStyle' in (cur as object)) {
              const map = cur as { getStyle: () => { layers?: Array<{ id: string }> } };
              return (map.getStyle()?.layers ?? []).map((l) => l.id);
            }
          }
          hook = (hook as { next?: typeof hook }).next ?? null;
        }
        fiber = (fiber as { return?: typeof fiber }).return ?? null;
      }
      return [];
    });

    const parcelFillLayers = (layerIds as string[]).filter((id) => id.includes('-fill'));
    // Les layers peuvent être absents si les parcelles ne sont pas encore en BDD (prod vide)
    // En local avec les parcelles seedées, on attend au moins 1 layer fill
    test.info().annotations.push({
      type: 'layers',
      description: `Found ${parcelFillLayers.length} parcel fill layers: ${parcelFillLayers.join(', ')}`,
    });
    if (BASE_URL.includes('localhost')) {
      expect(parcelFillLayers.length).toBeGreaterThan(0);
    }
  });

  // ── 5. NdviPanel s'ouvre correctement (injection React state) ──────────
  test('5 — NdviPanel s\'ouvre avec le selecteur de période', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/map`);

    const canvas = page.locator('canvas.maplibregl-canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3_000);

    if (!assetId) {
      test.skip(!assetId, 'Test 1 doit passer en premier');
      return;
    }

    // Ouvrir le NdviPanel en injectant le state React (bypass WebGL headless)
    await openNdviPanel(page, {
      id: assetId,
      name: PARCEL_NAME,
      data: { surface_ha: 5.0, soil_type: 'sableux' },
    });

    await page.waitForTimeout(1_000);

    // Vérifier que le panneau NDVI est visible (h3 heading strict)
    await expect(page.getByRole('heading', { name: 'Indice NDVI' })).toBeVisible({ timeout: 5_000 });

    // Vérifier les boutons de sélection de période
    await expect(page.getByRole('button', { name: '3M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '6M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '12M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '24M' })).toBeVisible();

    // Période par défaut = 12M
    await expect(page.getByText('Evolution NDVI (12 mois)')).toBeVisible();

    await page.screenshot({
      path: 'docs/guide/screenshots/pw-04-ndvi-panel.png',
    });

    // Switcher vers 3M
    await page.getByRole('button', { name: '3M' }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Evolution NDVI (3 mois)')).toBeVisible();
    await page.screenshot({ path: 'docs/guide/screenshots/pw-05-ndvi-3m.png' });

    // Switcher vers 6M
    await page.getByRole('button', { name: '6M' }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Evolution NDVI (6 mois)')).toBeVisible();
    await page.screenshot({ path: 'docs/guide/screenshots/pw-06-ndvi-6m.png' });

    // Switcher vers 24M
    await page.getByRole('button', { name: '24M' }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Evolution NDVI (24 mois)')).toBeVisible();

    // Retour 12M
    await page.getByRole('button', { name: '12M' }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Evolution NDVI (12 mois)')).toBeVisible();

    // Fermer le panneau
    const closeBtn = page.locator('button[aria-label="Fermer"], button').filter({ hasText: '×' }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
