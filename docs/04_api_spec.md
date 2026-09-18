# 04 - API Spec

## Architecture API

- **tRPC v11** pour toutes les operations CRUD et queries
- **Server Actions** (Next.js) pour les mutations de formulaires et l'authentification (Auth.js v5)
- **Route API Next.js** pour l'upload de fichiers (`POST /api/upload`, multipart/form-data)
- **Type-safe end-to-end** : schemas Zod partages client/serveur

---

## Convention de nommage

- Router : `{module}Router` (ex: `assetRouter`, `logRouter`)
- Procedure query : `{entity}.list`, `{entity}.getById`, `{entity}.search`
- Procedure mutation : `{entity}.create`, `{entity}.update`, `{entity}.archive`
- Input : schema Zod (`z.object({...})`)
- Output : type infere Drizzle
- **Soft-delete** : les entites principales (assets, logs, plans) utilisent `archived_at` au lieu d'un DELETE physique

---

## Permissions / Roles

Quatre roles implementes : **owner** (proprietaire), **manager** (gestionnaire), **worker** (travailleur), **viewer** (observateur lecture seule).

| Niveau d'acces | Roles autorises |
|---|---|
| Lecture seule (list, getById, search) | owner, manager, worker, viewer |
| Ecriture (create, update) | owner, manager |
| Archive / Restore | owner, manager |
| Gestion membres (invite, updateRole, remove) | owner |
| Administration ferme (create, update ferme) | owner |

> Chaque router herite de `protectedProcedure` qui exige une session authentifiee. Les restrictions par role sont precisees dans chaque section ci-dessous.

---

## Pagination

Pattern standard pour toutes les procedures `.list` :
```typescript
Input:  { page?: number, limit?: number }  // default page=1, limit=25
Output: { items: T[], total: number, page: number, pages: number }
```

> **Note** : dans le code actuel, les routers pagines (`input`, `cooperative`, `finance`, `calendar`) retournent `pages` (nombre total de pages = `Math.ceil(total / limit)`). Le `marketplaceRouter` fait exception : il retourne `limit` au lieu de `pages` (voir section 14). Certains routers ne paginent pas du tout (ex: `farmMember.list`, `cooperative.members`, `quantity.listByLog`).

---

## Routers tRPC

### 0. `health` (inline dans `_app.ts`)
```
health               GET   {} → { status: 'ok' }
```
Procedure publique (`publicProcedure`) — pas d'authentification requise. Utilisee pour verifier que le serveur tRPC est operationnel.

### 1. `farmRouter`

> **Note** : La gestion des fermes est actuellement geree via Server Actions Auth.js et le `farmMemberRouter`. Les operations `farm.create`, `farm.update`, `farm.switch` sont des Server Actions, pas des procedures tRPC.

```
-- Server Actions (src/app/ actions) --
farm.create          POST  { name, description?, latitude?, longitude?, boundary?, timezone?, currency?, locale?, seasonType? }
farm.update          POST  { id, ...partialFarm }
farm.switch          POST  { farmId }  -- change la ferme active en session
```
Requires: owner

### 2. `assetRouter`
```
asset.list           GET   { farmId, type?, status?, search?, page?, limit? } → { items: Asset[], total, page, pages }
asset.getById        GET   { id } → Asset & { logs: Log[], children: Asset[], files: FileRecord[] }
asset.create         POST  { type, name, farmId, geometry?, parentId?, notes?, data?, flags?, isLocation?, isFixed?, idTags? }
asset.update         POST  { id, ...partialAsset }
asset.archive        POST  { id }  -- Soft-delete : met a jour archived_at
asset.restore        POST  { id }  -- Annule le soft-delete : remet archived_at a null
asset.search         GET   { farmId, query, type? } → Asset[]
```
Requires: owner, manager (lecture: owner, manager, worker)

### 3. `logRouter`
```
log.list             GET   { farmId, type?, status?, dateFrom?, dateTo?, assetId?, search?, page?, limit? } → { items: Log[], total, page, pages }
log.getById          GET   { id } → Log & { assets: Asset[], quantities: Quantity[], observationForm?: ObservationForm }
log.create           POST  { type, name, farmId, timestamp, status?, geometry?, notes?, data?, flags?, equipmentIds?, workerIds?, assetIds?: { assetId, role }[], quantities?: NewQuantity[] }
log.update           POST  { id, ...partialLog }
log.archive          POST  { id }  -- Soft-delete : met a jour archived_at
log.complete         POST  { id }  -- status = 'done'
```
Requires: owner, manager (lecture: owner, manager, worker)

### 4. `quantityRouter`
```
quantity.listByLog   GET   { logId } → Quantity[]
quantity.create      POST  { logId, measure, numerator, denominator?, unit, label?, inventoryAdjustment?, inventoryAssetId? }
quantity.update      POST  { id, ...partialQuantity }
quantity.delete      POST  { id }  -- Suppression physique — les quantites sont des sous-entites de logs, pas des entites autonomes
```
Requires: owner, manager

### 5. `planRouter`
```
plan.list            GET   { farmId, type?, status?, search?, page?, limit? } → { items: Plan[], total, page, pages }
plan.getById         GET   { id } → Plan & { logs: Log[] }
plan.kpis            GET   {} → { total, active, completed, cancelled }
plan.create          POST  { name, type, farmId, season?, startDate?, endDate?, notes? }
plan.update          POST  { id, ...partialPlan }
plan.archive         POST  { id }  -- Soft-delete : met a jour archived_at
plan.addLog          POST  { planId, logId }
plan.removeLog       POST  { planId, logId }
```
Requires: owner, manager (lecture: owner, manager, worker)

### 6. `inventoryRouter`
```
inventory.list       GET   { farmId, category?, search?, page?, limit? } → { items: InventoryItem[], total, page, pages }
inventory.getByAsset GET   { assetId } → InventoryDetail & { movements: Movement[] }
inventory.adjust     POST  { assetId, quantity, unit, logId?, type: 'increment'|'decrement'|'reset' }
inventory.alerts     GET   { farmId } → { asset: Asset, current: number, threshold: number }[]
```
Requires: owner, manager (lecture: owner, manager, worker)

### 7. `inputRouter` (intrants separes)
```
input.listPhyto      GET   { subcategory?, search?, page?, limit? } → { items: Asset[], total, page, pages } (type='material', input_category='phyto')
input.listFerti      GET   { subcategory?, search?, page?, limit? } → { items: Asset[], total, page, pages } (type='material', input_category='ferti')
input.listSemence    GET   { subcategory?, search?, page?, limit? } → { items: Asset[], total, page, pages } (type='seed')
input.create         POST  { name, farmId, inputCategory: 'phyto'|'ferti'|'semence', inputSubcategory, ...specificFields }
input.update         POST  { id, ...partialInput }
input.getStock       GET   { assetId } → { current: number, unit: string, movements: Movement[] }
input.applyToLog     POST  { logId, assetId, dose, doseUnit, method?, machineId?, treatedSurfaceHa? }
```
Requires: owner, manager

### 8. `observationRouter` (fiches terrain)
```
observation.list             GET   { farmId, formType?, assetId?, dateFrom?, dateTo?, page?, limit? } → { items: ObservationForm[], total, page, pages }
observation.getById          GET   { id } → ObservationForm
observation.createDensity    POST  { logId, assetId, cropType, variety, repetitions: { rep, plantCount }[], theoreticalDensity, sampleAreaM2, observerId, observationDate, startTime?, endTime?, observedSurfaceHa?, observerRemarks?, supervisorRemarks? }
observation.createStage      POST  { logId, assetId, cropType, variety, stageReached, dateReached, observerId, observationDate, ... }
observation.createPestDisease POST { logId, assetId, cropType, variety, numTargets, treatmentThreshold, observations: { pestOrDisease, category, targets: number[] }[], observerId, ... }
observation.createGrading    POST  { logId, assetId, cropType, variety, sampleSize, totalLengths, marketableLengths, majorDefects: { type, count }[], maturityIndex, estimatedYieldPerHa?, estimatedHarvestDate?, observerId, ... }
observation.update           POST  { id, ...partialObservation }
observation.archive          POST  { id }  -- Soft-delete : met a jour archived_at
```
Requires: owner, manager (lecture: owner, manager, worker)

### 9. `calendarRouter` (calendrier cultural)
```
-- Templates --
calendar.listTemplates       GET   { farmId, cropType?, search?, page?, limit? } → { items: CulturalCalendar[], total, page, pages }
calendar.getTemplate         GET   { id } → CulturalCalendar
calendar.createTemplate      POST  { farmId, name, cropType, variety?, stages: Stage[], totalDays?, notes? }
calendar.updateTemplate      POST  { id, ...partialCalendar }
calendar.deleteTemplate      POST  { id }  -- Suppression physique — les templates sont des modeles de reference, pas des entites metier avec historique. Aucune protection si des parcelCalendars y font reference.

-- Parcelles assignees --
calendar.listParcelCalendars GET   { farmId, assetId?, status?, dateFrom?, dateTo?, page?, limit? } → { items: ParcelCalendar[], total, page, pages }
calendar.assignToParcel      POST  { farmId, assetId, calendarId, sowingDate, notes? }
calendar.updateStageStatus   POST  { parcelCalendarId, stageName, actualDate, status: 'completed'|'skipped' }
calendar.getTimeline         GET   { farmId, status?, dateFrom?, dateTo?, cropType? } → TimelineEntry[]

-- Utilitaires --
calendar.kpis                GET   {} → { totalTemplates, totalAssigned, active, completed }
calendar.listParcels         GET   {} → { id, name }[]  -- Retourne un tableau brut (pas de pagination, pas d'enveloppe { items }). Liste des parcelles (type='land', non archivees) pour le formulaire d'assignation
```
Requires: owner, manager (lecture: owner, manager, worker)

### 10. `cropRouter` (cultures, varietes, saisons, rotation)

> Voir `src/server/routers/crop.ts` et `src/lib/validators/crop.validator.ts`.

```
-- Familles botaniques --
crop.listFamilies        GET   {} → CropFamily[]
crop.createFamily        POST  { code, name, description? }

-- Cultures --
crop.list                GET   { familyId?, search?, page?, limit? } → { items: Crop[], total, page, pages }
crop.create              POST  { code, nameFr, nameEn?, nameWo?, familyId?, cycleShortDays?, cycleLongDays?, seasonPreference? }

-- Varietes --
crop.listVarieties       GET   { cropId, search? } → CropVariety[]
crop.createVariety       POST  { cropId, code, name, cycleDays?, yieldPotentialKgHa?, characteristics?, origin? }

-- Saisons / Campagnes --
crop.listSeasons         GET   { farmId?, type?, year?, status?, page?, limit? } → { items: Season[], total, page, pages }
crop.createSeason        POST  { name, type: 'hivernage'|'contre_saison_chaude'|'contre_saison_froide', startDate, endDate, year, status?, notes? }
crop.updateSeason        POST  { id, ...partialSeason }

-- Rotation culturale --
crop.checkRotation       GET   { previousCropId, nextCropId, farmId? } → { compatibility, reason, recommendation, minIntervalDays } | null
crop.listRotationRules   GET   { farmId?, previousCropId?, compatibility?, page?, limit? } → { items: RotationRule[], total, page, pages }
crop.createRotationRule  POST  { previousCropId, nextCropId, compatibility, reason?, minIntervalDays?, recommendation?, farmId? }
```
Requires: owner, manager (lecture: owner, manager, worker)

> **Note** : `crop.checkRotation` retourne la regle de compatibilite entre deux cultures, en priorite les regles specifiques a la ferme (`farmId` non null), puis les regles globales. Retourne `null` si aucune regle n'existe.

### 11. `reportRouter`
```
report.dashboard     GET   { farmId } → DashboardData
report.assets        GET   { farmId, type?, dateFrom?, dateTo? } → AssetsReport
report.logs          GET   { farmId, type?, dateFrom?, dateTo? } → LogsReport
report.harvests      GET   { farmId, season?, dateFrom?, dateTo? } → HarvestReport
report.financials    GET   { farmId, dateFrom?, dateTo? } → FinancialsReport
```
Requires: owner, manager

### 12. `farmMemberRouter`
```
farmMember.list      GET   { search? } → { items: { id, name, email, role }[] }
```
Requires: owner, manager

> Ce router ne contient actuellement qu'une seule procedure (`list`). Il n'y a pas de pagination — tous les membres de la ferme sont retournes.
>
> **Procedures prevues** : `invite`, `updateRole`, `remove` (non implementees).

### 13. `financeRouter`
```
-- Transactions --
finance.listTransactions     GET   { type?, category?, status?, search?, startDate?, endDate?, page?, limit? } → { items: Transaction[], total, page, pages }
finance.listSales            GET   { type?, category?, status?, search?, startDate?, endDate?, page?, limit? } → { items: Transaction[], total, page, pages }
> Note : `listSales` utilise le meme schema d'input que `listTransactions` (listTransactionsSchema). Le code force `type='sale'` cote serveur.
finance.createTransaction    POST  { type, category, description, amount, date, clientName?, productName?, quantity?, unitPrice?, unit?, paymentMethod?, status?, notes? }
finance.createSale           POST  { productName, quantity, unitPrice, unit, date, clientName?, paymentMethod?, notes? }
finance.updateTransaction    POST  { id, ...partialTransaction }
finance.deleteTransaction    POST  { id }  -- Suppression physique (transaction + ecritures journal liees). Aucune protection cote serveur sur le statut : toute transaction peut etre supprimee.
finance.salesKpis            GET   {} → { caTotal, caMois, nbClients, nbProduits, nbVentesMois }
finance.financeKpis          GET   {} → { soldeNet, revenus, depenses, pertes, nbOperations }

-- Factures --
finance.listInvoices         GET   { type?, status?, search?, page?, limit? } → { items: Invoice[], total, page, pages }
finance.createInvoice        POST  { type: 'devis'|'proforma'|'facture', clientName, clientPhone, clientAddress, items: InvoiceItem[], taxAmount?, issueDate, dueDate?, notes?, clientEmail? }
finance.updateInvoice        POST  { id, status?, paidAt? }
finance.deleteInvoice        POST  { id }  -- Suppression physique (facture + ecritures journal liees). Aucune protection cote serveur sur le statut : toute facture peut etre supprimee, y compris les factures payees.
finance.invoiceKpis          GET   {} → { devis, proforma, factures, totalMontant }

-- Journal comptable --
finance.listJournal          GET   { category?, account?, search?, startDate?, endDate?, page?, limit? } → { items: JournalEntry[], total, page, pages, totalDebit, totalCredit, solde }
```
Requires: owner, manager

### 14. `cooperativeRouter`
```
cooperative.list               GET   { search?, page?, limit? } → { items: Cooperative[], total, page, pages }
cooperative.create             POST  { name, description?, region?, type? }
cooperative.invite             POST  { cooperativeId, farmId }  -- Cree une invitation avec token (expire 7 jours)
cooperative.accept             POST  { token }  -- Accepte une invitation par token
cooperative.members            GET   { cooperativeId } → CooperativeMember[]  -- Pas de pagination
cooperative.pendingInvitations GET   { cooperativeId } → CooperativeInvitation[]  -- Admin uniquement
cooperative.dashboard          GET   { cooperativeId } → { totalFarms, totalSurfaceHa, totalProductionKg, totalRevenueXof, farmDetails: { farmId, farmName, surfaceHa, productionKg, revenueXof }[] }
cooperative.availableFarms     GET   { cooperativeId } → Farm[]  -- Fermes non encore membres, admin uniquement
cooperative.myCooperativeFarms GET   {} → { cooperativeId, cooperativeName, farmId, farmName }[]  -- Pour le FarmSwitcher
```
Requires: owner (cooperative admin pour invite, pendingInvitations, availableFarms ; membre pour list, members, dashboard, myCooperativeFarms)

### 15. `marketplaceRouter`

> ⚠️ Format de pagination divergent du standard : retourne `limit` au lieu de `pages`. Harmonisation prevue.

```
-- Vue acheteur (tous les produits publies) --
marketplace.listAll          GET   { search?, category?, minPrice?, maxPrice?, bioOnly?, inStockOnly?, page?, limit? } → { items: Product[], total, page, limit }
marketplace.getProduct       GET   { productId } → Product & { farmName, sellerName }
marketplace.createOrder      POST  { productId, quantity, deliveryMethod, deliveryAddress?, notes? }
marketplace.listPlacedOrders GET   { status?, page?, limit? } → { items: Order[], total, page, limit }
marketplace.marketplaceKpis  GET   {} → { totalProducts, totalFarms, bioProducts }

-- Vue vendeur (mes produits) --
marketplace.listMyProducts   GET   { search?, category?, page?, limit? } → { items: Product[], total, page, limit }
marketplace.createProduct    POST  { name, category, pricePerKg, quantityAvailable, unit, description?, photoUrl?, location?, isBio?, assetId? }
marketplace.updateProduct    POST  { id, ...partialProduct }
marketplace.deleteProduct    POST  { productId }  -- Soft-delete : met a jour archived_at, depublie le produit
marketplace.sellerKpis       GET   {} → { totalProducts, publishedProducts, totalOrders, pendingOrders, totalRevenue }

-- Commandes recues (vendeur) --
marketplace.listReceivedOrders GET  { status?, page?, limit? } → { items: Order[], total, page, limit }
marketplace.updateOrderStatus  POST { orderId, status: 'confirmed'|'shipped'|'delivered'|'cancelled' }
```
Requires: owner, manager (lecture marketplace: tous les utilisateurs authentifies)

### 16. `searchRouter`
```
search.currentFarm  GET   {} → { id, name } | null  -- Ferme courante de l'utilisateur
search.global       GET   { query: string, limit?: number (max 20, default 5) } → { assets: { id, name, type }[], logs: { id, name, type }[], plans: { id, name, type }[] }
```
Requires: tout utilisateur authentifie (protectedProcedure). Recherche par ILIKE sur les noms dans la ferme courante.

### 17. `mapRouter`
```
map.getParcels      GET   {} → { id, name, status, data, geojson: string | null }[]  -- Retourne les parcelles (type='land') avec geometrie GeoJSON
```
Requires: tout utilisateur authentifie. Retourne un tableau brut (pas de pagination). La geometrie PostGIS est convertie en GeoJSON via `ST_AsGeoJSON()`.

### 18. `ndviRouter`
```
ndvi.getTimeSeries  GET   { assetId: UUID, months?: number (1-24, default 12) } → { data: NdviDataPoint[], hasGeometry: boolean }
```
Requires: tout utilisateur authentifie. Interroge l'API Sentinel Hub pour les donnees NDVI satellitaires. Fonctionne uniquement sur les assets de type `land` avec des coordonnees dans `data.coordinates`.

### 19. `plannedTaskRouter`
```
plannedTask.list    GET   { planId: UUID } → PlannedTask[]  -- Liste triee par sortOrder puis dayOffset, pas de pagination
plannedTask.create  POST  { planId, name, description?, type?, dayOffset?, plannedDate?, duration?, status?, inputs?, notes?, sortOrder? } → PlannedTask
plannedTask.update  POST  { id, name?, description?, type?, dayOffset?, plannedDate?, duration?, status?, inputs?, notes?, sortOrder? } → PlannedTask
plannedTask.delete  POST  { id } → { success: true }  -- Suppression physique — les taches planifiees sont des sous-entites de plans
```
Requires: owner, manager (verifie que le plan appartient a la ferme de l'utilisateur)

### 20. `cropRouter`
```
-- Familles de cultures --
crop.listFamilies    GET   {} → CropFamily[]  -- Pas de pagination
crop.createFamily    POST  { code, name, description? } → CropFamily

-- Cultures --
crop.list            GET   { search?, familyId?, page?, limit? } → { items: Crop[], total, page, pages }
crop.create          POST  { code, nameFr, nameEn?, nameWo?, familyId, cycleShortDays?, cycleLongDays?, seasonPreference?, data? } → Crop

-- Varietes --
crop.listVarieties   GET   { cropId } → CropVariety[]  -- Pas de pagination
crop.createVariety   POST  { cropId, code, name, cycleDays?, yieldPotentialKgHa?, characteristics?, origin? } → CropVariety

-- Saisons --
crop.listSeasons     GET   { year?, page?, limit? } → { items: Season[], total, page, pages }
crop.createSeason    POST  { name, type, startDate, endDate, year, status?, notes? } → Season
crop.updateSeason    POST  { id, name?, type?, startDate?, endDate?, year?, status?, notes? } → Season

-- Regles de rotation --
crop.checkRotation      GET   { previousCropId, nextCropId } → { compatibility, reason, recommendation, source }
crop.listRotationRules  GET   { farmId?, cropId?, page?, limit? } → { items: RotationRule[], total, page, pages }
crop.createRotationRule POST  { farmId?, previousCropId, nextCropId, compatibility, reason?, minIntervalDays?, recommendation?, data? } → RotationRule
```
Requires: tout utilisateur authentifie (familles/cultures/varietes sont globales ; saisons et regles de rotation sont liees a une ferme)

---

## Routers deprecies / retires

### ~~`authRouter`~~ — DEPRECATED
> **Remplace par Server Actions Auth.js v5.** L'authentification (register, login, logout, resetPassword, changePassword) est geree via les Server Actions de Next.js et le provider Credentials d'Auth.js. Il n'y a pas de router tRPC `auth` dans le code.

### ~~`machineRouter`~~ — DEPRECATED
> **Absorbe par `assetRouter`.** Les machines/equipements sont des assets de type `equipment`. Les requetes d'usage et de disponibilite se font via `asset.list` avec filtre `type=equipment` et `log.list` filtre par `equipmentIds`.

### ~~`taxonomyRouter`~~ — DEPRECATED
> **Retire.** La gestion des taxonomies (types de cultures, categories) est integree directement dans les schemas Zod et les enums de la base de donnees. Pas de router tRPC dedie.

### ~~`fileRouter`~~ — DEPRECATED
> **Remplace par une route API Next.js.** L'upload de fichiers se fait via `POST /api/upload` (multipart/form-data). Les metadonnees des fichiers sont liees aux entites via les champs JSONB des assets/logs. Il n'y a pas de router tRPC `file` dans le code.

### ~~`userRouter`~~ — DEPRECATED
> **Remplace par `farmMemberRouter` et Server Actions Auth.js.** La gestion des utilisateurs au sein d'une ferme est geree par `farmMemberRouter`. Les operations de profil utilisateur (changement mot de passe, etc.) sont des Server Actions.

### ~~`notificationRouter`~~ — DEPRECATED
> **Non implemente.** Le systeme de notifications est prevu pour une version future. Il n'y a pas de router tRPC `notification` dans le code actuellement.

---

## Upload de fichiers

L'upload de fichiers ne passe **pas** par tRPC (qui ne supporte pas nativement le multipart/form-data).

```
POST /api/upload
Content-Type: multipart/form-data

Body:
  file:        File          (obligatoire)
  entityType:  string        (ex: 'asset', 'log', 'observation')
  entityId:    string (UUID)

Response: { url: string, fileId: string, entityType: string, entityId: string }
```

Les metadonnees du fichier sont ensuite accessibles via les champs JSONB des entites associees.

---

## Validation Zod — schemas partages

Chaque router a un fichier Zod correspondant dans `src/lib/validators/` :
- `asset.validator.ts`
- `log.validator.ts`
- `observation.validator.ts`
- `calendar.validator.ts`
- `input.validator.ts`
- `crop.validator.ts`
- `plan.validator.ts`
- `finance.validator.ts`
- `marketplace.validator.ts`
- etc.

Les schemas sont reutilises cote client (React Hook Form) et cote serveur (tRPC input validation).

---

## Gestion d'erreurs

- `TRPCError` avec codes standards : `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`
- Zod validation errors retournees automatiquement par tRPC

---

*Ce fichier definit le contrat API complet. Toute nouvelle route doit d'abord etre ajoutee ici.*
