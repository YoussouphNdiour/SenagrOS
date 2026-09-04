# 02 - Features

## Legende priorites
- **P0** : MVP — indispensable au lancement
- **P1** : Post-MVP — a livrer dans les 2 mois suivants
- **P2** : Nice-to-have — roadmap future

---

## Module 1 : Authentification & Utilisateurs (P0)

### F1.1 — Inscription / Connexion
- Inscription par email + mot de passe
- Connexion avec session persistante (Auth.js v5)
- Mot de passe oublie (reset par email)
- Deconnexion

### F1.2 — Gestion des roles
- Roles : `owner`, `manager`, `worker`, `viewer`
- Owner : CRUD complet + parametres ferme
- Manager : CRUD sauf suppression ferme
- Worker : creation logs/observations, pas de suppression
- Viewer : lecture seule

### F1.3 — Profil utilisateur
- Nom, email, avatar, langue preferee (FR/EN/WO)
- Changement de mot de passe

---

## Module 2 : Gestion de la ferme (P0)

### F2.1 — Multi-ferme
- Un utilisateur peut posseder/gerer plusieurs fermes
- Switcher de ferme dans la topbar (FarmSwitcher)
- Chaque ferme : nom, description, coordonnees GPS, boundary (PostGIS), timezone, currency, locale, type de saison

### F2.2 — Cooperatives (P1)
- Regroupement de fermes
- Roles cooperative : admin, member
- Invitations par token
- Dashboard agregatif cooperative

---

## Module 3 : Assets / Patrimoine (P0)

### F3.1 — Types d'assets

| Type | Description | Champs specifiques (JSONB data) |
|------|-------------|--------------------------------|
| `land` | Parcelle / ilot | surface_ha, soil_type, irrigation_type, code_parcelle |
| `plant` | Culture en place | crop_type, variety, planting_date, expected_harvest_date, row_spacing_cm, plant_spacing_cm |
| `animal` | Animal individuel | species, breed, sex, birth_date, tag_id |
| `equipment` | Materiel agricole | equipment_type (tracteur/semoir/pulverisateur/...), brand, model, purchase_date, serial_number |
| `structure` | Batiment / serre | structure_type, capacity |
| `material` | Intrant stockable | **Voir Module 5 — Intrants** |
| `sensor` | Capteur IoT | sensor_type, protocol |
| `water` | Point d'eau | water_type, flow_rate |
| `seed` | Semence | crop_type, variety, lot_number, germination_rate, origin |
| `product` | Produit recolte | crop_type, grade, packaging |
| `compost` | Compost | compost_type, maturity_stage |
| `group` | Groupe (lot d'animaux, bloc parcelles) | group_type, member_ids |

### F3.2 — Hierarchie
- Asset parent → enfants (parcelle → sous-parcelle, batiment → salle)
- Arbre navigable

### F3.3 — Geometrie
- Polygones/points PostGIS pour parcelles
- Affichage sur carte MapLibre

### F3.4 — CRUD complet
- Liste avec filtres par type, statut, recherche
- Fiche detail avec onglets (infos, logs associes, carte, fichiers)
- Formulaire creation/edition en modal
- Archivage (soft delete via `archived_at`)

---

## Module 4 : Logs / Interventions (P0)

### F4.1 — Types de logs

| Type | Description | Champs specifiques |
|------|-------------|-------------------|
| `activity` | Activite generale | duration_hours, worker_ids |
| `observation` | Observation terrain | observation_type (densite/stade/ravageur/agreage), **voir Module 6** |
| `input` | Application intrant | input_type (phyto/ferti/semence), product_id, dose, unit, method |
| `harvest` | Recolte | yield_kg, quality_grade, destination |
| `seeding` | Semis | sowing_type (manual/machine), machine_id, seed_depth_cm, row_spacing_cm, plant_spacing_cm, seed_rate_kg_ha |
| `transplanting` | Repiquage | source_nursery, plant_age_days |
| `birth` | Naissance | mother_id, sex, weight_kg |
| `maintenance` | Maintenance equipement | equipment_id, maintenance_type, cost_xof |
| `medical` | Soin veterinaire | animal_id, treatment, veterinarian |
| `lab_test` | Analyse labo | sample_type, results |
| `movement` | Mouvement de stock | from_location, to_location, quantity |
| `irrigation` | Irrigation | method, duration_min, volume_liters |

### F4.2 — Semis enrichi (feedback agronomes)
- **Type de semis** : `manual` ou `machine`
- Si machine : selection de la machine (dropdown depuis assets type `equipment`)
  - Options disponibles : semoir, planteuse, semoir pneumatique...
  - Possibilite d'ajouter un nouveau type de machine
- **Profondeur de semis** (cm)
- **Ecartement entre lignes** (cm) — NOUVEAU
- **Ecartement entre plants** (cm) — NOUVEAU
- **Densite de semis** (plants/ha ou kg/ha)

### F4.3 — Assignation materiel
- Pour chaque log d'activite, on peut assigner :
  - Un ou plusieurs equipements (machine_ids)
  - Un ou plusieurs employes (worker_ids)
- Relation : activite → machine → employe

### F4.4 — Quantities
- Chaque log peut avoir N quantities (mesures)
- Quantity : value (numerator/denominator), unit, measure, label
- Adjustment inventaire : increment/decrement/reset sur un asset material

---

## Module 5 : Intrants — Phyto / Ferti / Semences (P0)

### F5.1 — Separation en 3 categories

#### Phytosanitaire (phyto)
Sous-categories :
- Herbicide
- Fongicide
- Insecticide
- Acaricide
- Nematicide
- Molluscicide
- Regulateur de croissance
- Adjuvant

Champs : nom_commercial, matiere_active, dose_recommandee, DAR (delai avant recolte), toxicite

#### Fertilisation (ferti)
Sous-categories :
- Engrais mineral (NPK, uree, DAP...)
- Engrais organique (fumier, compost, guano...)
- Amendement calcique
- Oligo-elements
- Biostimulant

Champs : composition_npk, forme (granule/liquide/poudre), dose_recommandee

#### Semences (semence)
Sous-categories :
- Semence certifiee
- Semence paysanne
- Plant / bouture
- Greffon

Champs : variete, lot_number, taux_germination, provenance, traitement_semence

### F5.2 — Gestion de stock par intrant
- Stock initial, entrees (achats, transferts), sorties (applications)
- Niveau d'alerte (seuil min)
- Historique mouvements
- Valorisation stock (quantite x prix unitaire)

---

## Module 6 : Fiches d'observation terrain (P0)

### F6.1 — Fiche Densite de levee
Inspiree de la fiche SCL "Obs. Agro. Densite levee" :
- Parcelle cible (asset land)
- Culture / variete
- Nombre de repetitions (defaut: 10)
- Pour chaque repetition : comptage nombre de plants
- **Calculs automatiques** :
  - Total plants
  - Densite reelle (plants/ha) = total / (nb_repetitions x surface_echantillon)
  - % de levee = (densite_reelle / densite_semis_theorique) x 100
- Date observation, heure debut/fin, surface observee
- Observateur (user)
- Remarques observateur + remarques chef de ferme

### F6.2 — Fiche Suivi stade cultural
Inspiree de la fiche SCL "Obs. Agro. Suivi Stades Cult." :
- Parcelle cible
- Culture / variete
- Stade cultural atteint (liste configurable) :
  - Semis, Levee, Tallage, Montaison, Epiaison, Floraison, Formation grain, Maturite laiteuse, Maturite physiologique, Senescence
  - Pour legumes : Germination, Cotyledons, Feuilles vraies, Ramification, Bouton floral, Floraison, Nouaison, Grossissement fruit, Veraison, Maturite
  - Decade (1ere, 2eme, 3eme, 4eme decade)
- Date stade atteint
- Date observation, heure debut/fin
- Remarques

### F6.3 — Fiche Maladies-Ravageurs
Inspiree de la fiche SCL "Obs. Agro. Maladies-Ravageurs" :
- Parcelle cible
- Culture / variete
- Nombre de cibles (defaut: 10, nommees B1 a B10)
- Grille d'observation :
  - **Categorie RAVAGEURS** : Chenilles frontaleres, Pucerons, Mouche blanche (aleurode), Mouche du fruit, Mouche de nuit, Thrips, Mouches mineuses, Cicadelles, Acariens, Nematodes
  - **Categorie MALADIES** : Autres viroses, Fusariose, Mildiou, Oedium, Fonte de semis, Virose, Bacteriose, Escargots, Graminales, Solanacees, Mouillant, Cochenilles
  - Chaque cellule : presence/absence ou comptage
- Pour chaque ravageur/maladie : total, % infeste, seuil de traitement
- Remarques observateur
- Preconisation traitement (remarques chef de ferme)

### F6.4 — Fiche Agreage qualite pre-recolte
Inspiree de la fiche SCL "Agreage qualite pre-recolte" :
- Parcelle cible
- Culture / variete
- Echantillon (defaut: 20 unites)
- **Longueurs totales** : comptage par classe (>19cm, 19-16cm, 16-14cm, <14cm)
- **Longueurs valorisables** : idem sans defauts de fecondation/malformation
- **% valorisable** = (valorisables / total) x 100
- **Defauts majeurs** : degats oiseaux, degats chenilles, malformations, mauvaise fecondation
  - Pour chaque defaut : comptage par classe de taille
  - % defauts = (total defauts / echantillon) x 100
- **Indice de maturite** : epis matures a la date / total, epis matures a la date previsionnelle, epis immatures
  - % maturite = (total matures / echantillon) x 100
- Commentaires (rendement previsionnel, date previsionnelle recolte)
- Visa observateur + visa chef de ferme

---

## Module 7 : Calendrier cultural (P0)

### F7.1 — Calendrier par culture/variete
- Definition des stades attendus par culture
- Duree moyenne de chaque stade (jours)
- Dates cibles calculees a partir de la date de semis

### F7.2 — Calendrier par parcelle
- Croise culture/variete + parcelle + date de semis effective
- Timeline visuelle (Gantt simplifie)
- Stades passes (coches), stade actuel (surbrillance), stades a venir

### F7.3 — Alertes calendrier
- Notification quand un stade est en retard vs prevision
- Rappel des actions a faire par stade (ex: desherbage a tallage)

---

## Module 8 : Parc materiel (P0)

### F8.1 — Catalogue machines
- Types : Tracteur, Semoir, Pulverisateur, Moissonneuse, Epandeur, Bineuse, Charrue, Remorque, Motopompe, Autre
- Fiche machine : nom, type, marque, modele, date achat, numero serie, photo
- Statut : disponible, en service, en maintenance, hors service

### F8.2 — Assignation activite
- Lors de la creation d'un log (activite, semis, input...) :
  - Selectionner machine(s) dans dropdown (filtree par type pertinent)
  - Selectionner employe(s) responsable(s)
- Historique d'utilisation par machine

---

## Module 9 : Plans / Campagnes (P0)

### F9.1 — Plan de culture
- Nom, saison, date debut/fin
- Association plan → logs
- Statut : actif, termine, annule

### F9.2 — Suivi plan
- Progression (logs completes / prevus)
- Budget previsionnel vs reel

---

## Module 10 : Carte interactive (P0)

- Affichage parcelles (polygones PostGIS) sur MapLibre
- Couleur par statut ou culture
- Popup au clic : infos parcelle, dernier log, lien vers fiche
- Layers : satellite, cadastre, OpenStreetMap

---

## Module 11 : Stocks & Inventaire (P0)

- Vue inventaire par categorie (phyto/ferti/semence/produit)
- Mouvements entrants (achats, transferts in) / sortants (applications, ventes, transferts out)
- Alertes seuil minimum
- Valorisation totale en FCFA

---

## Module 12 : Rapports & Tableaux de bord (P1)

- Dashboard principal : KPI cards (parcelles actives, patrimoine FCFA, revenus/depenses, meteo)
- Rapports par module : assets, logs, recoltes
- Export Excel / PDF
- Graphiques Recharts (evolution mensuelle, repartition par type)

---

## Module 13 : Finances (P1)

- Ventes, Achats, Facturation
- Comptabilite simplifiee (journal, grand livre)
- Tresorerie (caisses, banques)

---

## Module 14 : Marketplace (P2)

- Vitrine produits de la ferme
- Mode acheteur / producteur
- Commandes et suivi

---

## Module 15 : Fonctionnalites transversales (P0)

### F15.1 — Offline / PWA
- ServiceWorker avec cache-first pour les pages
- Queue de sync pour les mutations hors ligne
- OfflineBanner visible quand deconnecte
- Page `/offline` de fallback

### F15.2 — i18n
- Francais (defaut), English, Wolof
- Fichiers de traduction next-intl
- Switcher de langue dans le profil

### F15.3 — Notifications
- In-app notifications
- Alertes : seuil stock, stade cultural en retard, tache en retard

### F15.4 — Documents & Fichiers
- Upload fichiers attaches a tout entity (asset, log, plan)
- Photos terrain depuis le mobile
- Fichiers polymorphiques (entity_type + entity_id)

### F15.5 — Quick Actions (saisie rapide)
- Boutons raccourcis depuis le dashboard ou BottomNav mobile
- Quick harvest, quick observation, quick input, quick irrigation, quick birth

### F15.6 — Recherche globale
- Recherche assets, logs, plans par nom/type
- Resultats groupes par categorie

---

*Ce fichier est la liste exhaustive des fonctionnalites. Chaque module sera detaille dans les fichiers de spec correspondants (04_api_spec, 05_ui_spec).*
