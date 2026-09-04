# 05 - UI Spec

## Design System — TailAdmin

### Palette de couleurs
- **Primaire** : Vert fonce (#1B5E20 → #2E7D32 → #4CAF50)
- **Accent** : Vert clair (#81C784)
- **KPI Card 1** : Vert degrade (#2E7D32 → #43A047)
- **KPI Card 2** : Vert clair (#66BB6A → #81C784)
- **KPI Card 3** : Orange (#F57C00 → #FFB74D)
- **KPI Card 4** : Bleu (#1565C0 → #42A5F5)
- **Background** : Gris clair (#F5F5F5)
- **Sidebar** : Blanc avec bordure
- **Texte** : Gris fonce (#212121)

### Typographie
- Font : System UI / Inter
- Titres : `text-xl font-semibold`
- Sous-titres : `text-sm text-gray-500`

### Composants UI existants (a reproduire)

| Composant | Fichier | Description |
|-----------|---------|-------------|
| `Button` | Button.tsx | Boutons primaire/secondaire/danger, variantes outline/solid |
| `Badge` | Badge.tsx | Labels colores (statut, type) |
| `Card` | Card.tsx | Conteneur avec shadow et padding |
| `KpiCard` | KpiCard.tsx | Carte KPI avec icone, valeur, label, fond colore |
| `DataTable` | DataTable.tsx | Table avec tri, recherche, pagination |
| `Modal` | Modal.tsx | Modale centree avec overlay |
| `ConfirmDialog` | ConfirmDialog.tsx | Modale de confirmation suppression |
| `Input` | Input.tsx | Champ texte avec label et erreur |
| `Select` | Select.tsx | Dropdown natif |
| `ComboboxAsync` | ComboboxAsync.tsx | Dropdown recherchable avec chargement async |
| `DatePicker` | DatePicker.tsx | Selecteur de date |
| `Textarea` | Textarea.tsx | Zone de texte multiligne |
| `FileUpload` | FileUpload.tsx | Upload de fichiers avec drag & drop |
| `SearchInput` | SearchInput.tsx | Champ de recherche avec icone |
| `Tabs` | Tabs.tsx | Onglets horizontaux |
| `Pagination` | Pagination.tsx | Navigation pages |
| `Breadcrumb` | Breadcrumb.tsx | Fil d'Ariane |
| `StateBadge` | StateBadge.tsx | Badge de statut colore (pending/done/cancelled) |
| `EmptyState` | EmptyState.tsx | Placeholder quand liste vide |
| `Toast` | Toast.tsx | Notification ephemere |
| `Dropdown` | Dropdown.tsx | Menu deroulant |
| `Sidebar` | Sidebar.tsx | Navigation laterale gauche |
| `Topbar` | Topbar.tsx | Barre superieure (FarmSwitcher, user, notifications) |
| `BottomNav` | BottomNav.tsx | Navigation mobile en bas |
| `DashboardShell` | DashboardShell.tsx | Layout principal (Sidebar + Topbar + content) |
| `OfflineBanner` | OfflineBanner.tsx | Bandeau "Hors ligne" |
| `FarmSwitcher` | FarmSwitcher.tsx | Selecteur de ferme dans la topbar |
| `RevisionHistory` | RevisionHistory.tsx | Historique des modifications |

---

## Layout principal

```
┌──────────────────────────────────────────────────┐
│  Topbar : Logo | FarmSwitcher | Acheteur/Producteur | User | Notifs │
├─────────┬────────────────────────────────────────┤
│         │                                        │
│ Sidebar │     Main Content Area                  │
│         │                                        │
│ PRINCIPAL│   ┌──────┐┌──────┐┌──────┐┌──────┐   │
│ Tableau  │   │ KPI  ││ KPI  ││ KPI  ││ KPI  │   │
│ de bord  │   │Card 1││Card 2││Card 3││Card 4│   │
│ Assistant│   └──────┘└──────┘└──────┘└──────┘   │
│ Diagnost.│                                        │
│ Messagerie│  ┌────────────────────────────────┐   │
│ Communaute│  │        DataTable / Content     │   │
│ Favoris   │  │                                │   │
│           │  └────────────────────────────────┘   │
│EXPLOITATION                                       │
│  > Cultures│                                      │
│  > Animaux │                                      │
│  > Parcelles│                                     │
│  > Stocks  │                                      │
│  > Taches  │                                      │
│VENTES&FIN. │                                      │
│  > Ventes  │                                      │
│  > Finances│                                      │
│  > Factur. │                                      │
│  > Compta  │                                      │
│PILOTAGE    │                                      │
│  > Rapports│                                      │
│  > Documents│                                     │
│  > Journal │                                      │
│SYSTEME     │                                      │
│  > Notifs  │                                      │
│  > Parametres│                                    │
├─────────┴────────────────────────────────────────┤
│  BottomNav (mobile) : Accueil | Cultures | + | Carte | Plus │
└──────────────────────────────────────────────────┘
```

---

## Pages et routes

### Auth
| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email + password |
| `/register` | Register | Inscription avec creation ferme |
| `/forgot-password` | ForgotPassword | Reset par email |

### Dashboard
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPI cards, graphique revenus/depenses, meteo, modules rapides, taches recentes |

### Assets
| Route | Page | Description |
|-------|------|-------------|
| `/assets` | AssetsList | Liste tous types avec filtres |
| `/assets/land` | LandList | Parcelles avec KPIs (total, surface, actives) |
| `/assets/plant` | PlantList | Cultures |
| `/assets/animal` | AnimalList | Animaux avec KPIs (total, sante, patrimoine) |
| `/assets/equipment` | EquipmentList | Parc materiel |
| `/assets/material` | MaterialList | Intrants (redirige vers vue separee phyto/ferti/semence) |
| `/assets/seed` | SeedList | Semences |
| `/assets/[id]` | AssetDetail | Fiche detail avec onglets |
| `/assets/[id]/edit` | AssetEdit | Edition |
| `/assets/new` | AssetNew | Creation |

### Intrants (NOUVEAU)
| Route | Page | Description |
|-------|------|-------------|
| `/intrants` | IntrantsOverview | Vue d'ensemble avec 3 onglets : Phyto / Ferti / Semences |
| `/intrants/phyto` | PhytoList | Liste phytosanitaires avec sous-categories |
| `/intrants/ferti` | FertiList | Liste fertilisants |
| `/intrants/semences` | SemenceList | Liste semences |
| `/intrants/[id]` | IntrantDetail | Fiche detail + historique stock |
| `/intrants/new` | IntrantNew | Creation avec selection categorie |

### Logs
| Route | Page | Description |
|-------|------|-------------|
| `/logs` | LogsList | Tous les logs avec filtres |
| `/logs/activity` | ActivityList | Activites |
| `/logs/seeding` | SeedingList | Semis |
| `/logs/observation` | ObservationList | Observations |
| `/logs/harvest` | HarvestList | Recoltes |
| `/logs/input` | InputList | Applications intrants |
| `/logs/[id]` | LogDetail | Detail du log |
| `/logs/[id]/edit` | LogEdit | Edition |
| `/logs/new` | LogNew | Creation (type selectionnable) |

### Observations terrain (NOUVEAU)
| Route | Page | Description |
|-------|------|-------------|
| `/observations` | ObservationsList | Liste de toutes les fiches d'observation |
| `/observations/density/new` | DensityForm | Formulaire densite de levee |
| `/observations/stage/new` | StageForm | Formulaire suivi stade cultural |
| `/observations/pest/new` | PestDiseaseForm | Formulaire maladies-ravageurs |
| `/observations/grading/new` | GradingForm | Formulaire agreage pre-recolte |
| `/observations/[id]` | ObservationDetail | Detail avec resultats calcules |

### Calendrier cultural (NOUVEAU)
| Route | Page | Description |
|-------|------|-------------|
| `/calendrier` | CalendarOverview | Vue timeline Gantt des parcelles |
| `/calendrier/templates` | TemplatesList | Modeles de calendrier par culture |
| `/calendrier/templates/new` | TemplateNew | Creer un modele |
| `/calendrier/assign` | AssignCalendar | Assigner un modele a une parcelle |

### Plans
| Route | Page | Description |
|-------|------|-------------|
| `/plans` | PlansList | Liste des plans/campagnes |
| `/plans/[id]` | PlanDetail | Detail avec logs associes |
| `/plans/[id]/edit` | PlanEdit | Edition |
| `/plans/new` | PlanNew | Creation |

### Carte
| Route | Page | Description |
|-------|------|-------------|
| `/map` | MapPage | Carte interactive MapLibre |

### Stocks
| Route | Page | Description |
|-------|------|-------------|
| `/stocks` | StockOverview | KPIs + inventaire par categorie |
| `/stocks/[assetId]` | StockDetail | Detail mouvements d'un article |

### Rapports
| Route | Page | Description |
|-------|------|-------------|
| `/reports` | ReportsOverview | Dashboard analytique |
| `/reports/assets` | AssetsReport | Rapport patrimoine |
| `/reports/logs` | LogsReport | Rapport activites |
| `/reports/harvests` | HarvestReport | Rapport recoltes |

### Finances
| Route | Page | Description |
|-------|------|-------------|
| `/finances` | FinancesOverview | Vue d'ensemble financiere |
| `/ventes` | VentesList | Ventes |
| `/facturation` | FacturationList | Factures |
| `/comptabilite` | ComptaList | Journal comptable |

### Autres
| Route | Page | Description |
|-------|------|-------------|
| `/productions` | Productions | Productions animales |
| `/taches` | Taches | Taches assignees |
| `/marketplace` | Marketplace | Vitrine produits |
| `/documents` | Documents | Gestion documentaire |
| `/notifications` | Notifications | Centre de notifications |
| `/journal` | Journal | Journal d'activite |
| `/support` | Support | Aide et support |
| `/profil` | Profil | Profil utilisateur |
| `/parametres` | Parametres | Parametres ferme |
| `/offline` | Offline | Page fallback hors ligne |

### Quick Actions
| Route | Page | Description |
|-------|------|-------------|
| `/quick` | QuickMenu | Menu saisie rapide |
| `/quick/harvest` | QuickHarvest | Saisie rapide recolte |
| `/quick/observation` | QuickObservation | Saisie rapide observation |
| `/quick/input` | QuickInput | Saisie rapide intrant |
| `/quick/irrigation` | QuickIrrigation | Saisie rapide irrigation |
| `/quick/birth` | QuickBirth | Saisie rapide naissance |

### Settings
| Route | Page | Description |
|-------|------|-------------|
| `/settings` | SettingsOverview | Profil |
| `/settings/farm` | FarmSettings | Parametres ferme |
| `/settings/users` | UsersSettings | Gestion utilisateurs |
| `/settings/taxonomies` | TaxonomiesSettings | Taxonomies configurables |
| `/settings/import-export` | ImportExport | Import/export donnees |
| `/settings/api-keys` | ApiKeys | Cles API |

---

## Patterns UI

### Page liste standard
```
[Breadcrumb]
[Titre page] [Sous-titre]                    [Role switcher] [+ Nouveau]

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ KPI1 │ │ KPI2 │ │ KPI3 │ │ KPI4 │     ← 4 KpiCards colorees
└──────┘ └──────┘ └──────┘ └──────┘

[SearchInput] [Filtres dropdowns]            [Export Excel] [Export PDF]

┌──────────────────────────────────────────┐
│ DataTable                                │
│ Colonnes triables, lignes cliquables     │
│ Actions : Voir, Editer, Supprimer        │
└──────────────────────────────────────────┘

[Pagination]
```

### Formulaire creation (Modal)
```
┌─────────────────────────────────────┐
│ [X]  Titre du formulaire            │
│                                     │
│ [Champ 1]         [Champ 2]        │
│ [Champ 3]                          │
│ [Select]          [DatePicker]      │
│ [Textarea]                          │
│                                     │
│              [Enregistrer]          │
└─────────────────────────────────────┘
```

### Fiche detail
```
[Breadcrumb]
[Titre] [StateBadge]                          [Editer] [Supprimer]

┌─────────────────┐  ┌────────────────────────┐
│ Infos principales│  │ Carte (si geometry)    │
│ Champs cles      │  │ MapLibre mini          │
└─────────────────┘  └────────────────────────┘

[Tabs: Infos | Logs | Fichiers | Historique]

[Contenu de l'onglet actif]
```

### Formulaire observation terrain (NOUVEAU)
```
┌──────────────────────────────────────────────┐
│ Fiche Densite de Levee                       │
│                                              │
│ Parcelle: [ComboboxAsync]   Culture: [Select]│
│ Variete:  [Select]          Date: [DatePicker]│
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Rep.  │  Nombre de plants               │ │
│ ├───────┼─────────────────────────────────┤ │
│ │   1   │  [Input number]                 │ │
│ │   2   │  [Input number]                 │ │
│ │  ...  │  ...                            │ │
│ │  10   │  [Input number]                 │ │
│ ├───────┼─────────────────────────────────┤ │
│ │ TOTAL │  [auto-calculé]                 │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Densite reelle: [auto] plts/ha               │
│ Taux de levee:  [auto] %                     │
│                                              │
│ Remarques observateur: [Textarea]            │
│ Remarques chef ferme:  [Textarea]            │
│                                              │
│ Heure debut: [Input] Heure fin: [Input]      │
│ Surface observee (ha): [Input]               │
│                                              │
│          [Enregistrer]                        │
└──────────────────────────────────────────────┘
```

### Calendrier cultural (NOUVEAU)
```
Vue Timeline (Gantt simplifie) :

Parcelle         | Jan | Fev | Mar | Avr | Mai | Jun | Jul |
─────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
P-01 Haricot     │     │ ███ │████████████│████ │     │     │
  Semis          │     │  ●  │           │     │     │     │
  Levee          │     │     │ ●         │     │     │     │
  Floraison      │     │     │       ●   │     │     │     │
  Recolte        │     │     │           │  ●  │     │     │
─────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
P-02 Oignon      │ ████│█████│████████████│█████│████ │     │
  ...            │     │     │           │     │     │     │

● = stade atteint (vert si a temps, orange si retard)
███ = duree du cycle
```

---

## Responsive

### Desktop (>1024px)
- Sidebar visible permanente
- 4 KPI cards en ligne
- DataTable complete

### Tablet (768-1024px)
- Sidebar collapsible
- 2 KPI cards par ligne
- DataTable avec scroll horizontal

### Mobile (<768px)
- Sidebar masquee (hamburger)
- BottomNav visible (5 icones)
- 1 KPI card par ligne ou 2 compactes
- DataTable en mode carte
- Formulaires plein ecran

---

*Ce fichier definit l'interface utilisateur complete. Les screenshots de la V2 dans `/SENAGROS FARMOS/*.png` servent de reference visuelle.*
