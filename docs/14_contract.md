# 14 - Contract (Cahier des charges)

## Objet
Developpement de SenagrOS, systeme de gestion d'exploitation agricole (FMIS) en mode application web progressive (PWA), destine aux exploitations agricoles d'Afrique de l'Ouest.

## Perimetre fonctionnel

### Implemente (Done)
1. Authentification et gestion des utilisateurs (4 roles) — Phase 0
2. Gestion multi-fermes avec FarmSwitcher — Phase 0
3. CRUD Assets — 12 types (parcelle, culture, animal, equipement, materiel, capteur, eau, semence, produit, compost, groupe, structure) — Phase 1
4. CRUD Logs — 12 types (activite, observation, input, recolte, semis, repiquage, naissance, maintenance, medical, labo, mouvement, irrigation) — Phase 2
5. Semis enrichi : type (manuel/machine), selection machine, profondeur, ecartements — Phase 2
6. Intrants separes en 3 categories (phyto/ferti/semence) avec sous-categories et gestion de stock — Phase 3
7. Fiches d'observation terrain : densite de levee, suivi stade cultural, maladies-ravageurs, agreage pre-recolte — Phase 4
8. Calendrier cultural : templates par culture/variete + instances par parcelle — Phase 5
9. Parc materiel : catalogue machines + assignation activite→machine→employe — Phase 2
10. Carte interactive MapLibre avec parcelles PostGIS — Phase 1
11. Plans / campagnes avec suivi — Phase 6
12. Stocks et inventaire par categorie — Phase 3
13. Rapports et tableaux de bord avec graphiques — Phase 7
14. Finances (ventes, achats, facturation, comptabilite simplifiee) — Phase 8
15. Meteo (Open-Meteo / ANACIM) — Phase 7
16. Export CSV/Excel/PDF — Phase 7
17. Design TailAdmin (palette verte, KPI cards, sidebar, formulaires modaux) — Phase 0
18. Referentiel cultures : 8 familles, 12 cultures trilingues (FR/EN/WO), varietes, router cropRouter (12 procedures) — Post-Phase 8
19. Saisons/campagnes agricoles : table seasons, 3 types (hivernage, contre-saison chaude/froide), statuts — Post-Phase 8
20. Rotation culturale : regles de compatibilite (4 niveaux), 9 regles senegalaises, verification automatique — Post-Phase 8
21. Parcelles enrichies : reseau d'irrigation detaille (source, type, pompe, filtration, fertigation, condition) — Post-Phase 8
22. Intrants enrichis : DDR, doses homologuees, max applications, organismes cibles, cultures autorisees — Post-Phase 8
23. Application intrant enrichie : multi-parcelles, melange de cuve multi-produits, volume bouillie, conditions meteo avec warnings — Post-Phase 8
24. Dates recolte (prevue/effective) sur calendrier parcellaire — Post-Phase 8

### Reste a faire (P0)
18. Mode offline (PWA avec ServiceWorker, sync mutations) — Phase 9
19. i18n : Francais, English, Wolof — Phase 10

### Inclus post-MVP (P1)
20. Cooperatives multi-fermes — Phase 11

### Hors scope initial (P2)
21. Marketplace — Phase 12
22. API publique REST
23. Capteurs IoT
24. Integration ERP Odoo
25. Notifications SMS

## Perimetre technique

### Stack imposee
- Next.js 15 (App Router)
- tRPC v11
- Drizzle ORM
- PostgreSQL 16 + PostGIS 3.4
- Auth.js v5
- MapLibre GL JS
- TailAdmin React + Tailwind v4
- Recharts
- next-intl
- Zod
- Vitest + Playwright
- Biome
- pnpm
- Docker

### Contraintes
- **Offline-first** : l'application doit fonctionner en mode degrade sans connexion internet
- **Mobile-first** : l'interface doit etre utilisable sur smartphone (terrain)
- **Performance** : temps de chargement < 3s sur 3G
- **Langues** : FR (defaut), EN, WO — toute chaine visible traduite
- **Monnaie** : XOF (FCFA) par defaut, configurable par ferme
- **Fuseau** : Africa/Dakar par defaut, configurable
- **Navigateurs** : Chrome 90+, Safari 15+, Firefox 90+ (mobile et desktop)

## Livrables

| Livrable | Format | Quand |
|----------|--------|-------|
| Code source | Repository git | Continu |
| Documentation technique | Fichiers .md dans `/docs` | Continu |
| Base de donnees | Schema Drizzle + migrations SQL | Phase 0 |
| Seed donnees Senegal | Script TypeScript | Phase 0 |
| Tests unitaires | Vitest | Chaque phase |
| Tests E2E | Playwright | Chaque phase |
| Application deployable | Docker image | Phase finale |

## Criteres d'acceptation

### Fonctionnels
- Chaque feature decrite dans 02_features.md est implementee et testee
- Les fiches d'observation reproduisent les calculs des fiches papier SCL
- Le calendrier cultural affiche une timeline lisible avec alertes

### Techniques
- `pnpm typecheck` : 0 erreur
- `pnpm lint` : 0 erreur
- `pnpm test` : 100% pass
- `pnpm test:e2e` : 100% pass
- `pnpm build` : build production reussie

### Design
- L'interface reproduit le design TailAdmin de la V2 (screenshots reference)
- Responsive : utilisable sur mobile 375px et desktop 1920px
- KPI cards colorees, sidebar verte, formulaires modaux

## Validation
- Les agronomes partenaires valident les maquettes/prototypes a chaque phase
- Checklist de verification dans 13_gap_fill_and_verification.md

---

*Ce fichier est le cahier des charges contractuel du projet.*
