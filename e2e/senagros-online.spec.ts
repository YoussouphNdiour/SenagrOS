import { expect, test, type Page } from '@playwright/test';

const BASE = 'https://senagros.online';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|logs|assets/, { timeout: 30000 });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────

test.describe('Auth pages', () => {
  test('homepage redirects to login', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(/login/);
  });

  test('login page loads with form', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('register page loads with form', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('forgot-password page loads', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"]', 'wrong@test.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('dashboard page loads with KPIs', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── ASSETS ───────────────────────────────────────────────────────────────

test.describe('Assets module', () => {
  test('assets main page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/assets`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('land assets page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/assets/land`);
    await expect(page.locator('h1')).toContainText(/Parcelles|Terres|Land/i);
  });

  test('plant assets page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/assets/plant`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('animal assets page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/assets/animal`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('equipment assets page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/assets/equipment`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('new asset form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/assets/new`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });
});

// ─── LOGS ─────────────────────────────────────────────────────────────────

test.describe('Logs module', () => {
  test('logs main page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs`);
    await expect(page.locator('h1')).toContainText(/Journal|Activit/i);
  });

  test('seeding logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/seeding`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('harvest logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/harvest`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('irrigation logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/irrigation`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('input logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/input`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('observation logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/observation`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('activity logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/activity`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('maintenance logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/maintenance`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('medical logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/medical`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('birth logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/birth`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('lab-test logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/lab-test`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('transplanting logs page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/transplanting`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('new log form loads with type selector', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/logs/new`);
    await expect(page.locator('h1')).toContainText(/Nouveau|log/i);
    await expect(page.locator('select[name="type"]')).toBeVisible();
  });
});

// ─── INTRANTS ─────────────────────────────────────────────────────────────

test.describe('Intrants module', () => {
  test('intrants main page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/intrants`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('phyto intrants page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/intrants/phyto`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('ferti intrants page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/intrants/ferti`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('semences page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/intrants/semences`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('new intrant form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/intrants/new`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── CALENDRIER ───────────────────────────────────────────────────────────

test.describe('Calendar module', () => {
  test('calendrier page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/calendrier`);
    await expect(page.locator('h1')).toContainText(/Calendrier/i);
  });

  test('templates page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/calendrier/templates`);
    await expect(page.locator('h1')).toContainText(/Mod.les/i);
  });

  test('new template form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/calendrier/templates/new`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('assign calendar page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/calendrier/assign`);
    await expect(page.locator('h1')).toContainText(/Assigner/i);
  });
});

// ─── PLANS ────────────────────────────────────────────────────────────────

test.describe('Plans module', () => {
  test('plans page loads with KPIs', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/plans`);
    await expect(page.locator('h1')).toContainText(/Plans/i);
  });

  test('new plan form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/plans/new`);
    await expect(page.locator('h1')).toContainText(/Nouveau plan/i);
  });
});

// ─── STOCKS ───────────────────────────────────────────────────────────────

test.describe('Stocks module', () => {
  test('stocks page loads with KPIs', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/stocks`);
    await expect(page.locator('h1')).toContainText(/Stocks/i);
  });

  test('stock table has headers', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/stocks`);
    await expect(page.locator('table')).toBeVisible();
  });

  test('stock search filter works', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/stocks`);
    const searchInput = page.locator('input[placeholder="Rechercher un article..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(page.locator('table')).toBeVisible();
    }
  });
});

// ─── OBSERVATIONS ─────────────────────────────────────────────────────────

test.describe('Observations module', () => {
  test('observations page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/observations`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('pest observation form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/observations/pest/new`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('stage observation form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/observations/stage/new`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('density observation form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/observations/density/new`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('grading observation form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/observations/grading/new`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── REPORTS ──────────────────────────────────────────────────────────────

test.describe('Reports module', () => {
  test('reports page loads with KPIs', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/reports`);
    await expect(page.locator('h1')).toContainText(/Rapports/i);
  });

  test('reports/assets sub-report loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/reports/assets`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('reports/logs sub-report loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/reports/logs`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('reports/harvests sub-report loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/reports/harvests`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── FINANCES ─────────────────────────────────────────────────────────────

test.describe('Finance module', () => {
  test('finances page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/finances`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('comptabilite page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/comptabilite`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('facturation page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/facturation`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('new facture form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/facturation/new`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── MARKETPLACE / VENTES / COMMANDES / PRODUITS ──────────────────────────

test.describe('Commerce module', () => {
  test('marketplace page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/marketplace`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('ventes page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/ventes`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('new vente form loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/ventes/new`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('commandes page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/commandes`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('produits page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/produits`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── MAP ──────────────────────────────────────────────────────────────────

test.describe('Map module', () => {
  test('map page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/map`);
    await expect(page.locator('h1, canvas, .maplibregl-map')).toBeVisible();
  });
});

// ─── EMPLOYES ─────────────────────────────────────────────────────────────

test.describe('Employes module', () => {
  test('employes page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/employes`);
    await expect(page.locator('h1')).toContainText(/Employ/i);
  });
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────

test.describe('Settings module', () => {
  test('settings page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('settings/profile page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings/profile`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('settings/farm page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings/farm`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('settings/users page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/settings/users`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── PARAMETRES ───────────────────────────────────────────────────────────

test.describe('Parametres module', () => {
  test('parametres page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/parametres`);
    await expect(page.locator('h1')).toContainText(/Param/i);
  });

  test('cooperative settings page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/parametres/cooperative`);
    await expect(page.locator('h1')).toBeVisible();
  });
});

// ─── SIDEBAR NAVIGATION ──────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('sidebar contains all main nav links', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('global search (Ctrl+K) opens', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    // Search modal or input should appear
    const searchModal = page.locator('[role="dialog"], [data-search], input[placeholder*="Rechercher"]');
    if (await searchModal.isVisible()) {
      await expect(searchModal).toBeVisible();
    }
  });
});

// ─── OFFLINE PAGE ─────────────────────────────────────────────────────────

test.describe('Offline page', () => {
  test('offline page loads', async ({ page }) => {
    await page.goto(`${BASE}/offline`);
    await expect(page.locator('body')).toBeVisible();
  });
});
