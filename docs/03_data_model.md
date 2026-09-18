# 03 - Data Model

## Convention generales
- **PK** : UUID v4 (`defaultRandom()`)
- **Nommage tables** : plural snake_case
- **Nommage colonnes** : snake_case
- **Timestamps** : `created_at`, `updated_at` sur toutes les tables
- **Soft delete** : `archived_at` (pas de suppression physique pour assets/logs)
- **JSONB `data`** : champs specifiques au type (pattern polymorphique)
- **ORM** : Drizzle ORM — types inferes depuis le schema

---

## Tables principales

### 1. `farms`

```
farms
├── id              UUID PK
├── name            VARCHAR(255) NOT NULL
├── description     TEXT
├── latitude        VARCHAR(20)
├── longitude       VARCHAR(20)
├── boundary        GEOMETRY (PostGIS polygon)  ⚠️ Migration prevue : colonne PostGIS a ajouter quand l'extension sera configuree
├── timezone        VARCHAR(50) DEFAULT 'Africa/Dakar'
├── currency        VARCHAR(3) DEFAULT 'XOF'
├── locale          VARCHAR(5) DEFAULT 'fr'
├── season_type     VARCHAR(20) DEFAULT 'hivernage'
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

### 2. `users`

```
users
├── id              UUID PK
├── email           VARCHAR(255) NOT NULL UNIQUE
├── name            VARCHAR(255) NOT NULL
├── password_hash   VARCHAR(255)
├── role            ENUM user_role DEFAULT 'worker'  -- owner|manager|worker|viewer
├── farm_id         UUID FK → farms.id
├── locale          VARCHAR(5) DEFAULT 'fr'
├── avatar_url      TEXT
├── is_active       BOOLEAN DEFAULT true
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

> ⚠️ Migration prevue : `role` et `farm_id` seront retires au profit de `farm_members` pour le support multi-ferme (voir 16_decisions.md).

### 3. `assets`

```
assets
├── id              UUID PK
├── type            ENUM asset_type NOT NULL
│                   (land|plant|animal|equipment|structure|material|sensor|water|seed|product|compost|group)
├── name            VARCHAR(255) NOT NULL
├── status          VARCHAR(20) DEFAULT 'active'  -- active|inactive|archived
├── geometry        GEOMETRY (PostGIS)  ⚠️ Migration prevue : colonne PostGIS a ajouter quand l'extension sera configuree
├── parent_id       UUID (self-ref, hierarchie)
├── farm_id         UUID FK → farms.id NOT NULL
├── notes           TEXT
├── data            JSONB DEFAULT {}    -- champs specifiques au type
├── flags           JSONB DEFAULT []
├── is_location     BOOLEAN DEFAULT false
├── is_fixed        BOOLEAN DEFAULT false
├── id_tags         JSONB DEFAULT []    -- identifiants externes
├── created_at      TIMESTAMP DEFAULT NOW()
├── updated_at      TIMESTAMP DEFAULT NOW()
└── archived_at     TIMESTAMP           -- soft delete
```

#### Contenu JSONB `data` par type d'asset

**land** :
```json
{
  "surface_ha": 2.30,
  "soil_type": "argileux",
  "irrigation_type": "goutte_a_goutte",
  "code_parcelle": "2P5D2-5374",
  "ilot": "DIAMA",
  "irrigation_network": {
    "source": "forage",
    "network_type": "goutte_a_goutte",
    "pipe_diameter_mm": 16,
    "dripper_spacing_cm": 30,
    "flow_rate_m3_h": 5.0,
    "pump_type": "centrifuge",
    "pump_power_cv": 7.5,
    "filtration": "disque",
    "fertigation_equipped": true,
    "installation_date": "2021-06-15",
    "network_condition": "bon"
  }
}
```

**Champs `irrigation_network`** (sous-objet JSONB pour parcelle) :

| Champ | Type | Valeurs possibles |
|-------|------|-------------------|
| `source` | string | forage, fleuve, lac, bassin, pluie, autre |
| `network_type` | string | goutte_a_goutte, aspersion, micro_aspersion, pivot, californien, gravitaire, submersion |
| `pipe_diameter_mm` | number | Diametre tuyaux (mm) |
| `dripper_spacing_cm` | number | Ecartement goutteurs (cm) |
| `flow_rate_m3_h` | number | Debit (m3/h) |
| `pump_type` | string | Type de pompe |
| `pump_power_cv` | number | Puissance pompe (CV) |
| `filtration` | string | disque, sable, tamis, aucun |
| `fertigation_equipped` | boolean | Fertigation installee |
| `installation_date` | string (date) | Date d'installation |
| `network_condition` | string | bon, moyen, degrade, hors_service |

**plant** :
```json
{
  "crop_type": "haricot_vert",
  "variety": "Euforia",
  "family": "legumineuse",
  "planting_date": "2022-03-14",
  "expected_harvest_date": "2022-05-13",
  "row_spacing_cm": 60,
  "plant_spacing_cm": 20,
  "density_plants_ha": 50000
}
```

**equipment** :
```json
{
  "equipment_type": "semoir",
  "brand": "John Deere",
  "model": "1750",
  "serial_number": "JD1750-2021-001",
  "purchase_date": "2021-01-15",
  "purchase_price_xof": 15000000,
  "status_machine": "disponible"
}
```

**material (phyto)** :
```json
{
  "input_category": "phyto",
  "input_subcategory": "insecticide",
  "commercial_name": "Decis Expert",
  "active_ingredient": "Deltamethrine",
  "recommended_dose": "0.5 L/ha",
  "dar_days": 3,
  "toxicity_class": "II",
  "form": "liquide",
  "ddr_days": 1,
  "dose_min": 0.3,
  "dose_max": 0.6,
  "dose_unit": "L/ha",
  "max_applications_per_cycle": 3,
  "target_organisms": ["pucerons", "chenilles", "mouche_blanche"],
  "target_crops": ["haricot_vert", "tomate", "oignon"]
}
```

**Nouveaux champs `material`** (ajouts V3 — feedback agronomes) :

| Champ | Type | Description |
|-------|------|-------------|
| `ddr_days` | number | Delai De Reentree (jours) — delai avant reentree dans la parcelle traitee |
| `dose_min` | number | Dose homologuee minimum |
| `dose_max` | number | Dose homologuee maximum |
| `dose_unit` | string | Unite de dose (L/ha, kg/ha, g/ha, mL/ha) |
| `max_applications_per_cycle` | number | Nombre max d'applications par cycle cultural |
| `target_organisms` | string[] | Organismes cibles (pucerons, rouille, mildiou, chenilles...) |
| `target_crops` | string[] | Cultures homologuees pour ce produit |

**material (ferti)** :
```json
{
  "input_category": "ferti",
  "input_subcategory": "engrais_mineral",
  "commercial_name": "NPK 15-15-15",
  "composition_npk": "15-15-15",
  "form": "granule",
  "recommended_dose": "200 kg/ha"
}
```

**seed** :
```json
{
  "crop_type": "oignon",
  "variety": "Red King",
  "lot_number": "RK-2022-001",
  "germination_rate": 92,
  "origin": "Senegal",
  "seed_treatment": "Thiram",
  "certification": "certifiee"
}
```

### 4. `logs`

```
logs
├── id              UUID PK
├── type            ENUM log_type NOT NULL
│                   (activity|observation|input|harvest|seeding|transplanting|birth|maintenance|medical|lab_test|movement|irrigation)
├── name            VARCHAR(255) NOT NULL
├── status          VARCHAR(20) DEFAULT 'pending'  -- pending|done|cancelled
├── timestamp       TIMESTAMP NOT NULL
├── farm_id         UUID FK → farms.id NOT NULL
├── notes           TEXT
├── data            JSONB DEFAULT {}
├── flags           JSONB DEFAULT []
├── is_movement     BOOLEAN DEFAULT false
├── equipment_ids   JSONB DEFAULT []   -- UUIDs des machines utilisees
├── location_ids    JSONB DEFAULT []
├── worker_ids      JSONB DEFAULT []   -- UUIDs des employes assignes
├── assignee_id     UUID FK → users.id  -- technicien/agronome assigne a cette tache
├── geometry        GEOMETRY (PostGIS)  -- geolocalisation du log
├── created_at      TIMESTAMPTZ DEFAULT NOW()
└── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

> ⚠️ Migration prevue : `archived_at TIMESTAMPTZ` sera ajoute pour le soft-delete (convention assets/logs).

**INDEX** : `idx_logs_type_timestamp` sur (type, timestamp)

#### Contenu JSONB `data` par type de log

**seeding** :
```json
{
  "sowing_type": "machine",
  "machine_id": "uuid-du-semoir",
  "seed_depth_cm": 3,
  "row_spacing_cm": 75,
  "plant_spacing_cm": 25,
  "seed_rate_kg_ha": 120,
  "seed_id": "uuid-de-la-semence"
}
```

**input** :
```json
{
  "input_type": "phyto",
  "input_subcategory": "insecticide",
  "product_id": "uuid-du-produit",
  "dose": 0.5,
  "dose_unit": "L/ha",
  "method": "pulverisation",
  "machine_id": "uuid-du-pulverisateur",
  "treated_surface_ha": 2.30,
  "target_parcel_ids": ["uuid-parcelle-1", "uuid-parcelle-2"],
  "products": [
    {
      "product_id": "uuid-produit-1",
      "dose": 0.5,
      "dose_unit": "L/ha",
      "quantity_used": 1.15
    },
    {
      "product_id": "uuid-produit-2",
      "dose": 200,
      "dose_unit": "g/ha",
      "quantity_used": 460
    }
  ],
  "target_part": "feuillage",
  "water_volume_liters": 200,
  "spray_volume_per_ha": 300,
  "spray_volume_total": 690,
  "weather": {
    "temperature_c": 28,
    "wind_speed_kmh": 12,
    "wind_direction": "NE",
    "humidity_percent": 65,
    "rain_last_24h": false,
    "rain_forecast_24h": false
  }
}
```

**Enrichissement `input` V3** — Le schema `inputDataSchema` a ete enrichi pour supporter :
- **Multi-parcelles** : `target_parcel_ids` (application sur plusieurs parcelles)
- **Melange de cuve** : `products` (array — multi-produits avec dose et quantite par produit)
- **Partie cible** : `target_part` (sol, feuillage, racines, fruits, tiges, semences, plante_entiere)
- **Volume de bouillie** : `water_volume_liters`, `spray_volume_per_ha`, `spray_volume_total`
- **Conditions meteo** : `weather` (temperature, vent, humidite, pluie) — avec warnings automatiques (vent >19km/h, humidite <40%, pluie prevue)

Schemas Zod associes : `inputProductSchema`, `weatherConditionsSchema` (dans `log.validator.ts`)

**observation** :
```json
{
  "observation_type": "emergence_density",
  "form_data": { ... }  // voir Module 6 ci-dessous
}
```

**harvest** :
```json
{
  "yield_kg": 3500,
  "yield_per_ha": 1521,
  "quality_grade": "A",
  "destination": "marche_local",
  "price_per_kg_xof": 250
}
```

### 5. `log_assets` (N:N)

```
log_assets
├── log_id          UUID FK → logs.id (CASCADE) NOT NULL
├── asset_id        UUID FK → assets.id (CASCADE) NOT NULL
├── role            VARCHAR(20) DEFAULT 'subject'  -- subject|location|input
└── PK (log_id, asset_id)
```

### 6. `quantities`

```
quantities
├── id                      UUID PK
├── log_id                  UUID FK → logs.id (CASCADE) NOT NULL
├── measure                 VARCHAR(20) NOT NULL  -- count|weight|volume|length|area|rate
├── numerator               BIGINT NOT NULL
├── denominator             BIGINT DEFAULT 1
├── unit                    VARCHAR(20) NOT NULL  -- kg|L|m|ha|plants|units
├── label                   VARCHAR(100)
├── inventory_adjustment    ENUM (increment|decrement|reset)
└── inventory_asset_id      UUID FK → assets.id
```

> ⚠️ Migration prevue : `numerator` — passage de BIGINT a NUMERIC(15,4) pour supporter les decimales. `created_at` et `updated_at` seront ajoutes pour la tracabilite.

### 7. `plans`

```
plans
├── id              UUID PK
├── name            VARCHAR(255) NOT NULL
├── type            VARCHAR(50) NOT NULL  -- crop|grazing|harvest
├── status          VARCHAR(20) DEFAULT 'active'
├── season          VARCHAR(50)
├── start_date      DATE
├── end_date        DATE
├── farm_id         UUID FK → farms.id NOT NULL
├── notes           TEXT
├── flags           JSONB DEFAULT []
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

### 8. `plan_logs` (N:N)

```
plan_logs
├── plan_id         UUID FK → plans.id (CASCADE) NOT NULL
├── log_id          UUID FK → logs.id (CASCADE) NOT NULL
└── PK (plan_id, log_id)
```

### 9. `inventory`

```
inventory
├── id              UUID PK
├── asset_id        UUID FK → assets.id NOT NULL
├── quantity         DECIMAL(15,4) NOT NULL
├── unit            VARCHAR(20) NOT NULL
├── log_id          UUID FK → logs.id
├── farm_id         UUID FK → farms.id NOT NULL
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()  ⚠️ Migration prevue : colonne absente du code actuel
```

### 10. `taxonomies`

```
taxonomies
├── id              UUID PK
├── type            VARCHAR(50) NOT NULL  -- crop_family|animal_type|season|input_category|pest_type|disease_type|cultural_stage|equipment_type
├── name            VARCHAR(255) NOT NULL
├── description     TEXT
├── parent_id       UUID (hierarchie)
├── farm_id         UUID FK → farms.id (NULL = global)
├── data            JSONB DEFAULT {}
├── created_at      TIMESTAMP DEFAULT NOW()  ⚠️ Migration prevue : colonne absente du code actuel
└── updated_at      TIMESTAMP
```

**Taxonomies predefinies (seed)** :

| type | exemples |
|------|----------|
| crop_family | Cereales, Legumineuses, Maraichage, Fruits |
| season | Hivernage, Contre-saison chaude, Contre-saison froide |
| input_category | phyto > herbicide/fongicide/insecticide, ferti > mineral/organique, semence > certifiee/paysanne |
| pest_type | Chenilles, Pucerons, Mouche blanche, Thrips, Acariens, Nematodes |
| disease_type | Mildiou, Oedium, Fusariose, Bacteriose, Virose |
| cultural_stage | Semis, Levee, Tallage, Montaison, Epiaison, Floraison, Maturite |
| equipment_type | Tracteur, Semoir, Pulverisateur, Moissonneuse, Epandeur, Bineuse |

### 11. `files`

```
files
├── id              UUID PK
├── entity_type     VARCHAR(50) NOT NULL  -- asset|log|plan|observation
├── entity_id       UUID NOT NULL
├── filename        VARCHAR(255) NOT NULL
├── url             TEXT NOT NULL
├── mime_type       VARCHAR(100)
├── size            INTEGER
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP
```

### 12. `revisions`

```
revisions
├── id              UUID PK
├── entity_type     VARCHAR(20) NOT NULL
├── entity_id       UUID NOT NULL
├── revision_number INTEGER NOT NULL
├── data            JSONB NOT NULL
├── user_id         UUID FK → users.id NOT NULL
├── message         TEXT
├── created_at      TIMESTAMP DEFAULT NOW()
└── UNIQUE INDEX (entity_type, entity_id, revision_number)
```

### 13. `farm_members`

```
farm_members
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── user_id         UUID FK → users.id NOT NULL
├── role            VARCHAR(20) NOT NULL  -- owner|manager|worker|viewer
├── joined_at       TIMESTAMP DEFAULT NOW()
└── UNIQUE (farm_id, user_id)
```

> ⚠️ Role `technician` a ajouter dans une migration future.

### 14. `farm_invitations`

```
farm_invitations
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── invited_by      UUID FK → users.id NOT NULL
├── email           VARCHAR(255) NOT NULL
├── role            VARCHAR(20) NOT NULL
├── token           VARCHAR(64) NOT NULL UNIQUE
├── expires_at      TIMESTAMP NOT NULL
├── accepted_at     TIMESTAMP
└── created_at      TIMESTAMP DEFAULT NOW()
```

### 15. `api_keys`

```
api_keys
├── id              UUID PK
├── name            VARCHAR(255) NOT NULL
├── key_hash        VARCHAR(255) NOT NULL
├── farm_id         UUID FK → farms.id NOT NULL
├── user_id         UUID FK → users.id NOT NULL
├── permissions     JSONB DEFAULT []
├── last_used_at    TIMESTAMP
├── expires_at      TIMESTAMP
├── created_at      TIMESTAMP DEFAULT NOW()
└── revoked_at      TIMESTAMP
```

### 16. `cooperatives`

```
cooperatives
├── id              UUID PK
├── name            VARCHAR(255) NOT NULL
├── description     TEXT
├── region          VARCHAR(100)
├── type            VARCHAR(50) DEFAULT 'cooperative'
├── created_by      UUID FK → users.id NOT NULL
├── settings        JSONB DEFAULT {}
├── created_at      TIMESTAMP DEFAULT NOW() NOT NULL
└── updated_at      TIMESTAMP DEFAULT NOW() NOT NULL
```

### 17. `cooperative_members`

```
cooperative_members
├── id              UUID PK
├── cooperative_id  UUID FK → cooperatives.id (CASCADE) NOT NULL
├── farm_id         UUID FK → farms.id (CASCADE) NOT NULL
├── role            VARCHAR(20) DEFAULT 'member'
├── joined_at       TIMESTAMP DEFAULT NOW() NOT NULL
└── UNIQUE (cooperative_id, farm_id)
```

### 18. `cooperative_invitations`

```
cooperative_invitations
├── id              UUID PK
├── cooperative_id  UUID FK → cooperatives.id (CASCADE) NOT NULL
├── invited_by      UUID FK → users.id NOT NULL
├── farm_id         UUID FK → farms.id (CASCADE) NOT NULL
├── token           VARCHAR(64) NOT NULL UNIQUE
├── expires_at      TIMESTAMP NOT NULL
├── accepted_at     TIMESTAMP
└── created_at      TIMESTAMP DEFAULT NOW() NOT NULL
```

### 19. `notifications`

> 📋 A implementer — cette table n'existe pas encore dans le code.

```
notifications (prevue)
├── id              UUID PK
├── user_id         UUID FK → users.id NOT NULL
├── farm_id         UUID FK → farms.id NOT NULL
├── type            VARCHAR(50) NOT NULL  -- stock_alert|calendar_alert|task_overdue|system
├── title           TEXT NOT NULL
├── message         TEXT NOT NULL
├── read_at         TIMESTAMPTZ
└── created_at      TIMESTAMPTZ DEFAULT NOW()
```

### 20. `transactions` (finance)

> Voir `src/server/db/schema/finance.ts`.

```
transactions
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── type            VARCHAR(20) NOT NULL  -- sale|purchase|expense|income
├── category        VARCHAR(50)
├── description     VARCHAR(500) NOT NULL
├── amount          DECIMAL(15,2) NOT NULL
├── date            TIMESTAMP NOT NULL
├── client_name     VARCHAR(255)
├── product_name    VARCHAR(255)
├── quantity        DECIMAL(15,4)
├── unit_price      DECIMAL(15,2)
├── unit            VARCHAR(20)
├── payment_method  VARCHAR(30)  -- cash|bank|mobile_money
├── status          VARCHAR(20) DEFAULT 'completed'  -- pending|completed|cancelled
├── notes           TEXT
├── data            JSONB DEFAULT {}
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

**INDEX** : `transactions_farm_id_idx`, `transactions_type_idx`, `transactions_date_idx`

### 21. `invoices` (finance)

> Voir `src/server/db/schema/finance.ts`.

```
invoices
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── invoice_number  VARCHAR(50) NOT NULL
├── type            VARCHAR(20) NOT NULL  -- devis|proforma|facture
├── client_name     VARCHAR(255) NOT NULL
├── client_email    VARCHAR(255)
├── client_phone    VARCHAR(30)
├── client_address  TEXT
├── items           JSONB DEFAULT []  -- [{productName, quantity, unitPrice, total}]
├── total_amount    DECIMAL(15,2) NOT NULL
├── tax_amount      DECIMAL(15,2) DEFAULT '0'
├── status          VARCHAR(20) DEFAULT 'draft'  -- draft|sent|paid|overdue|cancelled
├── issue_date      TIMESTAMP NOT NULL
├── due_date        TIMESTAMP
├── paid_at         TIMESTAMP
├── notes           TEXT
├── data            JSONB DEFAULT {}
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

**INDEX** : `invoices_farm_id_idx`, `invoices_type_idx`, `invoices_status_idx`

### 22. `journal_entries` (finance)

> Voir `src/server/db/schema/finance.ts`.

```
journal_entries
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── date            TIMESTAMP NOT NULL
├── label           VARCHAR(500) NOT NULL
├── debit           DECIMAL(15,2) DEFAULT '0'
├── credit          DECIMAL(15,2) DEFAULT '0'
├── category        VARCHAR(50)
├── account         VARCHAR(100)  -- ex: Caisse, Banque, Ventes, Achats
├── transaction_id  UUID FK → transactions.id
├── invoice_id      UUID FK → invoices.id
├── reference       VARCHAR(100)
├── notes           TEXT
└── created_at      TIMESTAMP DEFAULT NOW()
```

**INDEX** : `journal_entries_farm_id_idx`, `journal_entries_date_idx`

### 23. `marketplace_products` (marketplace)

> Voir `src/server/db/schema/marketplace.ts`.

```
marketplace_products
├── id                  UUID PK
├── farm_id             UUID FK → farms.id NOT NULL
├── seller_id           UUID FK → users.id NOT NULL
├── asset_id            UUID  -- lien optionnel vers un asset de type "product"
├── name                VARCHAR(255) NOT NULL
├── description         TEXT
├── category            VARCHAR(50) NOT NULL  -- cereales|legumes|fruits|tubercules|oleagineux|autres
├── photo_url           VARCHAR(500)
├── price_per_kg        DECIMAL(15,2) NOT NULL
├── quantity_available  DECIMAL(15,2) NOT NULL
├── unit                VARCHAR(20) DEFAULT 'kg'
├── location            VARCHAR(255)  -- ex: "Dakar, SN"
├── is_bio              BOOLEAN DEFAULT false
├── is_published        BOOLEAN DEFAULT true
├── data                JSONB DEFAULT {}
├── created_at          TIMESTAMP DEFAULT NOW()
├── updated_at          TIMESTAMP DEFAULT NOW()
└── archived_at         TIMESTAMP  -- soft delete
```

**INDEX** : `marketplace_products_farm_id_idx`, `marketplace_products_category_idx`, `marketplace_products_is_published_idx`

### 24. `marketplace_orders` (marketplace)

> Voir `src/server/db/schema/marketplace.ts`.

```
marketplace_orders
├── id              UUID PK
├── product_id      UUID FK → marketplace_products.id NOT NULL
├── buyer_id        UUID FK → users.id NOT NULL
├── buyer_farm_id   UUID FK → farms.id NOT NULL
├── seller_farm_id  UUID FK → farms.id NOT NULL
├── quantity        DECIMAL(15,2) NOT NULL
├── unit_price      DECIMAL(15,2) NOT NULL
├── total_amount    DECIMAL(15,2) NOT NULL
├── status          VARCHAR(20) DEFAULT 'pending' NOT NULL  -- pending|confirmed|shipped|delivered|cancelled
├── delivery_address TEXT
├── delivery_method VARCHAR(30)  -- pickup|delivery
├── notes           TEXT
├── data            JSONB DEFAULT {}
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

**INDEX** : `marketplace_orders_product_id_idx`, `marketplace_orders_buyer_id_idx`, `marketplace_orders_seller_farm_id_idx`, `marketplace_orders_status_idx`

---

## Tables referentiel cultures (V3 — module cultures & rotation)

> Les tables ci-dessous sont implementees dans `src/server/db/schema/crop-families.ts`, `crops.ts`, `crop-varieties.ts`, `crop-rotation-rules.ts` et `seasons.ts`.

### 25b. `crop_families` (familles botaniques)

```
crop_families
├── id              UUID PK
├── code            VARCHAR(10) UNIQUE NOT NULL  -- ex: CER, LEG, MAR, FRU
├── name            VARCHAR(100) NOT NULL
├── description     TEXT
├── created_at      TIMESTAMPTZ DEFAULT NOW()
└── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**Seed** : 8 familles (Cereales, Legumineuses, Maraichage, Fruits, Oleagineux, Tubercules, Fibres, Cucurbitacees)

### 25c. `crops` (cultures referentielles)

```
crops
├── id                  UUID PK
├── code                VARCHAR(20) UNIQUE NOT NULL  -- ex: HVT, RIZ, ARA, TOM, OIG, MIL, SOR, NIE, PAT, MAN, COT, MAI
├── name_fr             VARCHAR(100) NOT NULL
├── name_en             VARCHAR(100)
├── name_wo             VARCHAR(100)          -- nom en Wolof (ex: dugub, bassi, gerté, tamaat)
├── family_id           UUID FK → crop_families.id
├── cycle_short_days    INTEGER               -- duree cycle court (jours)
├── cycle_long_days     INTEGER               -- duree cycle long (jours)
├── season_preference   JSONB DEFAULT []      -- ex: ['hivernage', 'contre_saison_froide']
├── data                JSONB DEFAULT {}
├── created_at          TIMESTAMPTZ DEFAULT NOW()
└── updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Seed** : 12 cultures senegalaises avec noms trilingues (FR/EN/WO) :

| Code | FR | WO | Famille |
|------|-----|-----|---------|
| MIL | Mil | Dugub | Cereales |
| SOR | Sorgho | Bassi | Cereales |
| RIZ | Riz | Malo | Cereales |
| MAI | Mais | Mbay | Cereales |
| ARA | Arachide | Gerté | Oleagineux |
| NIE | Niebe | Niebe | Legumineuses |
| HVT | Haricot vert | Haricot | Legumineuses |
| TOM | Tomate | Tamaat | Maraichage |
| OIG | Oignon | Soble | Maraichage |
| PAT | Patate douce | Pataas | Tubercules |
| MAN | Mangue | Mango | Fruits |
| COT | Coton | Coton | Fibres |

### 25d. `crop_varieties` (varietes par culture)

```
crop_varieties
├── id                      UUID PK
├── crop_id                 UUID FK → crops.id NOT NULL
├── code                    VARCHAR(30) UNIQUE NOT NULL
├── name                    VARCHAR(100) NOT NULL
├── cycle_days              INTEGER               -- duree cycle varietal (jours)
├── yield_potential_kg_ha   INTEGER               -- rendement potentiel (kg/ha)
├── characteristics         JSONB DEFAULT {}       -- ex: resistance, port, couleur
├── origin                  VARCHAR(100)
├── created_at              TIMESTAMPTZ DEFAULT NOW()
└── updated_at              TIMESTAMPTZ DEFAULT NOW()
```

### 25e. `seasons` (saisons/campagnes agricoles)

```
seasons
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── name            VARCHAR(100) NOT NULL     -- ex: 'Hivernage 2026'
├── type            ENUM season_type NOT NULL  -- hivernage|contre_saison_chaude|contre_saison_froide
├── start_date      DATE NOT NULL
├── end_date        DATE NOT NULL
├── year            INTEGER NOT NULL
├── status          VARCHAR(20) DEFAULT 'planning'  -- planning|active|completed
├── notes           TEXT
├── created_at      TIMESTAMPTZ DEFAULT NOW()
└── updated_at      TIMESTAMPTZ DEFAULT NOW()
```

### 25f. `crop_rotation_rules` (regles de rotation culturale)

```
crop_rotation_rules
├── id                  UUID PK
├── farm_id             UUID FK → farms.id     -- NULL = regle globale
├── previous_crop_id    UUID FK → crops.id NOT NULL
├── next_crop_id        UUID FK → crops.id NOT NULL
├── compatibility       ENUM rotation_compatibility NOT NULL  -- recommended|neutral|avoid|forbidden
├── reason              TEXT
├── min_interval_days   INTEGER               -- delai minimum entre 2 cultures
├── recommendation      TEXT
├── data                JSONB DEFAULT {}
├── created_at          TIMESTAMPTZ DEFAULT NOW()
└── updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Seed** : 9 regles de rotation senegalaises (ex: arachide → mil = recommended, mil → mil = avoid)

### Nouveaux enums (fichier `src/server/db/schema/enums.ts`)

| Enum | Valeurs |
|------|---------|
| `season_type` | `hivernage`, `contre_saison_chaude`, `contre_saison_froide` |
| `rotation_compatibility` | `recommended`, `neutral`, `avoid`, `forbidden` |

---

## NOUVELLES TABLES (V3 — feedback agronomes)

> Les tables `cultural_calendars` et `parcel_calendars` sont implementees dans `src/server/db/schema/calendars.ts`.

### 25. `cultural_calendars`

```
cultural_calendars
├── id              UUID PK
├── farm_id         UUID FK → farms.id NOT NULL
├── name            VARCHAR(255) NOT NULL
├── crop_type       VARCHAR(100) NOT NULL  -- ex: 'haricot_vert'
├── variety         VARCHAR(100)
├── stages          JSONB NOT NULL         -- voir structure ci-dessous
├── total_days      INTEGER                -- duree totale du cycle
├── notes           TEXT
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

**Structure JSONB `stages`** :
```json
[
  { "name": "Semis", "order": 1, "duration_days": 0, "actions": ["preparation_sol", "semis"] },
  { "name": "Levee", "order": 2, "duration_days": 7, "actions": ["comptage_densite"] },
  { "name": "Croissance vegetative", "order": 3, "duration_days": 25, "actions": ["desherbage", "fertilisation"] },
  { "name": "Floraison", "order": 4, "duration_days": 15, "actions": ["observation_ravageurs"] },
  { "name": "Fructification", "order": 5, "duration_days": 20, "actions": ["irrigation"] },
  { "name": "Maturite", "order": 6, "duration_days": 10, "actions": ["agreage_prerecolte"] },
  { "name": "Recolte", "order": 7, "duration_days": 7, "actions": ["recolte"] }
]
```

### 26. `parcel_calendars` (calendrier par parcelle)

```
parcel_calendars
├── id                      UUID PK
├── farm_id                 UUID FK → farms.id NOT NULL
├── asset_id                UUID FK → assets.id NOT NULL  -- la parcelle (type land)
├── calendar_id             UUID FK → cultural_calendars.id NOT NULL
├── sowing_date             DATE NOT NULL                 -- date de semis effective
├── expected_harvest_date   DATE                          -- date de recolte prevue (NOUVEAU)
├── actual_harvest_date     DATE                          -- date de recolte effective (NOUVEAU)
├── stage_statuses          JSONB DEFAULT []              -- voir structure ci-dessous
├── status                  VARCHAR(20) DEFAULT 'active'  -- active|completed|cancelled
├── notes                   TEXT
├── created_at              TIMESTAMP DEFAULT NOW()
└── updated_at              TIMESTAMP DEFAULT NOW()
```

**Structure JSONB `stage_statuses`** :
```json
[
  { "stage_name": "Semis", "expected_date": "2022-03-14", "actual_date": "2022-03-14", "status": "completed" },
  { "stage_name": "Levee", "expected_date": "2022-03-21", "actual_date": "2022-03-22", "status": "completed" },
  { "stage_name": "Floraison", "expected_date": "2022-04-18", "actual_date": null, "status": "pending" }
]
```

### 27. `observation_forms` (fiches d'observation generiques)

```
observation_forms
├── id              UUID PK
├── log_id          UUID FK → logs.id (CASCADE) NOT NULL
├── form_type       VARCHAR(50) NOT NULL  -- emergence_density|cultural_stage|pest_disease|pre_harvest_grading
├── asset_id        UUID FK → assets.id NOT NULL  -- parcelle observee
├── crop_type       VARCHAR(100)
├── variety         VARCHAR(100)
├── observer_id     UUID FK → users.id NOT NULL
├── supervisor_id   UUID FK → users.id      -- chef de ferme
├── observation_date DATE NOT NULL
├── start_time      TIME
├── end_time        TIME
├── observed_surface_ha DECIMAL(10,4)
├── form_data       JSONB NOT NULL          -- donnees specifiques au type de fiche
├── calculated       JSONB DEFAULT {}       -- resultats calcules automatiquement
├── observer_remarks TEXT
├── supervisor_remarks TEXT
├── created_at      TIMESTAMP DEFAULT NOW()
└── updated_at      TIMESTAMP DEFAULT NOW()
```

#### `form_data` pour `emergence_density` :
```json
{
  "num_repetitions": 10,
  "theoretical_density": 50000,
  "sample_area_m2": 1.0,
  "repetitions": [
    { "rep": 1, "plant_count": 120 },
    { "rep": 2, "plant_count": 84 },
    { "rep": 3, "plant_count": 113 },
    { "rep": 4, "plant_count": 113 },
    { "rep": 5, "plant_count": 110 },
    { "rep": 6, "plant_count": 97 },
    { "rep": 7, "plant_count": 105 },
    { "rep": 8, "plant_count": 97 },
    { "rep": 9, "plant_count": 114 },
    { "rep": 10, "plant_count": 137 }
  ]
}
```

#### `calculated` pour `emergence_density` :
```json
{
  "total_plants": 1090,
  "real_density_per_ha": 109000,
  "emergence_rate_pct": 218.0
}
```

#### `form_data` pour `pest_disease` :
```json
{
  "num_targets": 10,
  "treatment_threshold": 5.0,
  "observations": [
    {
      "pest_or_disease": "Chenilles frontaleres",
      "category": "ravageur",
      "targets": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      "total": 1,
      "pct_infested": 10.0
    },
    {
      "pest_or_disease": "Pucerons",
      "category": "ravageur",
      "targets": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "total": 0,
      "pct_infested": 0
    }
  ]
}
```

#### `form_data` pour `cultural_stage` :
```json
{
  "stage_reached": "Levee - 4eme decade",
  "date_reached": "2022-03-22"
}
```

#### `form_data` pour `pre_harvest_grading` :
```json
{
  "sample_size": 20,
  "total_lengths": { "gt_19cm": 20, "19_16cm": 0, "16_14cm": 0, "lt_14cm": 0, "total": 20 },
  "marketable_lengths": { "gt_19cm": 20, "19_16cm": 0, "16_14cm": 0, "lt_14cm": 0, "total": 20 },
  "marketable_pct": 100,
  "major_defects": [
    { "type": "degats_oiseaux", "count": 0, "pct": 0 },
    { "type": "degats_chenilles", "count": 3, "pct": 15 },
    { "type": "malformations", "count": 0, "pct": 0 },
    { "type": "mauvaise_fecondation", "count": 0, "pct": 0 }
  ],
  "total_defects_pct": 15,
  "maturity_index": {
    "mature_at_date": 20,
    "mature_at_forecast": 20,
    "immature": 0,
    "total": 20,
    "maturity_pct": 100
  },
  "estimated_yield_per_ha": 65000,
  "estimated_harvest_date": "2022-03-24"
}
```

---

## Diagramme des relations

```
farms ──N:M── users (via farm_members)
farms ──1:N── assets
farms ──1:N── logs
farms ──1:N── plans
farms ──1:N── inventory
farms ──1:N── taxonomies
farms ──1:N── cultural_calendars
farms ──1:N── parcel_calendars
farms ──1:N── seasons
farms ──1:N── crop_rotation_rules (farm_id nullable — NULL = regle globale)
farms ──1:N── transactions
farms ──1:N── invoices
farms ──1:N── journal_entries
farms ──1:N── marketplace_products
farms ──N:M── cooperatives (via cooperative_members)

assets ──N:M── logs (via log_assets)
assets ──1:N── assets (parent_id self-ref)

logs ──1:N── quantities
logs ──N:M── plans (via plan_logs)
logs ──1:N── observation_forms

cultural_calendars ──1:N── parcel_calendars
assets (land) ──1:N── parcel_calendars

crop_families ──1:N── crops
crops ──1:N── crop_varieties
crops ──1:N── crop_rotation_rules (previous_crop_id)
crops ──1:N── crop_rotation_rules (next_crop_id)

users ──1:N── observation_forms (observer_id)
users ──1:N── revisions
users ──1:N── marketplace_products (seller_id)
users ──1:N── marketplace_orders (buyer_id)

marketplace_products ──1:N── marketplace_orders
transactions ──1:N── journal_entries
invoices ──1:N── journal_entries

farms ──1:N── notifications (📋 a implementer)
users ──1:N── notifications (📋 a implementer)
```

---

*La source de verite est le code Drizzle dans `src/server/db/schema/`. Ce fichier documente le schema et signale les migrations prevues. En cas de divergence, le code fait foi.*
