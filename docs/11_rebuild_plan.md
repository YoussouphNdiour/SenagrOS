# 11 - Rebuild Plan

## Strategie
Recoder depuis zero en utilisant les prompts .md comme guide. Chaque phase produit un livrable testable. Le design TailAdmin de la V2 est reproduit.

---

## Phase 0 : Scaffolding (1 session)

### Livrables
- [ ] `npx create-next-app@latest senagros --typescript --tailwind --app --src-dir`
- [ ] Installer toutes les dependances (voir 01_project_overview.md)
- [ ] Configurer Biome, Vitest, Playwright
- [ ] Docker Compose (PostgreSQL 16 + PostGIS 3.4)
- [ ] Schema Drizzle complet (toutes les tables de 03_data_model.md)
- [ ] Migration initiale
- [ ] Seed de base (taxonomies, cultures senegalaises, ravageurs, stades)
- [ ] Auth.js v5 (login/register/logout)
- [ ] Layout principal (DashboardShell, Sidebar, Topbar, BottomNav)
- [ ] CLAUDE.md avec instructions projet
- [ ] Composants UI de base (Button, Card, Input, Select, Modal, DataTable, KpiCard)

### Validation
```bash
pnpm dev          # App demarre sans erreur
pnpm db:migrate   # Schema applique
pnpm test         # Tests de base passent
```

---

## Phase 1 : Assets & Parcelles (1-2 sessions)

### Livrables
- [ ] CRUD Assets complet (list, detail, create, edit, archive)
- [ ] Page parcelles avec KPI cards
- [ ] Page animaux avec KPI cards
- [ ] Page equipements (parc materiel)
- [ ] Formulaire creation parcelle (modal, avec tous les champs dont ecartements)
- [ ] Carte MapLibre avec parcelles (polygones)
- [ ] Filtres, recherche, pagination
- [ ] Tests unitaires composants
- [ ] Tests E2E : creation/edition/archivage d'un asset

### Validation agronomes
Montrer : creation d'une parcelle P-06 avec surface, culture, dates, ecartements

---

## Phase 2 : Logs & Semis enrichi (1-2 sessions)

### Livrables
- [x] CRUD Logs complet
- [x] Formulaire semis enrichi :
  - Type de semis (manuel/machine)
  - Selection machine (dropdown filtree)
  - Profondeur, ecartements, densite
- [x] Formulaire input avec selection phyto/ferti/semence
- [x] Assignation machine + employe sur chaque log
- [x] Quantities (mesures liees a un log)
- [x] Tests

### Validation agronomes
Montrer : creation d'un log de semis avec semoir selectionne et ecartements remplis

---

## Phase 3 : Intrants separes + Stock (1-2 sessions)

### Livrables
- [x] Page intrants avec 3 onglets (Phyto / Ferti / Semences)
- [x] Sous-categories configurables (herbicide, fongicide...)
- [x] CRUD intrant avec champs specifiques par categorie
- [x] Gestion de stock : entrees, sorties, niveau actuel
- [x] Alertes seuil minimum
- [x] Valorisation stock en FCFA
- [x] Tests

### Validation agronomes
Montrer : ajouter un insecticide, enregistrer une application sur une parcelle, voir le stock diminuer

---

## Phase 4 : Fiches d'observation terrain (2-3 sessions)

### Livrables
- [x] Formulaire Densite de levee (10 repetitions, calculs auto)
- [x] Formulaire Suivi stade cultural (dropdown stades, date atteinte)
- [x] Formulaire Maladies-Ravageurs (grille 10 cibles x N ravageurs, seuils)
- [x] Formulaire Agreage pre-recolte (longueurs, defauts, maturite)
- [x] Liste des observations avec filtres
- [x] Detail observation avec resultats calcules
- [ ] Impression / export PDF des fiches
- [x] Tests

### Validation agronomes
Montrer : remplir une fiche de densite comme la fiche papier SCL, voir les calculs automatiques

---

## Phase 5 : Calendrier cultural (1-2 sessions)

### Livrables
- [x] Templates de calendrier par culture/variete
- [x] Formulaire creation template (stades + durees)
- [x] Assignation template a une parcelle avec date de semis
- [x] Vue timeline (Gantt simplifie) avec stades passes/actuels/futurs
- [x] Alertes retard stade
- [x] Tests

### Validation agronomes
Montrer : creer un calendrier haricot vert, l'assigner a P-06, voir la timeline

---

## Phase 6 : Plans & Campagnes (1 session)

### Livrables
- [x] CRUD Plans
- [x] Association plan ↔ logs
- [x] Suivi progression
- [x] Tests

---

## Phase 7 : Rapports & Dashboard (1-2 sessions)

### Livrables
- [x] Dashboard principal avec KPI cards (patrimoine, benefice net), meteo Open-Meteo, alertes, modules rapides, taches recentes
- [x] Graphiques Recharts : RevenueExpenseChart (BarChart mensuel), AssetDistributionChart (PieChart), LogActivityChart (BarChart horizontal), HarvestComparisonChart (BarChart dual-axis)
- [x] Report router tRPC : dashboard, assets, logs, harvests, financials (stub Phase 8)
- [x] Pages rapports : /reports (overview + KPI + charts), /reports/assets (PieChart + table), /reports/logs (timeline + table), /reports/harvests (rendements par culture)
- [x] Export Excel (xlsx/SheetJS) + PDF (html2canvas + jsPDF)
- [x] Widget meteo Open-Meteo (Dakar, cache localStorage 30min)
- [x] Tests validateurs rapport (vitest)

---

## Phase 8 : Finances (1-2 sessions)

### Livrables
- [x] Ventes, Achats, Facturation
- [x] Comptabilite simplifiee
- [x] Tresorerie
- [x] Tests

---

## Phase 9 : Offline / PWA (1 session)

### Livrables
- [ ] ServiceWorker avec cache-first
- [ ] Queue de sync mutations offline (IndexedDB)
- [ ] OfflineBanner
- [ ] Page `/offline`
- [ ] Manifest PWA (install prompt)
- [ ] Tests offline

---

## Phase 10 : i18n & Polish (1 session)

### Livrables
- [ ] Traductions completes FR/EN/WO
- [ ] Responsive mobile (BottomNav, formulaires plein ecran)
- [ ] Recherche globale
- [ ] Notifications in-app
- [ ] Quick actions
- [ ] Tests E2E complets

---

## Phase 11 : Cooperatives & Multi-fermes (P1)

### Livrables
- [ ] CRUD Cooperatives
- [ ] Invitations par token
- [ ] Dashboard agregatif
- [ ] Tests

---

## Phase 12 : Marketplace (P2)

### Livrables
- [ ] Vitrine produits
- [ ] Mode acheteur/producteur
- [ ] Commandes

---

## Ordre d'execution des prompts par phase

| Phase | Docs a lire avant de coder |
|-------|---------------------------|
| 0 | 01, 03, 09 |
| 1 | 02 (Module 3), 03 (assets), 04 (assetRouter), 05 (pages assets) |
| 2 | 02 (Module 4), 03 (logs), 04 (logRouter), 05 (pages logs) |
| 3 | 02 (Module 5), 03 (material), 04 (inputRouter), 05 (pages intrants) |
| 4 | 02 (Module 6), 03 (observation_forms), 04 (observationRouter), 05 (formulaires observation) |
| 5 | 02 (Module 7), 03 (calendars), 04 (calendarRouter), 05 (timeline) |
| 6-12 | Sections correspondantes |

---

*Ce fichier est le plan de reconstruction. Cocher les livrables au fur et a mesure.*
