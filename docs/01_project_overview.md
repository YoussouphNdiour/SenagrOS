# 01 - Project Overview

## Nom du projet
**SenagrOS** — Senegal Agriculture Operating System

## Vision
Systeme de gestion agricole (FMIS) open-source, generique et extensible, concu pour les exploitations agricoles d'Afrique de l'Ouest. SenagrOS digitalise l'ensemble du cycle de production : parcelles, cultures, intrants (phyto/ferti/semences), calendrier cultural, observations terrain, recoltes, stocks, finances, et parc materiel.

## Probleme resolu
Les agriculteurs et agronomes senegalais utilisent des fiches papier (type SCL/E@syFerme) pour :
- Compter la densite de levee (10 repetitions par parcelle)
- Suivre les stades culturaux (levee, floraison, maturite...)
- Observer les maladies et ravageurs (grille 10 cibles x 20+ ravageurs)
- Agreer la qualite pre-recolte (longueurs, defauts, maturite)

Ces fiches sont ensuite ressaisies manuellement. SenagrOS les remplace par des formulaires mobiles offline-first avec calculs automatiques.

## Cibles utilisateurs

| Role | Description |
|------|-------------|
| **Proprietaire** | Gere la ferme, les finances, les parametres |
| **Chef de ferme / Manager** | Planifie les cultures, assigne les taches, valide les observations |
| **Technicien agronome** | Remplit les fiches d'observation terrain (densite, ravageurs, stades) |
| **Ouvrier agricole** | Execute les taches assignees, enregistre les activites |
| **Acheteur** | Consulte les produits disponibles, passe des commandes |

## Contexte geographique
- **Pays principal** : Senegal (extensible Afrique de l'Ouest)
- **Monnaie** : XOF (FCFA)
- **Langues** : Francais (defaut), English, Wolof
- **Fuseau** : Africa/Dakar (UTC+0)
- **Saisons** : Hivernage (juin-octobre), Contre-saison chaude (mars-juin), Contre-saison froide (novembre-fevrier)
- **Cultures typiques** : mil, sorgho, arachide, niebe, riz, mais doux, haricot vert, oignon, tomate, gombo

## Origine
Fork conceptuel de farmOS (Drupal) et Ekylibre (Rails). V2 recodee en Next.js 15 full-stack TypeScript. Le rebuild actuel (V3) repart du code V2 en integrant le feedback terrain des agronomes de SCL (Societe de Cultures Legumieres) et d'entrepreneurs agronomes.

## Principes fondateurs

1. **Offline-first** : PWA avec ServiceWorker, sync quand reseau disponible
2. **Mobile-first** : Concu pour smartphones sur le terrain (BottomNav, formulaires tactiles)
3. **Generaliste** : Pas specifique a un type de culture — adaptable via taxonomies configurables
4. **Fiches d'observation standardisees** : Densite de levee, suivi stade cultural, maladies-ravageurs, agreage pre-recolte
5. **Intrants separes** : Phytosanitaire / Fertilisation / Semences — chacun avec sous-categories et gestion de stock
6. **Parc materiel** : Tracteurs, semoirs, pulverisateurs... assignes par activite a un employe
7. **Design TailAdmin** : Palette verte, KPI cards colorees, sidebar gauche, formulaires modaux

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router, Server Components + Server Actions) |
| API | tRPC v11 (type-safe end-to-end) |
| ORM | Drizzle ORM (type-safe SQL) |
| Base de donnees | PostgreSQL 16 + PostGIS 3.4 |
| Auth | Auth.js v5 (NextAuth) |
| Cartes | MapLibre GL JS |
| UI | TailAdmin React + Tailwind v4 |
| Graphiques | Recharts |
| i18n | next-intl (FR/EN/WO) |
| Validation | Zod (schemas partages client/serveur) |
| Tests | Vitest + Testing Library (unit), Playwright (E2E) |
| Lint | Biome |
| Package manager | pnpm |
| Conteneurisation | Docker (PostgreSQL + PostGIS) |

## Metriques de la V2 (reference)
- 100+ pages/routes
- 16 tables de base de donnees
- 12 types d'assets, 11 types de logs
- Support cooperatives multi-fermes
- Mode offline avec OfflineBanner + ServiceWorker
- Quick actions (saisie rapide terrain)

---

*Ce fichier est la source de verite pour le contexte projet. Toute session Claude Code doit le lire en premier.*
