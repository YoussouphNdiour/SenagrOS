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

---

## Decisions a prendre (ouvertes)

### DT-OPEN-001 : Strategie de sync offline
Options :
- a) Queue simple (store mutations, replay au retour reseau)
- b) CRDT (Conflict-free Replicated Data Types)
- c) IndexedDB + sync periodique

### DT-OPEN-002 : Storage fichiers
Options :
- a) S3/MinIO (scalable)
- b) Local filesystem + Docker volume
- c) Supabase Storage

### DT-OPEN-003 : Notifications push
Options :
- a) Web Push API (PWA native)
- b) SMS via API locale (Orange/Free Senegal)
- c) WhatsApp Business API

---

*Ce fichier trace toutes les decisions architecturales. Chaque session doit ajouter ses decisions ici avec date et raison.*
