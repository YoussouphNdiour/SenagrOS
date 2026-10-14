import { type Browser, expect, type Page, test } from '@playwright/test';

/**
 * Phase 13 storefront journeys. Requires the seeded database
 * (pnpm db:seed or pnpm db:seed:storefront) and the dev server.
 */

// Journeys share demo accounts (and the superette's persisted cart): run them one at a time
test.describe.configure({ mode: 'serial' });

const ADMIN = { email: 'admin@senagros.local', password: 'admin123' };
const SUPERETTE = { email: 'superette@senagros.local', password: 'buyer123' };

async function login(page: Page, user: { email: string; password: string }, callbackUrl?: string) {
  await page.goto(callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

/** Selects the delivery zone whose option label starts with `zoneName —`. */
async function selectZone(page: Page, farmName: string, zoneName: string) {
  const select = page.getByLabel(`Zone de livraison ${farmName}`);
  const option = select.locator('option', { hasText: new RegExp(`^${zoneName} —`) });
  await select.selectOption((await option.getAttribute('value')) ?? '');
}

/** Empties the cart (including a buyer's DB-persisted cart, merged at login). */
async function emptyCart(page: Page) {
  await page.goto('/panier');
  const empty = page.getByText('Votre panier est vide');
  const lines = page.getByTestId('cart-line');
  await expect(empty.or(lines.first())).toBeVisible();
  while ((await lines.count()) > 0) {
    await lines.first().getByRole('button', { name: /^Retirer/ }).click();
  }
  await expect(empty).toBeVisible();
}

async function openProduct(page: Page, name: string) {
  await page.goto(`/catalogue?q=${encodeURIComponent(name)}`);
  await page.getByTestId('product-card').filter({ hasText: name }).first().click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

async function setQuantity(page: Page, quantity: number) {
  const input = page.getByTestId('quantity-input');
  await input.fill(String(quantity));
  await expect(input).toHaveValue(String(quantity));
}

/** Cart → checkout (zone Dakar, COD) → returns the created order number. */
async function checkoutCod(page: Page, farmName: string): Promise<string> {
  await page.goto('/panier');
  await selectZone(page, farmName, 'Dakar');
  await page.getByRole('button', { name: 'Valider la commande' }).click();
  await page.waitForURL(/\/checkout/);
  await completeCheckout(page);
  const orderNumber = (await page.getByTestId('order-number').first().textContent())?.trim() ?? '';
  expect(orderNumber).toMatch(/^CMD-\d{4}-\d{6}$/);
  return orderNumber;
}

async function completeCheckout(page: Page) {
  await expect(page.getByRole('heading', { name: 'Finaliser ma commande' })).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Continuer' }).click();
    if (i === 2) await page.getByLabel('Paiement à la livraison').check();
  }
  await page.getByRole('button', { name: 'Confirmer la commande' }).click();
  await page.waitForURL(/\/checkout\/succes/);
  await expect(
    page.getByRole('heading', { name: 'Merci, votre commande est enregistrée !' }),
  ).toBeVisible();
}

test.describe('Storefront — parcours acheteur', () => {
  test('homepage → catalogue → fiche → panier → inscription → checkout COD → mes commandes', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // Homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Produits frais du champ à votre table' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comment ça marche' })).toBeVisible();

    // Catalogue
    await page.getByRole('link', { name: /Découvrir/ }).first().click();
    await expect(page).toHaveURL(/\/catalogue/);
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    // Product page: anonymous visitor sees the detail price and the 3-level grid
    await openProduct(page, 'Tomates fraîches');
    await expect(page.getByTestId('product-detail-price')).toContainText('500 FCFA');
    await expect(page.getByTestId('price-grid')).toContainText('Superette');
    await setQuantity(page, 10);
    await page.getByRole('button', { name: 'Ajouter au panier' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    // Cart: 10 kg × 500 = 5 000 FCFA
    await page.getByTestId('cart-link').click();
    await expect(page.getByTestId('cart-subtotal')).toHaveText('5 000 FCFA');
    await selectZone(page, 'SCL Diama', 'Dakar');
    await expect(page.getByTestId('cart-total')).toHaveText('7 000 FCFA');
    await page.getByRole('button', { name: 'Valider la commande' }).click();

    // Buyer registration
    await expect(page).toHaveURL(/inscription-acheteur/);
    const email = `e2e-${Date.now()}@example.sn`;
    await page.locator('#contactName').fill('Client E2E');
    await page.locator('#phone').fill('77 000 11 22');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('secret123');
    await page.locator('#address').fill('Rue 10, Médina');
    await page.locator('#city').fill('Dakar');
    await page.getByRole('button', { name: 'Créer mon compte acheteur' }).click();

    // Checkout COD (cart survives registration)
    await page.waitForURL(/\/checkout$/);
    await expect(page.getByTestId('checkout-total')).toHaveText('7 000 FCFA');
    await completeCheckout(page);
    const orderNumber = (await page.getByTestId('order-number').first().textContent())?.trim();
    expect(orderNumber).toMatch(/^CMD-/);

    // My orders
    await page.getByRole('link', { name: 'Mes commandes' }).last().click();
    await expect(page).toHaveURL(/\/mes-commandes$/);
    const row = page.getByTestId('my-order').filter({ hasText: orderNumber ?? '' });
    await expect(row).toContainText('En attente');
    await row.getByRole('link', { name: 'Détails & suivi' }).click();
    await expect(page.getByTestId('order-timeline')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annuler la commande' })).toBeVisible();
  });
});

test.describe('Storefront — prix différenciés', () => {
  test('a superette sees semi-gros prices', async ({ page }) => {
    test.setTimeout(120_000);
    await login(page, SUPERETTE);
    await expect(page).toHaveURL('/');
    await openProduct(page, 'Tomates fraîches');
    await expect(page.getByText('Prix semi-gros')).toBeVisible();
    await expect(page.getByTestId('product-detail-price')).toContainText('400 FCFA');

    // 50 kg in the cart are priced at 400 FCFA/kg
    await setQuantity(page, 50);
    await page.getByRole('button', { name: 'Ajouter au panier' }).click();
    await page.getByTestId('cart-link').click();
    const line = page.getByTestId('cart-line').filter({ hasText: 'Tomates fraîches' });
    await expect(line).toContainText('400 FCFA /kg');
  });
});

async function newPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

test.describe('Storefront — parcours producteur', () => {
  test('publier → recevoir commande → confirmer → préparer → expédier → livrer', async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const productName = `Carottes E2E ${Date.now()}`;

    // Producer publishes a product with a 3-level price grid
    const seller = await newPage(browser);
    await login(seller, ADMIN);
    await seller.goto('/dashboard/storefront/produits');
    await seller.getByTestId('new-listing').click();
    await seller.locator('#name').fill(productName);
    await seller.locator('#category').selectOption('legumes');
    await seller.locator('#stockAvailable').fill('100');
    await seller.locator('#minOrderQuantity').fill('1');
    await seller.locator('#photoUrl').fill('/storefront/products/carottes.svg');
    await seller.locator('#priceDetail').fill('1000');
    await seller.locator('#priceSemiGros').fill('900');
    await seller.locator('#minSemiGros').fill('5');
    await seller.locator('#priceGros').fill('800');
    await seller.locator('#minGros').fill('50');
    await seller.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(seller.getByTestId('seller-listing').filter({ hasText: productName })).toBeVisible();

    // A superette orders it (COD)
    const buyer = await newPage(browser);
    await login(buyer, SUPERETTE);
    await emptyCart(buyer);
    await openProduct(buyer, productName);
    await expect(buyer.getByTestId('product-detail-price')).toContainText('900 FCFA');
    await setQuantity(buyer, 10);
    await buyer.getByRole('button', { name: 'Ajouter au panier' }).click();
    const orderNumber = await checkoutCod(buyer, 'SCL Diama');

    // Producer receives it and runs the workflow
    await seller.goto('/dashboard/storefront/commandes');
    const row = seller.locator('tr', { hasText: orderNumber });
    await expect(row).toContainText('En attente');
    for (const [action, label] of [
      ['confirm', 'Confirmée'],
      ['prepare', 'En préparation'],
      ['ship', 'Expédiée'],
      ['deliver', 'Livrée'],
    ] as const) {
      if (action === 'deliver') seller.once('dialog', (d) => d.accept());
      await row.getByTestId(`action-${action}`).click();
      await expect(row.getByTestId('seller-order-status')).toHaveText(label);
    }
    await expect(row).toContainText('Payé');

    // New-order notification was created for the producer
    await seller.goto('/notifications');
    await expect(seller.getByText(`Nouvelle commande ${orderNumber}`)).toBeVisible();

    // Buyer sees the delivered order and can leave a review
    await buyer.goto('/mes-commandes');
    await buyer.getByTestId('my-order').filter({ hasText: orderNumber }).getByRole('link', { name: 'Détails & suivi' }).click();
    await expect(buyer.getByTestId('order-status')).toHaveText('Livrée');
    await buyer
      .getByRole('listitem')
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Laisser un avis' })
      .click();
    await buyer.locator('label', { has: buyer.getByRole('radio', { name: '5 étoiles' }) }).click();
    await expect(buyer.getByRole('radio', { name: '5 étoiles' })).toBeChecked();
    await buyer.getByLabel('Commentaire').fill('Carottes très fraîches');
    await buyer.getByRole('button', { name: 'Publier mon avis' }).click();
    await expect(buyer.getByText('Carottes très fraîches')).toBeVisible();
  });
});
