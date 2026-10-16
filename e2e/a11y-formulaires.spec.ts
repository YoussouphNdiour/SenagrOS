import { expect, type Page, test } from '@playwright/test';

/**
 * Accessibilite des formulaires.
 *
 * Ces tests ne relisent pas le lint : ils interrogent le DOM rendu. Un
 * libelle peut porter un htmlFor pointant vers un identifiant inexistant, ou
 * deux champs peuvent partager le meme identifiant — deux cas que Biome ne
 * voit pas et qui cassent pourtant la saisie au lecteur d'ecran.
 */

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('admin@senagros.local');
  await page.locator('#password').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByTitle('Déconnexion')).toBeVisible();
}

/** Pages portant les formulaires de saisie quotidienne. */
const PAGES_FORMULAIRES = [
  '/quick/irrigation',
  '/quick/harvest',
  '/quick/input',
  '/quick/observation',
  '/quick/birth',
];

test.describe('accessibilité des formulaires', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const chemin of PAGES_FORMULAIRES) {
    test(`chaque champ visible de ${chemin} porte un nom accessible`, async ({ page }) => {
      const reponse = await page.goto(chemin);
      test.skip(reponse?.status() === 404, `${chemin} absent de cette version`);

      // Laisse le rendu client s'installer avant d'inspecter le DOM.
      await page.waitForLoadState('networkidle');

      const sansNom = await page.evaluate(() => {
        const champs = [
          ...document.querySelectorAll<HTMLElement>('input, select, textarea'),
        ].filter((el) => {
          const type = el.getAttribute('type');
          if (type === 'hidden') return false;
          return el.offsetParent !== null;
        });

        return champs
          .filter((el) => {
            const id = el.id;
            const parLabel = id
              ? !!document.querySelector(`label[for="${CSS.escape(id)}"]`)
              : false;
            const enveloppe = !!el.closest('label');
            const aria =
              !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby');
            return !parLabel && !enveloppe && !aria;
          })
          .map((el) => ({
            balise: el.tagName.toLowerCase(),
            nom: el.getAttribute('name') ?? '',
            id: el.id,
          }));
      });

      expect(
        sansNom,
        `Champs sans nom accessible sur ${chemin} : ${JSON.stringify(sansNom)}`,
      ).toEqual([]);
    });

    test(`aucun identifiant de champ duplique sur ${chemin}`, async ({ page }) => {
      const reponse = await page.goto(chemin);
      test.skip(reponse?.status() === 404, `${chemin} absent de cette version`);
      await page.waitForLoadState('networkidle');

      const doublons = await page.evaluate(() => {
        const vus = new Map<string, number>();
        for (const el of document.querySelectorAll<HTMLElement>('input, select, textarea')) {
          if (!el.id) continue;
          vus.set(el.id, (vus.get(el.id) ?? 0) + 1);
        }
        return [...vus.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id} x${n}`);
      });

      expect(doublons, `Identifiants dupliques sur ${chemin}`).toEqual([]);
    });
  }

  test('un htmlFor pointe toujours vers un champ existant', async ({ page }) => {
    await page.goto('/quick/irrigation');
    await page.waitForLoadState('networkidle');

    const orphelins = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLLabelElement>('label[for]')]
        .map((l) => l.getAttribute('for') as string)
        .filter((id) => !document.getElementById(id)),
    );

    expect(orphelins, 'Libellés pointant vers un identifiant inexistant').toEqual([]);
  });

  test('le menu mobile se ferme à la touche Échap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto('/dashboard');

    const voile = page.locator('div[aria-hidden="true"].fixed.inset-0.z-40');
    await expect(voile).toHaveCount(0);

    await page.locator('button.shrink-0.rounded-lg.p-2.text-gray-500.md\\:hidden').click();
    await expect(voile).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(voile).toHaveCount(0);
  });
});
