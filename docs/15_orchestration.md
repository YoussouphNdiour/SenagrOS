# 15 - Orchestration

## Comment utiliser ces prompts avec Claude Code

### Principe
Chaque session Claude Code doit lire les fichiers .md pertinents AVANT de coder. Les fichiers sont la source de verite — pas la memoire de conversation.

---

## Ordre de lecture par session

### Session de demarrage (premiere session)
```
1. Lire 01_project_overview.md         → comprendre le projet
2. Lire 09_code_conventions.md         → connaitre les standards
3. Lire 03_data_model.md               → comprendre le schema
4. Lire 11_rebuild_plan.md             → voir la phase en cours
5. Lire 16_decisions.md                → voir les decisions passees
6. Executer Phase 0
```

### Session de developpement (sessions suivantes)
```
1. Lire 11_rebuild_plan.md             → identifier la phase en cours
2. Lire 16_decisions.md                → decisions de la session precedente
3. Lire les fichiers specifiques a la phase :
   - Phase 1 : 02 (Module 3), 03 (assets), 04 (assetRouter), 05 (pages assets)
   - Phase 2 : 02 (Module 4), 03 (logs), 04 (logRouter), 05 (pages logs)
   - Phase 3 : 02 (Module 5), 03 (material), 04 (inputRouter), 05 (pages intrants)
   - Phase 4 : 02 (Module 6), 03 (observation_forms), 04 (observationRouter), 12 (fiches SCL)
   - Phase 5 : 02 (Module 7), 03 (calendars), 04 (calendarRouter)
   - etc.
4. Lire 13_gap_fill_and_verification.md → checklist de la phase
5. Coder
6. Mettre a jour 11_rebuild_plan.md     → cocher les livrables faits
7. Mettre a jour 16_decisions.md        → noter les decisions prises
8. Mettre a jour 10_current_issues.md   → si nouveaux problemes decouverts
```

---

## Prompt de demarrage de session

Copier-coller ce prompt au debut de chaque session Claude Code :

```
Je travaille sur le projet SenagrOS, un FMIS agricole.

Lis les fichiers suivants dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 01_project_overview.md (contexte projet)
- 11_rebuild_plan.md (plan et phase en cours)  
- 16_decisions.md (decisions des sessions precedentes)
- 09_code_conventions.md (standards de code)

Puis identifie la phase en cours dans 11_rebuild_plan.md et lis les fichiers 
de spec correspondants (02, 03, 04, 05) pour cette phase.

Le code source est dans /Users/yusper/Downloads/SenagrOS/
Continue le travail la ou la session precedente s'est arretee.
```

---

## Prompts par phase

### Phase 0 — Scaffolding

```
Je travaille sur le projet SenagrOS, un FMIS agricole pour l'Afrique de l'Ouest.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 01_project_overview.md (contexte, stack, principes)
- 03_data_model.md (21 tables Drizzle completes)
- 09_code_conventions.md (standards de code)
- 16_decisions.md (decisions passees)

Phase 0 : Scaffolding — creer le projet from scratch.

Actions :
1. Creer le projet Next.js 15 dans /Users/yusper/Downloads/SenagrOS/ avec : npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-pnpm
2. Installer les dependances : @trpc/server @trpc/client @trpc/react-query @tanstack/react-query drizzle-orm drizzle-kit postgres next-auth@5 @auth/core @auth/drizzle-adapter maplibre-gl react-map-gl recharts next-intl zod react-hook-form @hookform/resolvers bcryptjs
3. Installer les devDeps : vitest @testing-library/react @testing-library/jest-dom playwright @playwright/test @types/bcryptjs biome
4. Creer docker-compose.yml avec PostgreSQL 16 + PostGIS 3.4
5. Creer le schema Drizzle complet dans src/server/db/schema/ — TOUTES les 21 tables de 03_data_model.md : farms, users, assets, logs, log_assets, quantities, plans, plan_logs, inventory, taxonomies, files, revisions, api_keys, farm_members, farm_invitations, cooperatives, cooperative_members, cooperative_invitations, cultural_calendars, parcel_calendars, observation_forms
6. Configurer drizzle.config.ts, generer et appliquer la migration initiale
7. Creer le seed (src/server/db/seed.ts) avec : cultures senegalaises (mil, sorgho, arachide, niebe, riz, mais doux, haricot vert, oignon, tomate, gombo), saisons (hivernage, contre-saison chaude/froide), familles de cultures, types de ravageurs (chenilles, pucerons, mouche blanche, thrips, acariens, nematodes), types de maladies (mildiou, oidium, fusariose, bacteriose, virose), stades culturaux, types d'equipements (tracteur, semoir, pulverisateur...), sous-categories intrants (phyto: herbicide/fongicide/insecticide/acaricide, ferti: mineral/organique/amendement, semence: certifiee/paysanne)
8. Configurer Auth.js v5 dans src/server/auth.ts avec Credentials provider (email + password hash bcrypt), session JWT
9. Creer les pages auth : src/app/(auth)/login/page.tsx, register/page.tsx, forgot-password/page.tsx
10. Creer le layout dashboard dans src/app/(dashboard)/layout.tsx avec DashboardShell
11. Creer les composants UI de base dans src/components/ui/ : Button, Card, KpiCard, Input, Select, Textarea, DatePicker, Modal, ConfirmDialog, DataTable, Pagination, SearchInput, Badge, StateBadge, EmptyState, Toast, Dropdown, Tabs, Breadcrumb, FileUpload, Sidebar, Topbar, BottomNav, DashboardShell, OfflineBanner, FarmSwitcher — design TailAdmin avec palette verte (#1B5E20 → #4CAF50), KPI cards en degrade colore
12. Configurer tRPC dans src/server/trpc.ts avec contexte auth
13. Creer src/app/api/trpc/[trpc]/route.ts
14. Configurer Biome (biome.json), Vitest (vitest.config.ts)
15. Ecrire CLAUDE.md a la racine avec toutes les instructions projet
16. Ecrire des tests de base : au moins 5 tests unitaires composants UI + 1 test schema
17. Verifier : pnpm dev (port 3000), pnpm typecheck, pnpm lint, pnpm test

Respecte le design TailAdmin de la V2 visible dans les screenshots /Users/yusper/Downloads/SENAGROS FARMOS/*.png — sidebar blanche a gauche, topbar avec FarmSwitcher, KPI cards colorees (vert/orange/bleu), fond gris clair.

A la fin, mets a jour 11_rebuild_plan.md (cocher les livrables) et 16_decisions.md (noter les decisions).
```

---

### Phase 1 — Assets & Parcelles

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md (phase en cours)
- 16_decisions.md (decisions passees)
- 02_features.md (Module 3 : Assets)
- 03_data_model.md (table assets, JSONB data par type)
- 04_api_spec.md (assetRouter — toutes les procedures)
- 05_ui_spec.md (pages assets, pattern liste, pattern detail, pattern formulaire modal)
- 13_gap_fill_and_verification.md (checklist Phase 1)

Phase 1 : Assets & Parcelles.

Actions :
1. Creer src/lib/validators/asset.validator.ts — schemas Zod pour create/update asset, avec validation JSONB data par type (land, plant, animal, equipment, material, seed, product, compost, group, sensor, water, structure)
2. Creer src/server/routers/asset.router.ts — procedures tRPC : list (pagination, filtres type/status/search), getById (avec logs associes, children, files), create, update, archive, restore, search
3. Creer les pages :
   - /assets — liste tous types avec tabs ou filtres
   - /assets/land — parcelles avec 4 KPI cards (Total parcelles, Surface totale, Actives, Patrimoine FCFA)
   - /assets/plant — cultures
   - /assets/animal — animaux avec KPI cards (Total, En bonne sante, Sous suivi, Patrimoine)
   - /assets/equipment — parc materiel avec KPI cards
   - /assets/material, /assets/seed, /assets/product, /assets/compost, /assets/group, /assets/sensor, /assets/water, /assets/structure
   - /assets/new — formulaire creation (type selectionnable, champs dynamiques selon type)
   - /assets/[id] — detail avec onglets (Infos, Logs, Carte, Fichiers, Historique)
   - /assets/[id]/edit — edition
4. Formulaire creation parcelle en modal : code_parcelle, culture (ComboboxAsync depuis taxonomies), surface_ha, date plantation, date recolte prevue, statut (Select), emplacement (texte), rendement attendu (kg/ha), prix unitaire (XOF/kg), ecartement lignes (cm), ecartement plants (cm), irrigation type, soil type — reproduire le design du screenshot farmos-culture-form.png
5. Carte MapLibre dans /map et dans le detail asset : afficher les parcelles comme polygones colores par statut, popup au clic avec infos + lien
6. DataTable avec colonnes triables, SearchInput, filtres dropdowns, pagination (25/page)
7. Tests unitaires : composants AssetsList, AssetDetail, formulaire creation
8. Tests E2E Playwright : creer une parcelle P-06, verifier qu'elle apparait dans la liste, ouvrir le detail, editer, archiver
9. Verifier : pnpm typecheck, pnpm lint, pnpm test, pnpm test:e2e

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 2 — Logs & Semis enrichi

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 4 : Logs, section F4.1 a F4.4)
- 03_data_model.md (table logs, log_assets, quantities, JSONB data par type de log)
- 04_api_spec.md (logRouter, quantityRouter)
- 05_ui_spec.md (pages logs)
- 13_gap_fill_and_verification.md (checklist Phase 2)

Phase 2 : Logs & Semis enrichi.

Actions :
1. Creer src/lib/validators/log.validator.ts — schemas Zod pour chaque type de log (activity, observation, input, harvest, seeding, transplanting, birth, maintenance, medical, lab_test, movement, irrigation)
2. Creer src/server/routers/log.router.ts — procedures : list (pagination, filtres type/status/date/asset/search), getById (avec assets, quantities, observationForm), create, update, delete, complete
3. Creer src/server/routers/quantity.router.ts — CRUD quantities
4. Creer les pages :
   - /logs — liste tous types
   - /logs/activity, /logs/seeding, /logs/observation, /logs/harvest, /logs/input, /logs/maintenance, /logs/birth, /logs/medical, /logs/lab-test, /logs/transplanting — pages par type
   - /logs/new — formulaire creation avec type selectionnable
   - /logs/[id] — detail
   - /logs/[id]/edit — edition
5. Formulaire SEMIS ENRICHI (priorite, feedback agronomes) :
   - Type de semis : radio "Manuel" / "Machine"
   - Si Machine : ComboboxAsync pour selectionner la machine (filtre type=equipment, equipment_type in [semoir, planteuse, semoir_pneumatique])
   - Possibilite d'ajouter un nouveau type de machine via bouton "+"
   - Profondeur de semis (cm) — input number
   - Ecartement entre lignes (cm) — input number
   - Ecartement entre plants (cm) — input number
   - Densite de semis (kg/ha ou plants/ha) — input number + select unite
   - Semence utilisee (ComboboxAsync depuis assets type seed)
   - Parcelle cible (ComboboxAsync depuis assets type land)
6. Assignation materiel sur CHAQUE log :
   - Multi-select machines (ComboboxAsync, assets type equipment)
   - Multi-select employes (ComboboxAsync, users de la ferme)
   - Stocke dans equipment_ids et worker_ids du log
7. Quantities : formulaire repeatable pour ajouter N mesures a un log (value, unit, measure, label)
8. Tests unitaires + E2E : creer un semis machine avec semoir, ecartements, densite → verifier les donnees stockees
9. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 3 — Intrants separes + Stock

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 5 : Intrants — Phyto/Ferti/Semences, section F5.1 et F5.2)
- 03_data_model.md (assets type material/seed, JSONB data pour phyto/ferti/semence, table inventory, quantities avec inventory_adjustment)
- 04_api_spec.md (inputRouter, inventoryRouter)
- 05_ui_spec.md (pages intrants)
- 13_gap_fill_and_verification.md (checklist Phase 3)

Phase 3 : Intrants separes + Gestion de stock.

Actions :
1. Creer src/server/routers/input.router.ts — procedures : listPhyto, listFerti, listSemence, create, update, getStock, applyToLog
2. Creer src/server/routers/inventory.router.ts — procedures : list, getByAsset, adjust, alerts
3. Pages intrants :
   - /intrants — vue d'ensemble avec 3 onglets (Tabs component) : Phytosanitaire / Fertilisation / Semences
   - /intrants/phyto — DataTable avec colonnes : nom commercial, matiere active, sous-categorie (herbicide/fongicide/insecticide/acaricide/nematicide/molluscicide/regulateur/adjuvant), forme, stock actuel, seuil alerte
   - /intrants/ferti — colonnes : nom, composition NPK, sous-categorie (mineral/organique/amendement/oligo/biostimulant), forme, stock
   - /intrants/semences — colonnes : variete, lot, taux germination, certification, provenance, stock
   - /intrants/[id] — detail avec : fiche produit + historique mouvements stock (entrees/sorties, graphique timeline)
   - /intrants/new — formulaire creation : step 1 = choisir categorie (phyto/ferti/semence), step 2 = choisir sous-categorie, step 3 = remplir champs specifiques
4. Gestion de stock :
   - Entrees : achat (log type input avec inventory_adjustment=increment), transfert entrant
   - Sorties : application sur parcelle (log type input avec inventory_adjustment=decrement), transfert sortant
   - Stock actuel = somme des increments - somme des decrements
   - Seuil d'alerte configurable par intrant (dans JSONB data)
   - KPI cards page intrants : Total articles, Stock OK, Alertes (stock < seuil), Patrimoine stock FCFA
5. Valorisation stock : quantite × prix unitaire pour chaque intrant → total FCFA
6. Lien avec logs : quand on cree un log type "input", on selectionne l'intrant (phyto/ferti/semence), la dose, la methode, la machine (pulverisateur/epandeur) → le stock est decremente automatiquement
7. Tests : creer un insecticide "Decis Expert", entrer 10L en stock, appliquer 0.5L/ha sur 2.3ha → verifier stock restant = 10 - 1.15 = 8.85L
8. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 4 — Fiches d'observation terrain

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 6 : Fiches d'observation — F6.1 a F6.4, TRES DETAILLE)
- 03_data_model.md (table observation_forms, structure JSONB form_data et calculated pour chaque type)
- 04_api_spec.md (observationRouter — createDensity, createStage, createPestDisease, createGrading)
- 05_ui_spec.md (maquette ASCII formulaire densite)
- 12_appendix_sources_files.md (donnees exactes des 4 fiches SCL terrain)
- 13_gap_fill_and_verification.md (checklist Phase 4 + mapping fiche SCL → champs SenagrOS)

Phase 4 : Fiches d'observation terrain. C'est la phase la plus importante — elle digitalise les fiches papier SCL.

Actions :
1. Creer src/server/routers/observation.router.ts — toutes les procedures
2. Creer src/lib/validators/observation.validator.ts — schemas Zod pour chaque type de fiche

3. FORMULAIRE DENSITE DE LEVEE :
   - Header : Parcelle (ComboboxAsync), Culture (Select), Variete (Select), Densite semis theorique (auto-rempli depuis la parcelle)
   - Corps : tableau avec N repetitions (defaut 10, configurable) — chaque ligne = numero repetition + input number "Nombre de plants"
   - Footer calculs automatiques (en temps reel quand on tape) :
     * Total plants = somme de toutes les repetitions
     * Densite reelle (plants/ha) = total / (nb_repetitions × surface_echantillon_m2) × 10000
     * Taux de levee (%) = (densite_reelle / densite_semis_theorique) × 100
   - Metadonnees : date observation, heure debut/fin, surface observee (ha), observateur (auto = user connecte)
   - Remarques observateur (Textarea) + Remarques chef de ferme (Textarea)
   - Reproduire le layout de la fiche SCL : 2 colonnes de repetitions cote a cote

4. FORMULAIRE SUIVI STADE CULTURAL :
   - Parcelle, Culture, Variete
   - Stade cultural atteint : Select avec options configurables depuis taxonomies type=cultural_stage
   - Date stade atteint : DatePicker
   - Remarques
   - Simple mais essentiel pour le calendrier cultural (Phase 5)

5. FORMULAIRE MALADIES-RAVAGEURS :
   - Parcelle, Culture, Variete
   - Nombre de cibles : input number (defaut 10)
   - Grille d'observation : tableau avec :
     * Lignes = ravageurs/maladies (charges depuis taxonomies type=pest_type et disease_type)
     * Colonnes = cibles B1 a B10 (ou plus)
     * Cellules = checkbox ou input number (presence/comptage)
     * Colonne Total (auto-calcule)
     * Colonne % infeste (auto-calcule = total / nb_cibles × 100)
     * Colonne Seuil traitement (auto-rempli depuis taxonomie, defaut 5%)
     * Colonne alerte (rouge si % > seuil)
   - Preconisation traitement (Textarea — chef de ferme)
   - Grille scrollable horizontalement sur mobile

6. FORMULAIRE AGREAGE QUALITE PRE-RECOLTE :
   - Parcelle, Culture, Variete
   - Taille echantillon (defaut 20)
   - Section "Longueurs totales" : 4 inputs (>19cm, 19-16cm, 16-14cm, <14cm) + Total auto
   - Section "Longueurs valorisables" : memes 4 inputs + Total auto
   - % valorisable = (total valorisable / total) × 100 (auto)
   - Section "Defauts majeurs" : tableau avec lignes (degats oiseaux, chenilles, malformations, mauvaise fecondation) × colonnes classes de taille + total + %
   - Section "Indice de maturite" : epis matures a date, matures a date previsionnelle, immatures → % maturite auto
   - Commentaires : rendement previsionnel (epis/ha), date previsionnelle recolte

7. LISTE des observations : /observations — DataTable avec colonnes (date, type de fiche, parcelle, culture, observateur, statut)
8. DETAIL observation : /observations/[id] — affichage des resultats calcules, donnees saisies, remarques
9. Export PDF : bouton pour generer un PDF reproduisant le format fiche papier SCL
10. Tests E2E : remplir une fiche densite avec les donnees exactes de la fiche SCL (Rep 1=120, Rep 2=84, etc.) → verifier total=789, densite calculee
11. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 5 — Calendrier cultural

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 7 : Calendrier cultural — F7.1 a F7.3)
- 03_data_model.md (tables cultural_calendars et parcel_calendars, structure JSONB stages et stage_statuses)
- 04_api_spec.md (calendarRouter — listTemplates, createTemplate, assignToParcel, updateStageStatus, getTimeline)
- 05_ui_spec.md (maquette ASCII vue timeline Gantt)
- 13_gap_fill_and_verification.md (checklist Phase 5)

Phase 5 : Calendrier cultural.

Actions :
1. Creer src/server/routers/calendar.router.ts
2. Creer src/lib/validators/calendar.validator.ts
3. TEMPLATES de calendrier (par culture/variete) :
   - Page /calendrier/templates — liste des modeles existants
   - /calendrier/templates/new — formulaire : nom, culture, variete, tableau de stades (nom + duree jours + actions), bouton "Ajouter un stade", duree totale auto
4. ASSIGNATION a une parcelle :
   - /calendrier/assign — formulaire : parcelle, template, date de semis → calcul auto des dates prevues
5. VUE TIMELINE (Gantt simplifie) :
   - /calendrier — axe horizontal mois/semaines, axe vertical parcelles
   - Barres colorees pour la duree du cycle
   - Jalons colores : vert (a temps), orange (retard), bleu (en cours), gris (a venir)
   - Popup au clic sur jalon, filtres saison/culture/statut
6. Mise a jour des stades : lien avec observations "cultural_stage" (Phase 4)
7. Alertes : stade en retard → notification
8. Tests E2E : creer template haricot vert 7 stades, assigner a P-06 avec semis 14/03, verifier timeline
9. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 6 — Plans & Campagnes

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 9 : Plans)
- 03_data_model.md (tables plans, plan_logs)
- 04_api_spec.md (planRouter)
- 05_ui_spec.md (pages plans)

Phase 6 : Plans & Campagnes.

Actions :
1. Creer src/server/routers/plan.router.ts — procedures : list, getById (avec logs), create, update, delete, addLog, removeLog
2. Pages : /plans (liste + KPI), /plans/new, /plans/[id] (detail + progression), /plans/[id]/edit
3. Association plan ↔ logs : bouton "Ajouter un log", ComboboxAsync
4. Suivi progression : barre de progression (logs done / total)
5. Tests E2E : creer plan, associer 3 logs, marquer 2 done, verifier 66%
6. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 7 — Rapports & Dashboard

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 12 : Rapports)
- 04_api_spec.md (reportRouter)
- 05_ui_spec.md (dashboard, pages rapports)
- 12_appendix_sources_files.md (screenshot farmos-dashboard.png)

Phase 7 : Rapports & Dashboard principal.

Actions :
1. Creer src/server/routers/report.router.ts — procedures : dashboard, assets, logs, harvests, financials
2. Dashboard principal (page /) reproduisant farmos-dashboard.png :
   - 2 KPI cards : Patrimoine total FCFA, Benefice net FCFA
   - Graphique Recharts "Revenus & Depenses" (BarChart mensuel)
   - Widget Meteo (Open-Meteo), Alertes, Modules raccourcis, Taches recentes
3. /reports, /reports/assets (PieChart patrimoine), /reports/logs (timeline), /reports/harvests (prevu vs reel)
4. Export Excel (SheetJS) + PDF
5. Tests
6. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 8 — Finances

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 13 : Finances)
- 05_ui_spec.md (pages finances, ventes, facturation, comptabilite)
- 12_appendix_sources_files.md (screenshots farmos-ventes.png, farmos-finances.png, farmos-facturation.png, farmos-comptabilite.png)

Phase 8 : Finances.

Actions :
1. Schema Drizzle si necessaire : tables transactions, invoices, accounts, journal_entries
2. Pages : /ventes (KPI CA/Ventes mois/Clients), /finances (revenus/depenses/solde), /facturation (factures), /comptabilite (journal)
3. Formulaires : nouvelle vente, nouvelle facture
4. Tresorerie : solde caisses, mouvements
5. Reproduire design screenshots V2
6. Tests
7. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 9 — Offline / PWA

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (F15.1 : Offline/PWA)
- 06_decision_token.md (DT-013 et DT-OPEN-001)

Phase 9 : Offline / PWA.

Actions :
1. ServiceWorker via next-pwa ou @serwist/next
2. Cache : cache-first pages/assets, network-first API, fallback /offline
3. Queue sync offline : mutations stockees IndexedDB, rejouees au retour reseau (FIFO, last-write-wins)
4. OfflineBanner : bandeau jaune "Hors ligne"
5. Page /offline : message + bouton "Reessayer"
6. Manifest PWA : nom, icones, theme_color vert, start_url "/"
7. Install prompt dans parametres
8. Tests : simuler offline Playwright, creer log, revenir en ligne, verifier sync
9. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 10 — i18n & Polish

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (F15.2 a F15.6)
- 05_ui_spec.md (responsive, quick actions)

Phase 10 : i18n, responsive mobile, et polish final.

Actions :
1. i18n : fichiers fr.json, en.json, wo.json complets, middleware next-intl, switcher langue
2. Responsive mobile : BottomNav, sidebar hamburger, KPI 1-2/ligne, DataTable mode carte, formulaires plein ecran — tester 375px et 390px
3. Recherche globale : SearchInput topbar, resultats groupes
4. Notifications : page /notifications, types (stock bas, stade retard, tache), badge compteur, mark read
5. Quick actions : /quick (grille boutons), /quick/harvest, /quick/observation, /quick/input, /quick/irrigation, /quick/birth — bouton "+" BottomNav
6. Tests E2E complets : parcours entier login → parcelle → semis → observation → calendrier → recolte → rapports
7. Verifier : pnpm typecheck, pnpm lint, pnpm test, pnpm test:e2e, pnpm build

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 11 — Cooperatives & Multi-fermes

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (F2.2 : Cooperatives)
- 03_data_model.md (cooperatives, cooperative_members, cooperative_invitations)
- 04_api_spec.md (cooperativeRouter)

Phase 11 : Cooperatives & Multi-fermes.

Actions :
1. Creer src/server/routers/cooperative.router.ts — list, create, invite, accept, members, dashboard
2. Pages : /parametres/cooperative — creer, voir membres, inviter
3. Dashboard cooperatif : KPI agreges de toutes les fermes
4. Invitations par token, roles admin/member
5. FarmSwitcher enrichi : fermes perso + fermes cooperative
6. Tests
7. Verifier : pnpm typecheck, pnpm lint, pnpm test

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md.
```

---

### Phase 12 — Marketplace

```
Je travaille sur le projet SenagrOS dans /Users/yusper/Downloads/SenagrOS/.

Lis ces fichiers de spec dans /Users/yusper/Downloads/SenagrOS/docs/ :
- 11_rebuild_plan.md, 16_decisions.md
- 02_features.md (Module 14 : Marketplace)
- 05_ui_spec.md (pages marketplace, produits)
- 12_appendix_sources_files.md (screenshots farmos-marketplace.png, farmos-mes-produits.png)

Phase 12 : Marketplace.

Actions :
1. Pages : /marketplace (vitrine acheteur), /produits (mes produits producteur)
2. Switcher Acheteur/Producteur dans Topbar
3. Publication produit depuis asset type "product" : nom, photo, prix/kg, quantite, localisation
4. Commandes : passer/recevoir, liste commandes
5. Design screenshots V2
6. Tests
7. Verifier : pnpm typecheck, pnpm lint, pnpm test, pnpm build

A la fin, mets a jour 11_rebuild_plan.md et 16_decisions.md. Projet COMPLET — recapitulatif final.
```

---

## Regles inter-sessions

1. **Ne jamais coder sans lire les specs** — les .md sont la source de verite
2. **Mettre a jour 11_rebuild_plan.md** — cocher les livrables completes
3. **Mettre a jour 16_decisions.md** — documenter toute decision non-triviale
4. **Mettre a jour 10_current_issues.md** — si probleme decouvert
5. **Ne pas modifier les specs sans raison** — si un changement est necessaire, le documenter dans 16_decisions.md d'abord
6. **Verification avant de quitter** — `pnpm typecheck && pnpm lint && pnpm test`

---

*Ce fichier est le mode d'emploi pour utiliser les prompts. A relire au debut de chaque session.*
