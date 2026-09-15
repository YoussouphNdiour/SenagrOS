# 06 - Decision Token

## Decisions techniques prises

### DT-001 : Next.js 15 App Router (pas Pages Router)
- **Date** : 2024
- **Raison** : Server Components pour performance, Server Actions pour mutations, streaming SSR
- **Alternative rejetee** : Pages Router (legacy), Remix, SvelteKit
- **Impact** : `'use client'` explicite, layout.tsx/loading.tsx/error.tsx par route

### DT-002 : tRPC v11 (pas REST classique)
- **Date** : 2024
- **Raison** : Type-safety end-to-end, pas de codegen, inference TypeScript native
- **Alternative rejetee** : REST + OpenAPI + codegen, GraphQL
- **Impact** : Pas d'API REST publique initialement (ajout possible via tRPC-openapi)

### DT-003 : Drizzle ORM (pas Prisma)
- **Date** : 2024
- **Raison** : SQL-first, leger, migrations SQL versionables, support PostGIS natif
- **Alternative rejetee** : Prisma (lourd, binary engine), TypeORM, Sequelize
- **Impact** : Migrations manuelles via `db:generate` + `db:migrate`, pas de `prisma migrate`

### DT-004 : PostgreSQL 16 + PostGIS (pas SQLite/MySQL)
- **Date** : 2024
- **Raison** : Geometries parcellaires (polygones, points GPS), JSONB natif, full-text search
- **Alternative rejetee** : SQLite (pas de PostGIS), MySQL (support spatial inferieur)
- **Impact** : Docker obligatoire pour le dev local

### DT-005 : JSONB polymorphique (pas tables par type)
- **Date** : 2024
- **Raison** : Un seul `assets` table avec `data JSONB` pour les champs specifiques au type, plutot que `lands`, `plants`, `animals` tables separees
- **Avantage** : Schema simple, queries generiques, extensible sans migration
- **Inconvenient** : Pas de contraintes SQL sur les champs JSONB, validation Zod cote app
- **Alternative rejetee** : Table par type (explosion du nombre de tables/routers)

### DT-006 : TailAdmin React (pas shadcn/ui)
- **Date** : 2024
- **Raison** : Design system complet avec dashboard, sidebar, KPI cards — adapte au FMIS
- **Alternative rejetee** : shadcn/ui (utilise dans la V1 Rails), Material UI, Ant Design
- **Impact** : Composants dans `components/ui/`, palette verte custom

### DT-007 : MapLibre (pas Leaflet ni Google Maps)
- **Date** : 2024
- **Raison** : Open-source, gratuit, vector tiles, performant, pas de cle API
- **Alternative rejetee** : Leaflet (utilise dans V1, raster-only), Google Maps (payant)
- **Impact** : Tiles OpenStreetMap ou Stadia, styles personnalisables

### DT-008 : Auth.js v5 (pas Clerk ni Supabase Auth)
- **Date** : 2024
- **Raison** : Self-hosted, pas de dependance SaaS, compatible Next.js App Router
- **Alternative rejetee** : Clerk (SaaS payant), Supabase Auth (couple a Supabase)
- **Impact** : Session JWT, middleware auth, callbacks personnalisables

### DT-009 : Intrants en 3 categories separees (feedback agronomes)
- **Date** : 2026-09-01
- **Raison** : Les agronomes distinguent clairement phyto/ferti/semences — interfaces et workflows differents
- **Alternative rejetee** : Un seul type "input" avec un champ categorie
- **Impact** : Router `inputRouter` avec methodes separees, UI avec 3 onglets

### DT-010 : Fiches d'observation generiques (pas hardcodees)
- **Date** : 2026-09-01
- **Raison** : Differentes fermes/organisations (SCL, GIE, entreprises) utilisent des fiches differentes. Structure JSONB `form_data` configurable
- **Alternative rejetee** : Tables relationnelles distinctes par type de fiche
- **Impact** : Table `observation_forms` avec `form_type` + `form_data JSONB`
- **Clarification** : Les observations utilisent une table `observation_forms` avec un champ `form_type` discriminant et un champ `data JSONB` pour les donnees specifiques. Les procedures tRPC sont typees par form_type (density, stage, pest, quality) mais le stockage reste JSONB. Le typage Zod cote application garantit la validation des donnees specifiques a chaque form_type

### DT-011 : Calendrier cultural par culture ET par parcelle
- **Date** : 2026-09-01
- **Raison** : Les templates de calendrier sont par culture/variete, mais chaque parcelle a ses dates reelles
- **Alternative rejetee** : Calendrier global unique
- **Impact** : 2 tables : `cultural_calendars` (templates) + `parcel_calendars` (instances)

### DT-012 : Assignation machine simple (pas tracking complet)
- **Date** : 2026-09-01
- **Raison** : Pour l'instant, les agronomes veulent juste savoir quelle machine est utilisee par quel employe pour quelle activite. Pas de tracking heures/carburant/maintenance detaillee
- **Alternative rejetee** : Module GMAO complet
- **Impact** : `equipment_ids` et `worker_ids` sur les logs, pas de table `machine_assignments` separee

### DT-013 : Offline-first PWA (pas app native)
- **Date** : 2024
- **Raison** : Pas de store, deploiement instantane, un seul codebase, ServiceWorker pour cache
- **Alternative rejetee** : React Native, Flutter
- **Impact** : `next-pwa`, cache-first pour les pages, queue de sync pour mutations

### DT-014 : Referentiel cultures dans des tables dediees (pas JSONB/taxonomies)
- **Date** : 2026-09-15
- **Raison** : Les cultures, familles et varietes ont des relations structurees (famille→culture→variete) et des attributs specifiques (cycle, saison, noms multilingues) qui justifient des tables relationnelles plutot que le pattern JSONB ou la table generique `taxonomies`
- **Alternative rejetee** : Stocker les cultures comme taxonomies generiques (pas assez structure pour les cycles, noms trilingues, rotation)
- **Impact** : 3 tables (crop_families, crops, crop_varieties) + router tRPC `cropRouter` avec 12 procedures

### DT-015 : Rotation culturale avec 4 niveaux de compatibilite
- **Date** : 2026-09-15
- **Raison** : Les agronomes distinguent 4 niveaux (recommande/neutre/a eviter/interdit) avec des regles specifiques au Senegal (ex: arachide→mil recommande, mil→mil a eviter)
- **Alternative rejetee** : Binaire (compatible/incompatible) — trop simpliste pour les preconisations agronomiques
- **Impact** : Table `crop_rotation_rules` avec enum `rotation_compatibility`, seed 9 regles senegalaises

### DT-016 : Saisons comme entites a part entiere (pas juste un enum sur la ferme)
- **Date** : 2026-09-15
- **Raison** : Chaque campagne a des dates debut/fin, un statut (planning→active→completed), un an, et est liee a une ferme specifique. Permet le suivi historique des campagnes
- **Alternative rejetee** : Simple champ `season_type` sur la ferme (pas de tracabilite par annee)
- **Impact** : Table `seasons` avec enum `season_type`

### DT-017 : Application intrant multi-produits (melange de cuve)
- **Date** : 2026-09-15
- **Raison** : Les agronomes appliquent souvent 2-3 produits en melange dans le meme passage. L'ancien schema ne gerait qu'un seul produit par log
- **Alternative rejetee** : Un log par produit (perd la tracabilite du melange de cuve)
- **Impact** : Schema `inputDataSchema` enrichi avec `products[]` array, `weatherConditionsSchema`, 4 cards dans LogCreateForm

### DT-018 : Reseau d'irrigation comme sous-objet JSONB dans l'asset parcelle
- **Date** : 2026-09-15
- **Raison** : Le reseau d'irrigation est un attribut de la parcelle (pas une entite autonome). 11 champs techniques (source, type, debit, pompe, filtration, fertigation, condition)
- **Alternative rejetee** : Table separee `irrigation_networks` (surcharge pour un attribut de parcelle)
- **Impact** : Sous-objet `irrigation_network` dans le JSONB `data` du type `land`

---

## Decisions a prendre (ouvertes)

### DT-OPEN-001 : Strategie de sync offline
> ⚠️ Bloquant pour Phase 9 (Offline/PWA) — impacte `fileRouter` et le mode PWA

Options :
- a) Queue simple (store mutations, replay au retour reseau)
- b) CRDT (Conflict-free Replicated Data Types)
- c) IndexedDB + sync periodique

### DT-OPEN-002 : Storage fichiers
> ⚠️ Bloquant pour Phase 9 (Offline/PWA) — impacte `fileRouter` et le mode PWA

Options :
- a) S3/MinIO (scalable)
- b) Local filesystem + Docker volume
- c) Supabase Storage

### DT-OPEN-003 : Notifications push
> ⚠️ Bloquant pour Phase 9 (Offline/PWA) — impacte le mode push et le ServiceWorker

Options :
- a) Web Push API (PWA native)
- b) SMS via API locale (Orange/Free Senegal)
- c) WhatsApp Business API

---

*Ce fichier trace toutes les decisions architecturales. Chaque session doit ajouter ses decisions ici avec date et raison.*
