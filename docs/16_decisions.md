# 16 - Decisions Log

## Format
Chaque session ajoute ses decisions ici. Ne pas supprimer les entrees precedentes.

```markdown
### SESSION-XXX — YYYY-MM-DD — Phase X

**Decisions prises :**
1. [Decision] — [Raison]

**Problemes rencontres :**
1. [Probleme] — [Resolution ou statut]

**Livrables completes :**
1. [Livrable]

**Prochaines etapes :**
1. [Tache]
```

---

## SESSION-001 — 2026-09-01 — Phase Preparation

**Decisions prises :**
1. Recoder depuis zero avec prompts .md — Les agronomes ont donne du feedback significatif (semis enrichi, intrants separes, calendrier cultural, fiches observation, parc materiel) qui necessite une refonte structurelle plutot qu'un patch de la V2
2. Module Odoo (tsc_deposit_invoice) exclu du rebuild — Projet ERP separe
3. Fiches d'observation generalistes — Pas specifiques a SCL, configurables pour toute ferme
4. Intrants avec sous-categories et stock — Herbicide/fongicide/insecticide pour phyto, mineral/organique pour ferti, certifiee/paysanne pour semences
5. Machines : assignation simple uniquement — Pas de tracking heures/carburant pour l'instant
6. Calendrier cultural double : par culture/variete + par parcelle — Templates + instances
7. Design TailAdmin de la V2 Next.js comme reference — Pas le design Ekylibre/Rails
8. Langues FR/EN/WO suffisent
9. Mode offline prioritaire
10. Moi seul avec Claude Code — Pas d'equipe
11. Agronomes disponibles pour validation maquettes a chaque phase

**Problemes rencontres :**
- Aucun (session de preparation)

**Livrables completes :**
1. 16 fichiers .md de specification dans /SenagrOS/docs/

**Prochaines etapes :**
1. Demarrer Phase 0 : Scaffolding (creer le projet Next.js, schema Drizzle, auth, layout)

---

## SESSION-002 — (non documentee — Phase 0/1 scaffold initial)

---

## SESSION-003 — 2026-09-02 — Phase 2 : Logs & Semis enrichi

**Decisions prises :**
1. Zod schemas par type de log dans un seul fichier `log.validator.ts` — Coherent avec le pattern `asset.validator.ts`
2. `seedingDataSchema` avec `.refine()` pour valider `machine_id` obligatoire quand `sowing_type === 'machine'` — Securise la logique metier cote client et serveur
3. `ComboboxAsync` et `ComboboxAsyncMulti` comme composants UI generiques — Reutilisables pour toutes les selections async (machines, semences, parcelles, employes)
4. `z.input<>` au lieu de `z.infer<>` pour les types de formulaire React Hook Form — Resout l'incompatibilite de types quand un champ Zod a `.default()`
5. farmId toujours depuis `ctx.session.user.farmId` (jamais en input client) — Pattern d'isolation ferme identique a `assetRouter`
6. Assignation materiel/personnel comme JSONB arrays (`equipmentIds`, `workerIds`) plutot que tables de jointure — Simplicite, suffisant pour le tracking simple sans heures/carburant
7. Biome config migre de v1 `ignore` vers v2 `includes` — Config v2 requise par Biome 2.x

**Problemes rencontres :**
1. TypeScript resolver mismatch avec React Hook Form + Zod `.default()` — Resolu avec `z.input<>` au lieu de `z.infer<>`
2. Biome config `ignore` deprecie dans v2 — Resolu avec `biome migrate --write`

**Livrables completes :**
1. `src/lib/validators/log.validator.ts` — 12 schemas par type + seeding enrichi + quantities + CRUD schemas
2. `src/server/routers/log.ts` — logRouter (list, getById, create, update, delete, complete)
3. `src/server/routers/quantity.ts` — quantityRouter (listByLog, create, update, delete)
4. `src/components/ui/ComboboxAsync.tsx` — ComboboxAsync + ComboboxAsyncMulti
5. `src/components/logs/LogCreateForm.tsx` — Formulaire creation avec sections type-specifiques, semis enrichi, assignation materiel/personnel, quantities repeatable
6. `src/components/logs/LogListClient.tsx` — Liste avec filtres (type, statut, dates, recherche), pagination
7. `src/components/logs/LogKpis.tsx` — 4 KPI cards
8. `src/components/logs/LogDetailClient.tsx` — Detail avec assets, quantities, JSONB data
9. `src/components/logs/LogEditClient.tsx` — Edition avec pre-remplissage
10. 14 pages dans `src/app/(dashboard)/logs/` — liste, 10 pages par type, new, [id], [id]/edit
11. Sidebar mise a jour avec liens Production → Journal, Semis, Observations, Recoltes, Intrants, Irrigation
12. Tests unitaires Zod (20 tests) + E2E Playwright (6 scenarios semis machine)

**Prochaines etapes :**
1. Demarrer Phase 3 : Intrants separes + Stock (3 onglets phyto/ferti/semence, gestion stock)

---

## SESSION-004 — 2026-09-02 — Phase 3 : Intrants separes + Stock

**Decisions prises :**
1. `inputRouter` separe de `assetRouter` — Les intrants ont une logique metier specifique (stock, sous-categories, application sur log) qui justifie un router dedie plutot que de surcharger assetRouter
2. `inventoryRouter` avec procedure `kpis` aggregee — Evite 4 requetes separees pour les KPI cards (total, valorisation, alertes, repartition)
3. Stock comme ledger append-only dans table `inventory` — Positif = entree, negatif = sortie, SUM = stock actuel. Pattern immutable sans colonne `current_stock` a synchroniser
4. Seuil d'alerte et prix unitaire dans `assets.data` JSONB (`stock_threshold`, `unit_price_xof`, `stock_unit`) — Pas de nouvelles colonnes, coherent avec le pattern JSONB existant
5. `createInputSchema` comme discriminated union Zod sur `inputCategory` — Champs requis differents par categorie (phyto: commercialName, ferti: commercialName, semence: cropType)
6. 3 hooks tRPC appeles inconditionnellement avec `enabled` flag — Evite la violation des regles de hooks React, seul le hook actif fait la requete
7. Pages /intrants/phyto, /intrants/ferti, /intrants/semences comme routes separees — Chaque onglet est un Server Component independant avec son propre URL bookmarkable
8. `input.applyToLog` verifie stock suffisant avant decrement — Erreur explicite "Stock insuffisant" avec quantites affichees

**Problemes rencontres :**
1. Biome lint `useHookAtTopLevel` sur hooks tRPC conditionnels — Resolu en appelant les 3 hooks avec `enabled` flag
2. Lint pre-existant sur `error.tsx` (shadow `Error`, unused `error` param) — Meme pattern que `logs/error.tsx`, requis par Next.js App Router

**Livrables completes :**
1. `src/lib/validators/input.validator.ts` — Schemas Zod pour 3 categories, sous-categories, CRUD, stock, labels
2. `src/server/routers/input.ts` — inputRouter (listPhyto, listFerti, listSemence, create, update, getStock, applyToLog)
3. `src/server/routers/inventory.ts` — inventoryRouter (list, getByAsset, adjust, alerts, kpis)
4. `src/components/intrants/IntrantsKpis.tsx` — 4 KPI cards (total, valorisation FCFA, alertes, repartition)
5. `src/components/intrants/IntrantListClient.tsx` — Liste avec filtres sous-categorie, recherche, pagination
6. `src/components/intrants/IntrantDetailClient.tsx` — Detail produit + stock actuel + historique mouvements + modal entree/sortie
7. `src/components/intrants/IntrantCreateForm.tsx` — Formulaire 4 etapes (categorie, sous-cat, champs specifiques, stock/prix)
8. 8 pages dans `src/app/(dashboard)/intrants/` — overview, phyto, ferti, semences, [id], new, loading, error
9. Sidebar mise a jour : Intrants pointe vers `/intrants` (plus `/logs/input`)
10. `src/lib/validators/input.validator.test.ts` — 17 tests unitaires (schemas, scenario Decis Expert 10L-1.15L=8.85L)
11. Routers enregistres dans `_app.ts` (input + inventory)

**Prochaines etapes :**
1. Demarrer Phase 4 : Fiches d'observation terrain (densite levee, stades, maladies-ravageurs, agreage)

---

## SESSION-005 — 2026-09-03 — Phase 4 : Fiches d'observation terrain

**Decisions prises :**
1. `observationRouter` dedie avec table `observation_forms` — Chaque observation est un log parent (type='observation') + une ligne observation_forms avec JSONB `form_data` et `calculated`
2. 4 mutations separees (`createDensity`, `createStage`, `createPestDisease`, `createGrading`) plutot qu'une seule polymorphe — Chaque type a un schema Zod distinct avec validation specifique
3. `listParcels` dans observationRouter — Evite de passer `farmId` en input client, le recupere depuis `ctx.session.user.farmId` comme tous les autres routers
4. Fonctions de calcul partagees dans `observation.validator.ts` (`calculateDensity`, `calculatePestTotals`, `calculateGradingTotals`) — Meme logique cote formulaire (useMemo temps reel) et cote serveur (stockage dans `calculated`)
5. Formule densite : `totalPlants / (numReps × sampleAreaM2) × 10000` — Conforme aux fiches SCL papier
6. Formule pest : `pctInfested = total / numTargets × 100`, alerte si `pct > seuil (defaut 5%)` — Seuil configurable par observation
7. Grille pest en 2 sections (Ravageurs / Maladies) avec targets redimensionnables — `handleNumTargetsChange` resize les arrays existants sans perdre les donnees saisies
8. `ObservationData` interface locale dans DetailClient avec cast `as unknown as` — Contourne le typing `unknown` des colonnes JSONB Drizzle dans React 19 + TS 5.9
9. `Boolean(formData.xxx)` au lieu de `formData.xxx &&` dans JSX — TS 5.9 + React 19 types: `unknown && ReactElement` evalue a `unknown` qui n'est pas `ReactNode`

**Problemes rencontres :**
1. `trpc.asset.list` requiert `farmId` en input — Resolu en ajoutant `listParcels` dans observationRouter qui recupere farmId depuis session
2. `Object.keys(defectTypeLabels)` retourne `string[]` mais mutation attend union literale — Resolu avec array explicite typee `DefectType[]`
3. `unknown` not assignable to `ReactNode` (TS 5.9 + React 19) sur colonnes JSONB — Resolu avec interface locale + cast et `Boolean()` wrapping
4. `replace_all` accidentel creant variable auto-referentielle — Resolu en restaurant `data.` prefix

**Livrables completes :**
1. `src/lib/validators/observation.validator.ts` — Schemas Zod 4 types + calculs partages + listes ravageurs/maladies defaut
2. `src/server/routers/observation.ts` — observationRouter (list, listParcels, kpis, getById, createDensity, createStage, createPestDisease, createGrading, update, delete)
3. `src/components/observations/DensityForm.tsx` — Comptage 2 colonnes (10 reps), calculs auto temps reel
4. `src/components/observations/StageForm.tsx` — 22 stades culturaux (cereales + maraichage)
5. `src/components/observations/PestDiseaseForm.tsx` — Grille ravageurs×cibles avec alertes rouge/vert
6. `src/components/observations/GradingForm.tsx` — Longueurs, defauts majeurs, indice maturite
7. `src/components/observations/ObservationListClient.tsx` — DataTable filtres (type, dates), pagination, badges couleur
8. `src/components/observations/ObservationKpis.tsx` — 4 KPI cards
9. `src/components/observations/ObservationDetailClient.tsx` — Detail + resultats calcules + grille brute
10. 8 pages dans `src/app/(dashboard)/observations/` — liste, 4 formulaires new, detail [id], loading, error
11. Sidebar mise a jour : Observations → `/observations`
12. Router enregistre dans `_app.ts`

**Prochaines etapes :**
1. Export PDF des fiches d'observation
2. E2E tests avec donnees SCL (Rep 1=120, Rep 2=84, ... → total=789)
3. Demarrer Phase 5 : Calendrier cultural

---

## SESSION-006 — 2026-09-03 — Phase 5 : Calendrier cultural

**Decisions prises :**
1. `calendarRouter` dedie avec tables `cultural_calendars` + `parcel_calendars` — Templates (modeles) separes des instances (parcelle+date semis), conformement au spec 03_data_model.md
2. `calculateExpectedDates()` dans le validator (partage client/serveur) — Preview des dates dans le formulaire d'assignation avant soumission + calcul cote serveur lors de la creation
3. `defaultStagesByCrop` avec 4 cultures pre-remplies (haricot_vert, oignon, tomate, riz) — Pre-remplissage automatique des stades quand on selectionne une culture dans le formulaire template
4. Vue Timeline Gantt custom en CSS (sans lib externe) — Barres horizontales + jalons colores (vert=a temps, orange=retard, bleu=en cours, gris=a venir), suffisant pour le MVP
5. Popup au clic sur un jalon avec formulaire inline "Marquer comme termine" — Permet de mettre a jour `actual_date` directement depuis la timeline
6. `updateStageStatus` avance automatiquement le stade suivant en "in_progress" — Quand un stade est marque "completed", le suivant passe de "pending" a "in_progress"
7. `parcelCalendar.status` passe a "completed" quand tous les stades sont done/skipped — Gestion automatique du cycle de vie
8. Sidebar href corrige `/dashboard/calendrier` → `/calendrier` — Coherent avec les autres routes (/observations, /intrants)
9. `Link` au lieu de `div[role=button]` pour la navigation dans TemplateListClient — Conformite a11y Biome

**Problemes rencontres :**
1. Import `Button` manquant dans TimelineClient.tsx — Resolu en ajoutant l'import
2. Fonction `getStageTooltipColor` inutilisee + variable `endDate` inutilisee + `daysInMonth` inutilisee — Resolu en supprimant le code mort
3. Non-null assertion `or(...)!` refuse par Biome — Resolu avec condition `if (searchCondition)`
4. Erreurs TypeScript pre-existantes dans IntrantListClient.tsx (`.subcategory` sur union type) — Non liees a Phase 5, ignorees

**Livrables completes :**
1. `src/lib/validators/calendar.validator.ts` — Schemas Zod (template, assign, update, timeline) + helpers calcul dates + stades par defaut 4 cultures + labels
2. `src/server/routers/calendar.ts` — calendarRouter (listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, listParcelCalendars, assignToParcel, updateStageStatus, getTimeline, kpis, listParcels)
3. `src/components/calendrier/CalendrierKpis.tsx` — 4 KPI cards (modeles, assignees, actifs, termines)
4. `src/components/calendrier/TemplateListClient.tsx` — Liste avec recherche, badges culture/duree/stades, suppression
5. `src/components/calendrier/TemplateCreateForm.tsx` — Formulaire creation avec tableau de stades dynamique, pre-remplissage par culture, duree auto
6. `src/components/calendrier/AssignCalendarForm.tsx` — Formulaire assignation avec preview des dates calculees
7. `src/components/calendrier/TimelineClient.tsx` — Vue Gantt simplifie avec barres+jalons, popup detail, formulaire mise a jour stade, filtres culture/statut
8. 6 pages dans `src/app/(dashboard)/calendrier/` — timeline, templates, templates/new, assign, loading, error
9. Sidebar mise a jour : Calendrier → `/calendrier`
10. Router enregistre dans `_app.ts`
11. `src/lib/validators/calendar.validator.test.ts` — 14 tests unitaires (schemas, calculateExpectedDates haricot vert 7 stades semis 14/03, calculateTotalDays)
12. `e2e/calendar.spec.ts` — 6 scenarios E2E (navigation, creation template, assignation)

**Prochaines etapes :**
1. Lien observation "Suivi stade cultural" → mise a jour automatique du parcel_calendar
2. Widget dashboard "Stades en retard" (Phase 7)
3. Notifications in-app pour stades prevus/en retard (Phase 10)
4. Demarrer Phase 6 : Plans & Campagnes

---

## SESSION-007 — 2026-09-03 — Phase 6 : Plans & Campagnes

**Decisions prises :**
1. `planRouter` dedie avec tables `plans` + `plan_logs` — CRUD complet + association N:N plan↔logs, conformement au spec 03_data_model.md et 04_api_spec.md
2. `ensureFarmId()` copie dans chaque router (pas de helper partage) — Coherent avec le pattern existant dans calendarRouter, observationRouter, etc.
3. `ComboboxAsync` pour recherche de logs dans le detail plan — Reutilise le composant generique existant, recherche via `trpc.log.list` avec filtrage des logs deja associes
4. Progression comme ratio done/total en temps reel — Pas de colonne `progress` stockee, calcul cote client depuis les logs associes au plan
5. `useState` simple pour les formulaires create/edit (pas de react-hook-form) — Formulaires simples (6 champs), react-hook-form serait surdimensionne ici. Coherent avec TemplateCreateForm du calendrier
6. `trpc.useUtils()` pour invalidation cache apres mutation — Pattern plus propre que `router.refresh()`, invalide `plan.list`, `plan.kpis`, `plan.getById` selon le contexte
7. Sidebar : "Plans" ajoute dans la section Production apres "Calendrier" — Placement logique car les plans organisent les activites de production

**Problemes rencontres :**
1. Biome lint `noLabelWithoutControl` sur textarea sans htmlFor — Resolu en ajoutant `htmlFor` + `id` sur label/textarea
2. UUIDs de test invalides (format v1 `11111111-...` rejete par Zod v4 UUID) — Resolu en utilisant des UUIDs v4 valides dans les tests
3. Erreurs TypeScript pre-existantes dans IntrantListClient.tsx (`.subcategory` sur union type) — Non liees a Phase 6, identique a SESSION-006

**Livrables completes :**
1. `src/lib/validators/plan.validator.ts` — Schemas Zod (create, update, list, planId, planLog) + enums + labels (types, statuts, saisons)
2. `src/server/routers/plan.ts` — planRouter (list, getById, kpis, create, update, delete, addLog, removeLog)
3. `src/components/plans/PlanKpis.tsx` — 4 KPI cards (total, actifs, termines, annules)
4. `src/components/plans/PlanListClient.tsx` — Liste avec filtres (type, statut, recherche), pagination, suppression
5. `src/components/plans/PlanCreateForm.tsx` — Formulaire creation (nom, type, saison, dates, notes)
6. `src/components/plans/PlanDetailClient.tsx` — Detail avec infos plan, barre de progression, logs associes, bouton "Ajouter un log" avec ComboboxAsync
7. `src/components/plans/PlanEditClient.tsx` — Edition avec pre-remplissage des champs
8. 6 pages dans `src/app/(dashboard)/plans/` — liste, new, [id], [id]/edit, loading, error
9. Sidebar mise a jour : Plans → `/plans` dans section Production
10. Router enregistre dans `_app.ts`
11. `src/lib/validators/plan.validator.test.ts` — 23 tests unitaires (schemas, enums, labels, scenario Campagne Hivernage 2026 avec 3 logs et progression 67%)
12. `e2e/plans.spec.ts` — 6 scenarios E2E (navigation, creation, KPIs, detail progression, edition)

**Prochaines etapes :**
1. Demarrer Phase 7 : Rapports & Dashboard (KPI cards, graphiques Recharts, export)

---

## SESSION-008 — 2026-09-03 — Phase 7 : Rapports & Dashboard

**Decisions prises :**
1. `reportRouter` avec 5 procedures query (dashboard, assets, logs, harvests, financials) — Toutes en lecture seule, agregation des tables existantes sans nouvelle table
2. `report.financials` comme stub retournant des arrays vides — Module Finances prevu en Phase 8, le router est pret mais renvoie un message informatif
3. Revenue/depenses calcules depuis `quantities.unit = 'XOF'` sur logs harvest/input — Pas de table financiere dediee, les montants FCFA sont deja stockes comme quantities
4. Widget meteo Open-Meteo API (gratuit, sans cle) avec cache localStorage 30min — Coordonnees Dakar (14.69, -17.44), fallback sur cache expire en cas d'erreur reseau
5. Export Excel via `xlsx` (SheetJS) cote client + Export PDF via `html2canvas` + `jsPDF` — Plus simple que `@react-pdf/renderer` pour capturer des graphiques Recharts existants
6. 4 composants Recharts dedies (`RevenueExpenseChart`, `AssetDistributionChart`, `LogActivityChart`, `HarvestComparisonChart`) — Un composant par visualisation, reutilisables entre dashboard et pages rapport
7. `ExportBar` composant partage pour les 2 boutons export — Reutilise sur toutes les pages rapport avec `data` + `filename` + `pdfElementId`
8. KPI gradient cards sur le dashboard (vert fonce → vert clair) — Reproduit le design farmos-dashboard.png avec les degrades CSS `from-[#2E7D32] to-[#43A047]`
9. Alertes dashboard en 3 categories (stock bas, stades retard, taches pending) — Aggrege inventory < 10, parcel_calendars actifs, logs status='pending'
10. `getFarmId()` helper local dans report.ts — Meme pattern que les autres routers, extrait farmId depuis session

**Problemes rencontres :**
1. Recharts `Tooltip formatter` type incompatible avec `(v: number)` — Resolu en utilisant `(v) => formatFCFA(Number(v))`
2. Erreurs TypeScript pre-existantes dans IntrantListClient.tsx — Non liees a Phase 7, identique aux sessions precedentes

**Livrables completes :**
1. `src/lib/validators/report.validator.ts` — Schemas Zod (dashboardInput, reportFilter, harvestReport, financialsReport)
2. `src/server/routers/report.ts` — reportRouter (dashboard, assets, logs, harvests, financials)
3. `src/components/charts/RevenueExpenseChart.tsx` — BarChart groupe mensuel revenus/depenses en FCFA
4. `src/components/charts/AssetDistributionChart.tsx` — PieChart repartition patrimoine par type
5. `src/components/charts/LogActivityChart.tsx` — BarChart horizontal activite par type de log
6. `src/components/charts/HarvestComparisonChart.tsx` — BarChart dual-axis rendement kg + valeur FCFA
7. `src/components/charts/WeatherWidget.tsx` — Widget meteo Open-Meteo avec icones, cache localStorage
8. `src/components/charts/ExportBar.tsx` — Boutons export Excel + PDF reutilisables
9. `src/lib/utils/export.ts` — Fonctions exportToExcel (xlsx) et exportToPdf (html2canvas + jsPDF)
10. `src/app/(dashboard)/dashboard/page.tsx` — Dashboard principal complet (KPI gradient, chart, meteo, alertes, modules, taches recentes)
11. `src/app/(dashboard)/reports/page.tsx` — Vue d'ensemble rapports (KPI, charts, filtres dates, liens)
12. `src/app/(dashboard)/reports/assets/page.tsx` — Rapport patrimoine (PieChart, filtres type/date, table)
13. `src/app/(dashboard)/reports/logs/page.tsx` — Rapport activites (BarChart, filtres type/date, timeline table)
14. `src/app/(dashboard)/reports/harvests/page.tsx` — Rapport recoltes (BarChart dual-axis, table par culture)
15. loading.tsx + error.tsx pour /reports et 3 sous-routes
16. `src/lib/validators/report.validator.test.ts` — 10 tests unitaires (schemas, scenario hivernage 2026)
17. Router enregistre dans `_app.ts`

**Prochaines etapes :**
1. Demarrer Phase 8 : Finances (ventes, achats, factures, comptabilite simplifiee, tresorerie)

---

## SESSION-009 — 2026-09-03 — Phase 8 : Finances

**Decisions prises :**
1. `financeRouter` unique avec 3 domaines (transactions, invoices, journalEntries) — Un seul router plutot que 3 separes car les domaines sont fortement couples (une facture payee cree une transaction + ecriture comptable)
2. Schema Drizzle : 3 tables (`transactions`, `invoices`, `journal_entries`) — Tables dediees plutot que JSONB dans logs car les finances ont une logique metier distincte (montants, devises, statuts de paiement)
3. Auto-creation d'ecritures comptables sur chaque transaction/paiement facture — Pattern journal automatique : chaque `createTransaction`, `createSale`, `updateInvoice(paid)` cree une ligne dans `journal_entries` avec debit/credit
4. `createSale` comme shortcut de `createTransaction(type=sale)` — Calcul auto du montant total (quantity × unitPrice), description auto "Vente {productName}"
5. `generateInvoiceNumber` avec prefix par type (DEV/PF/FAC) + annee + sequence — Numerotation automatique incrementale par ferme et par type
6. KPI cards reproduisent le design V2 : 4 cards pour Ventes (CA mois, Marge, Clients, CA total), 4 pour Finances (Solde, Revenus, Depenses, Pertes), 3 pour Facturation (Devis, Pro forma, Factures)
7. Sidebar section "Ventes & Finances" ajoutee entre Production et Gestion — 4 liens (Ventes, Finances, Facturation, Comptabilite) avec icones ShoppingCart, Wallet, Receipt, BookOpen
8. Comptabilite avec "Compte de resultat" section en bas — Affiche Total Charges (debit), Total Produits (credit), et Benefice net/Perte nette colore (vert/rouge)
9. Montants decimaux stockes comme `decimal(15,2)` dans les tables — Precision financiere, conversion `String()` pour insertion et `Number()` pour affichage
10. `paymentMethod` enum (cash, bank, mobile_money) — Adapte au contexte senegalais (Orange Money, Wave)

**Problemes rencontres :**
1. Agent FacturationKpis utilisait `devisCount` au lieu de `devis` (nom retourne par le router) — Resolu en corrigeant les noms de proprietes
2. Agent InvoiceListClient castait `data.items` comme `InvoiceRow[]` mais Drizzle retourne `Date` pour `issueDate` et `string` pour `totalAmount` — Resolu avec `as unknown as InvoiceRow[]` et types `Date | string` / `string | number`
3. Biome lint `noArrayIndexKey` sur InvoiceCreateForm items — Resolu en ajoutant un `_id` unique a chaque ItemRow avec compteur incremental
4. Import `Input` inutilise dans FinanceListClient — Resolu en supprimant l'import
5. Import `integer` inutilise dans schema/finance.ts — Resolu en supprimant l'import
6. Erreurs TypeScript pre-existantes dans IntrantListClient.tsx — Non liees a Phase 8, identiques aux sessions precedentes

**Livrables completes :**
1. `src/server/db/schema/finance.ts` — 3 tables Drizzle (transactions, invoices, journal_entries) + relations + index
2. `src/lib/validators/finance.validator.ts` — Schemas Zod (createTransaction, createSale, createInvoice, updateTransaction, updateInvoice, listTransactions, listInvoices, listJournal) + enums + labels + helpers (formatFCFA, generateInvoiceNumber)
3. `src/server/routers/finance.ts` — financeRouter (listTransactions, listSales, createTransaction, createSale, updateTransaction, deleteTransaction, salesKpis, financeKpis, listInvoices, createInvoice, updateInvoice, deleteInvoice, invoiceKpis, listJournal)
4. `src/components/finances/VentesKpis.tsx` — 4 KPI cards (CA mois, Marge Brute, Clients, CA Total)
5. `src/components/finances/VenteListClient.tsx` — DataTable ventes avec recherche, pagination, suppression
6. `src/components/finances/VenteCreateForm.tsx` — Formulaire nouvelle vente (produit, quantite, prix, client, paiement)
7. `src/components/finances/FinancesKpis.tsx` — 4 KPI cards (Solde Net, Revenus, Depenses, Pertes)
8. `src/components/finances/FinanceListClient.tsx` — Journal transactions avec filtres type/categorie, badges colores, pagination
9. `src/components/finances/FacturationKpis.tsx` — 3 KPI cards (Devis, Pro Forma, Factures)
10. `src/components/finances/InvoiceListClient.tsx` — Liste factures avec onglets type, badges statut, actions payer/supprimer
11. `src/components/finances/InvoiceCreateForm.tsx` — Formulaire creation document (type, client, articles dynamiques, taxes, total auto)
12. `src/components/finances/ComptabiliteClient.tsx` — Journal comptable avec filtres, KPI debit/credit/solde, compte de resultat
13. 4 pages dans `src/app/(dashboard)/ventes/` — liste, new, loading, error
14. 3 pages dans `src/app/(dashboard)/finances/` — liste, loading, error
15. 4 pages dans `src/app/(dashboard)/facturation/` — liste, new, loading, error
16. 3 pages dans `src/app/(dashboard)/comptabilite/` — liste, loading, error
17. Sidebar mise a jour : section "Ventes & Finances" avec 4 liens
18. Router enregistre dans `_app.ts`
19. `src/lib/validators/finance.validator.test.ts` — 20 tests unitaires (enums, labels, schemas, formatFCFA, generateInvoiceNumber, scenario Hivernage 2026 vente+facture+achat)

**Prochaines etapes :**
1. Demarrer Phase 9 : Offline / PWA (ServiceWorker, sync offline, manifest)

---

*Ajouter une entree ci-dessus a chaque session. Ne jamais supprimer.*
