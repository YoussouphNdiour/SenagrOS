# 12 - Appendix Sources & Files

## Fiches terrain de reference (SCL — Societe de Cultures Legumieres)

### Source : E@syFerme V5.21.51
Logiciel utilise par SCL pour generer les fiches d'instruction observation. Les fiches papier sont remplies sur le terrain puis ressaisies.

### Fiche 1 : Densite de levee
- **Type** : Obs. Agro. Densite levee
- **No Instruction** : 3879
- **Site** : DIAMA / Ferme DJAMA
- **Culture** : HARICOT VERT — variete Euforia
- **Ilot** : 2P5D2-5374 (2.30 ha)
- **Date plantation** : 14/03/2022
- **Date observation** : 22/03/2022 (10h00 → 10h33)
- **Surface observee** : 0.30 ha
- **Observateur** : Sokhna Dieng
- **Consignes** : 10 repetitions
- **Donnees** :
  | Rep | Plants | Rep | Plants |
  |-----|--------|-----|--------|
  | 1   | 120    | 2   | 84     |
  | 3   | 113    | 4   | 113    |
  | 5   | ~110   | 6   | —      |
  | 7   | 105    | 8   | 97     |
  | 9   | 114    | 10  | 137    |
- **Total** : 789 plants
- **Densite calculee** : 200 400 plts/ha
- **Densite Semis theorique** : 50 plants/ha (indique comme 227 622 dans le systeme)
- ⚠️ Donnees source a reconcilier — les valeurs de densite varient selon la methode de calcul (200 400 plts/ha vs 50 plants/ha vs 227 622 dans le systeme). Verifier les unites et la surface d'echantillonnage utilisees.

### Fiche 2 : Agreage qualite pre-recolte MAIS DOUX
- **Type** : Observations previsions de recolte — Agreage qualite pre-recolte
- **Campagne** : 2016-2017 (ref OMDS-V3-21/11/16)
- **Ferme** : Djama
- **Ilot/OP** : 2P3D3-2182
- **Observateur** : Sokhna Dieng
- **Date agreage** : 21/03/2022
- **Echantillon** : 20 epis
- **Resultats** :
  - Longueurs totales : 20 epis >19cm → Total 20
  - Longueurs valorisables : 20 epis >19cm → Total 20 (100%)
  - Defauts majeurs : Degats chenilles = 3 (15%)
  - Indice maturite : 100%
- **Commentaires** : "Vu l'agreage de la parcelle on a 15% de degats de chenilles, le rendement previsionnel est de 65 000 epis/ha, la date previsionnelle de recolte est le jeudi 24/03"

### Fiche 3 : Maladies-Ravageurs (Oignon)
- **Type** : Obs. Agro. Maladies-Ravageurs
- **No Instruction** : reference non lisible
- **Site** : DIAMA / Ferme DJAMA
- **Culture** : OIGNON — variete Red King
- **Ilot** : 2P4D-5255 (4.50 ha)
- **Date plantation** : 25/01/2022
- **Date observation** : 22/03/2022
- **Surface observee** : 4.5 ha
- **Observateur** : Sokhna Dieng
- **Consignes** : 10 cibles
- **Grille** : ~20 ravageurs/maladies × 10 cibles (B1-B10)
  - Categories : Chenilles frontaleres, Pucerons, Mouche blanche, Mouche du fruit, Mouche de nuit, Thrips, Mouches mineuses, Cicadelles, Acariens, Nematodes, Viroses, Fusariose, Mildiou, Oedium, Fonte de semis, Bacteriose, etc.
  - Seuil traitement : 5.00 pour chaque
  - Quelques presences notees sur Chenilles frontaleres

### Fiche 4 : Suivi stades culturaux (Oignon)
- **Type** : Obs. Agro. Suivi Stades Cult.
- **No Instruction** : 656571382
- **Site** : DIAMA / Ferme DJAMA
- **Culture** : OIGNON — variete Red King
- **Ilot** : 2P4D-5255 (4.50 ha)
- **Date plantation** : 25/01/2022
- **Date observation** : 22/03/2022 (8h30 → 9h01)
- **Surface observee** : 4.5 ha
- **Observateur** : Sokhna Dieng
- **Stade cultural** : Levee - 4eme decade
- **Stade atteint le** : 22-03-2022

---

## Fichiers source V3 — Module cultures, rotation, assets enrichis, logs enrichis

> Les fichiers ci-dessous correspondent aux ajouts V3 (referentiel cultures, rotation, enrichissements assets/logs).

### Schema base de donnees
| Fichier | Description |
|---------|-------------|
| `src/server/db/schema/crop-families.ts` | Table `crop_families` — familles botaniques |
| `src/server/db/schema/crops.ts` | Table `crops` — 12 cultures referencees (noms FR/EN/WO, cycles, saisons) |
| `src/server/db/schema/crop-varieties.ts` | Table `crop_varieties` — varietes par culture |
| `src/server/db/schema/crop-rotation-rules.ts` | Table `crop_rotation_rules` — regles de rotation culturale |
| `src/server/db/schema/seasons.ts` | Table `seasons` — campagnes agricoles par ferme |
| `src/server/db/schema/enums.ts` | Enums `season_type`, `rotation_compatibility` (ajouts) |

### Router et validateurs
| Fichier | Description |
|---------|-------------|
| `src/server/routers/crop.ts` | Router tRPC `cropRouter` — 12 procedures (familles, cultures, varietes, saisons, rotation) |
| `src/lib/validators/crop.validator.ts` | Schemas Zod pour le module cultures et rotation |

### Enrichissements assets et logs
| Fichier | Description |
|---------|-------------|
| `src/lib/validators/asset.validator.ts` | Enrichi : `irrigation_network` (parcelle), 7 nouveaux champs material (ddr_days, doses, organismes cibles...) |
| `src/lib/validators/log.validator.ts` | Enrichi : `inputDataSchema` (multi-parcelles, multi-produits, bouillie, meteo), `inputProductSchema`, `weatherConditionsSchema` |
| `src/server/db/schema/calendars.ts` | Enrichi : `expected_harvest_date`, `actual_harvest_date` sur `parcel_calendars` |
| `src/components/forms/AssetCreateForm.tsx` | Enrichi : bloc formulaire material avec 16 champs |
| `src/components/logs/LogCreateForm.tsx` | Enrichi : 4 cards application intrant (details, produits useFieldArray, bouillie, meteo avec warnings) |

---

## Screenshots V2 (design de reference)

> ⚠️ Les screenshots V2 originaux etaient dans un dossier local externe (dossier local source V2 — non versionne) qui n'est pas versionne dans le depot. Les captures disponibles dans le projet se trouvent dans `docs/guide/screenshots/`. Les fichiers sources V2 ci-dessous ne sont plus disponibles dans le repo.

Les screenshots de la V2 Next.js etaient dans le dossier local source V2 (dossier local source V2 — non versionne) :

| Fichier | Description |
|---------|-------------|
| `farmos-dashboard.png` | Dashboard principal — KPI cards (vert/orange/bleu), sidebar, meteo, modules rapides |
| `farmos-culture-form.png` | Modal "Nouvelle parcelle" — code, culture, surface, dates, statut, emplacement, rendement |
| `farmos-stocks.png` | Page stocks — 4 KPI cards (Articles, Stock OK, Alertes, Patrimoine), inventaire |
| `farmos-animaux.png` | Page animaux — 4 KPI cards, recherche, liste vide |
| `farmos-productions.png` | Productions animales — filtres, 5 KPI cards, onglets, graphiques |
| `farmos-animal-form.png` | Formulaire animal |
| `farmos-animal-new-form.png` | Formulaire nouvel animal |
| `farmos-stock-form.png` | Formulaire stock |
| `farmos-cultures.png` | Liste cultures |
| `farmos-ventes.png` | Page ventes |
| `farmos-finances.png` | Page finances |
| `farmos-taches.png` | Page taches |
| `farmos-marketplace.png` | Marketplace |
| `farmos-mes-produits.png` | Mes produits |
| `farmos-produits.png` | Produits |
| `farmos-facturation.png` | Facturation |
| `farmos-comptabilite.png` | Comptabilite |
| `farmos-rapports.png` | Rapports |
| `farmos-documents.png` | Documents |
| `farmos-notifications.png` | Notifications |
| `farmos-utilisateurs.png` | Utilisateurs |
| `farmos-profil.png` | Profil |
| `farmos-parametres.png` | Parametres |
| `farmos-journal.png` | Journal |
| `farmos-support.png` | Support |
| `login-result.png` | Page login |
| `register-result.png` | Page inscription |

### Pattern visuel a respecter
- **Sidebar gauche** : fond blanc, logo en haut, sections groupees (PRINCIPAL, EXPLOITATION, VENTES&FINANCES, PILOTAGE, SYSTEME)
- **Topbar** : switcher Acheteur/Producteur, bouton + Nouveau (vert), notifications
- **KPI cards** : 4 en ligne, degrade colore (vert → vert clair → orange → bleu), icone a droite
- **Listes** : DataTable avec recherche, fond blanc, bordures legeres
- **Formulaires** : Modal centre avec fond assombri, champs avec labels au-dessus
- **Bouton principal** : fond vert (#2E7D32), texte blanc, border-radius

---

*Ce fichier reference toutes les sources (fiches terrain, screenshots). Ne pas modifier les donnees source.*
