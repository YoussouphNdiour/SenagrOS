# 04 - API Spec

## Architecture API

- **tRPC v11** pour toutes les operations CRUD et queries
- **Server Actions** (Next.js) pour les mutations de formulaires
- **Type-safe end-to-end** : schemas Zod partages client/serveur

---

## Convention de nommage

- Router : `{module}Router` (ex: `assetRouter`, `logRouter`)
- Procedure query : `{entity}.list`, `{entity}.getById`, `{entity}.search`
- Procedure mutation : `{entity}.create`, `{entity}.update`, `{entity}.delete`, `{entity}.archive`
- Input : schema Zod (`z.object({...})`)
- Output : type infere Drizzle

---

## Routers tRPC

### 1. `authRouter`
```
auth.register       POST  { email, name, password, locale? }
auth.login           POST  { email, password }
auth.logout          POST  {}
auth.resetPassword   POST  { email }
auth.changePassword  POST  { currentPassword, newPassword }
auth.me              GET   {} → User
```

### 2. `farmRouter`
```
farm.list            GET   {} → Farm[]
farm.getById         GET   { id } → Farm
farm.create          POST  { name, description?, latitude?, longitude?, boundary?, timezone?, currency?, locale?, seasonType? }
farm.update          POST  { id, ...partialFarm }
farm.delete          POST  { id }
farm.switch          POST  { farmId }  -- change la ferme active en session
```

### 3. `assetRouter`
```
asset.list           GET   { farmId, type?, status?, search?, page?, limit? } → { items: Asset[], total, page, pages }
asset.getById        GET   { id } → Asset & { logs: Log[], children: Asset[], files: FileRecord[] }
asset.create         POST  { type, name, farmId, geometry?, parentId?, notes?, data?, flags?, isLocation?, isFixed?, idTags? }
asset.update         POST  { id, ...partialAsset }
asset.archive        POST  { id }  -- set archived_at
asset.restore        POST  { id }  -- unset archived_at
asset.search         GET   { farmId, query, type? } → Asset[]
```

### 4. `logRouter`
```
log.list             GET   { farmId, type?, status?, dateFrom?, dateTo?, assetId?, search?, page?, limit? } → { items: Log[], total, page, pages }
log.getById          GET   { id } → Log & { assets: Asset[], quantities: Quantity[], observationForm?: ObservationForm }
log.create           POST  { type, name, farmId, timestamp, status?, geometry?, notes?, data?, flags?, equipmentIds?, workerIds?, assetIds?: { assetId, role }[], quantities?: NewQuantity[] }
log.update           POST  { id, ...partialLog }
log.delete           POST  { id }
log.complete         POST  { id }  -- status = 'done'
```

### 5. `quantityRouter`
```
quantity.listByLog   GET   { logId } → Quantity[]
quantity.create      POST  { logId, measure, numerator, denominator?, unit, label?, inventoryAdjustment?, inventoryAssetId? }
quantity.update      POST  { id, ...partialQuantity }
quantity.delete      POST  { id }
```

### 6. `planRouter`
```
plan.list            GET   { farmId, type?, status?, page?, limit? } → { items: Plan[], total }
plan.getById         GET   { id } → Plan & { logs: Log[] }
plan.create          POST  { name, type, farmId, season?, startDate?, endDate?, notes? }
plan.update          POST  { id, ...partialPlan }
plan.delete          POST  { id }
plan.addLog          POST  { planId, logId }
plan.removeLog       POST  { planId, logId }
```

### 7. `inventoryRouter`
```
inventory.list       GET   { farmId, category?, search?, page?, limit? } → { items: InventoryItem[], total }
inventory.getByAsset GET   { assetId } → InventoryDetail & { movements: Movement[] }
inventory.adjust     POST  { assetId, quantity, unit, logId?, type: 'increment'|'decrement'|'reset' }
inventory.alerts     GET   { farmId } → { asset: Asset, current: number, threshold: number }[]
```

### 8. `inputRouter` (NOUVEAU — intrants separes)
```
input.listPhyto      GET   { farmId, subcategory?, search? } → Asset[] (type=material, input_category=phyto)
input.listFerti      GET   { farmId, subcategory?, search? } → Asset[]
input.listSemence    GET   { farmId, subcategory?, search? } → Asset[]
input.create         POST  { name, farmId, inputCategory: 'phyto'|'ferti'|'semence', inputSubcategory, ...specificFields }
input.update         POST  { id, ...partialInput }
input.getStock       GET   { assetId } → { current: number, unit: string, movements: Movement[] }
input.applyToLog     POST  { logId, assetId, dose, doseUnit, method?, machineId?, treatedSurfaceHa? }
```

### 9. `observationRouter` (NOUVEAU — fiches terrain)
```
observation.list             GET   { farmId, formType?, assetId?, dateFrom?, dateTo?, page?, limit? } → { items: ObservationForm[], total }
observation.getById          GET   { id } → ObservationForm
observation.createDensity    POST  { logId, assetId, cropType, variety, repetitions: { rep, plantCount }[], theoreticalDensity, sampleAreaM2, observerId, observationDate, startTime?, endTime?, observedSurfaceHa?, observerRemarks?, supervisorRemarks? }
observation.createStage      POST  { logId, assetId, cropType, variety, stageReached, dateReached, observerId, observationDate, ... }
observation.createPestDisease POST { logId, assetId, cropType, variety, numTargets, treatmentThreshold, observations: { pestOrDisease, category, targets: number[] }[], observerId, ... }
observation.createGrading    POST  { logId, assetId, cropType, variety, sampleSize, totalLengths, marketableLengths, majorDefects: { type, count }[], maturityIndex, estimatedYieldPerHa?, estimatedHarvestDate?, observerId, ... }
observation.update           POST  { id, ...partialObservation }
observation.delete           POST  { id }
```

### 10. `calendarRouter` (NOUVEAU — calendrier cultural)
```
calendar.listTemplates       GET   { farmId } → CulturalCalendar[]
calendar.createTemplate      POST  { farmId, name, cropType, variety?, stages: Stage[], totalDays?, notes? }
calendar.updateTemplate      POST  { id, ...partialCalendar }
calendar.deleteTemplate      POST  { id }

calendar.listParcelCalendars GET   { farmId, assetId?, status?, page?, limit? } → ParcelCalendar[]
calendar.assignToParcel      POST  { farmId, assetId, calendarId, sowingDate, notes? }
calendar.updateStageStatus   POST  { parcelCalendarId, stageName, actualDate, status: 'completed'|'skipped' }
calendar.getTimeline         GET   { farmId, dateFrom?, dateTo? } → TimelineEntry[]
```

### 11. `machineRouter` (NOUVEAU — parc materiel)
```
machine.list                 GET   { farmId, type?, status? } → Asset[] (type=equipment)
machine.getUsageHistory      GET   { assetId, dateFrom?, dateTo? } → Log[]
machine.getAvailability      GET   { farmId, date } → Asset[]  -- machines disponibles a une date
```

### 12. `taxonomyRouter`
```
taxonomy.list        GET   { farmId?, type? } → Taxonomy[]
taxonomy.create      POST  { type, name, description?, parentId?, farmId?, data? }
taxonomy.update      POST  { id, ...partialTaxonomy }
taxonomy.delete      POST  { id }
taxonomy.getTree     GET   { type, farmId? } → TaxonomyTree[]
```

### 13. `fileRouter`
```
file.list            GET   { entityType, entityId } → FileRecord[]
file.upload          POST  { entityType, entityId, file: File }
file.delete          POST  { id }
file.getUrl          GET   { id } → { url: string }
```

### 14. `reportRouter`
```
report.dashboard     GET   { farmId } → DashboardData
report.assets        GET   { farmId, type?, dateFrom?, dateTo? } → AssetsReport
report.logs          GET   { farmId, type?, dateFrom?, dateTo? } → LogsReport
report.harvests      GET   { farmId, season?, dateFrom?, dateTo? } → HarvestReport
report.financials    GET   { farmId, dateFrom?, dateTo? } → FinancialsReport
```

### 15. `userRouter`
```
user.list            GET   { farmId } → User[]
user.invite          POST  { farmId, email, role }
user.updateRole      POST  { userId, farmId, role }
user.remove          POST  { userId, farmId }
```

### 16. `notificationRouter`
```
notification.list    GET   { userId, read? } → Notification[]
notification.markRead POST { id }
notification.markAllRead POST { userId }
```

### 17. `cooperativeRouter`
```
cooperative.list     GET   {} → Cooperative[]
cooperative.create   POST  { name, description?, region?, type? }
cooperative.invite   POST  { cooperativeId, farmId }
cooperative.accept   POST  { token }
cooperative.members  GET   { cooperativeId } → CooperativeMember[]
cooperative.dashboard GET  { cooperativeId } → CooperativeDashboard
```

---

## Validation Zod — schemas partages

Chaque router a un fichier Zod correspondant dans `src/lib/validators/` :
- `asset.validator.ts`
- `log.validator.ts`
- `observation.validator.ts`
- `calendar.validator.ts`
- `input.validator.ts`
- etc.

Les schemas sont reutilises cote client (React Hook Form) et cote serveur (tRPC input validation).

---

## Pagination

Pattern standard pour toutes les listes :
```typescript
Input:  { page?: number, limit?: number }  // default page=1, limit=25
Output: { items: T[], total: number, page: number, pages: number }
```

---

## Gestion d'erreurs

- `TRPCError` avec codes standards : `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`
- Zod validation errors retournees automatiquement par tRPC

---

*Ce fichier definit le contrat API complet. Toute nouvelle route doit d'abord etre ajoutee ici.*
