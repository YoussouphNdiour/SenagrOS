# 10 - Current Issues

> **Derniere mise a jour** : 2026-09-11

## Issues identifiees lors du feedback agronomes (2026-09-01)

### ISS-001 : Semis — champs manquants
- **Priorite** : P0
- **Description** : Le formulaire de semis ne contient pas :
  - Type de semis (manuel/machine)
  - Selection de la machine (dropdown)
  - Ecartement entre lignes (cm)
  - Ecartement entre plants (cm)
- **Solution** : Enrichir le schema `logs.data` pour type `seeding` + nouveau formulaire
- **Statut** : A implementer dans le rebuild

### ISS-002 : Intrants — pas de separation phyto/ferti/semence
- **Priorite** : P0
- **Description** : Tous les intrants sont dans un seul type `material` sans distinction
- **Solution** : Sous-categories avec UI separee (3 onglets) + gestion stock par categorie
- **Statut** : A implementer dans le rebuild

### ISS-003 : Calendrier cultural absent
- **Priorite** : P0
- **Description** : Pas de calendrier cultural avec stades, dates prevues/reelles, alertes
- **Solution** : Tables `cultural_calendars` + `parcel_calendars` + vue timeline
- **Statut** : A implementer dans le rebuild

### ISS-004 : Fiches d'observation absentes
- **Priorite** : P0
- **Description** : Pas de fiches terrain standardisees (densite, ravageurs, stades, agreage)
- **Solution** : Table `observation_forms` + 4 types de formulaires + calculs automatiques
- **Statut** : A implementer dans le rebuild

### ISS-005 : Assignation materiel aux activites
- **Priorite** : P0
- **Description** : Pas de lien machine → employe → activite
- **Solution** : Champs `equipment_ids` et `worker_ids` sur les logs + UI de selection
- **Statut** : A implementer dans le rebuild

## Issues techniques de la V2

### ISS-006 : Offline sync incomplet
- **Priorite** : P1
- **Description** : Le ServiceWorker cache les pages mais les mutations offline ne sont pas queuees
- **Solution** : Implementer une queue de sync avec IndexedDB
- **Statut** : A implementer

### ISS-007 : Pas de validation JSONB cote DB
- **Priorite** : P2
- **Description** : Les champs JSONB `data` n'ont pas de contraintes SQL — seule la validation Zod protege
- **Solution** : Acceptable si Zod est systematique. Ajouter des CHECK constraints PostgreSQL si critique (voir `06_decision_token.md` (Decision Tokens = registre des decisions d'architecture) et `16_decisions.md`)
- **Statut** : Accepte comme pattern

### ISS-008 : Tests E2E a re-ecrire
- **Priorite** : P1
- **Description** : Les tests E2E de la V2 existent mais devront etre recrits pour le rebuild
- **Solution** : Playwright suite recrite au fur et a mesure des phases
- **Statut** : En cours

### ISS-009 : Referentiel cultures manquant
- **Priorite** : P0
- **Description** : Pas de tables dediees pour les cultures, familles botaniques, varietes — tout etait en taxonomies generiques
- **Solution** : 3 nouvelles tables (crop_families, crops, crop_varieties) + router tRPC cropRouter + seed 12 cultures senegalaises
- **Statut** : Resolu (SESSION-010)

### ISS-010 : Pas de gestion des saisons/campagnes
- **Priorite** : P0
- **Description** : Pas de table pour suivre les campagnes agricoles (hivernage, contre-saison) par ferme
- **Solution** : Table `seasons` avec enum `season_type` et statuts planning/active/completed
- **Statut** : Resolu (SESSION-010)

### ISS-011 : Pas de regles de rotation culturale
- **Priorite** : P0
- **Description** : Aucune aide a la decision pour la succession des cultures sur une parcelle
- **Solution** : Table `crop_rotation_rules` avec 4 niveaux de compatibilite + seed 9 regles senegalaises + procedure `checkRotation`
- **Statut** : Resolu (SESSION-010)

### ISS-012 : Application intrant mono-produit
- **Priorite** : P0
- **Description** : Le schema input ne gerait qu'un seul produit par application, pas de melange de cuve
- **Solution** : Schema enrichi avec `products[]` (multi-produits), `weather` (conditions meteo), `target_parcel_ids` (multi-parcelles), 4 cards dans LogCreateForm
- **Statut** : Resolu (SESSION-010)

### ISS-013 : Parcelle sans details reseau d'irrigation
- **Priorite** : P1
- **Description** : Le champ `irrigation_type` sur les parcelles etait un simple texte sans details techniques
- **Solution** : Sous-objet `irrigation_network` dans le JSONB data avec 11 champs (source, type, debit, pompe, filtration, fertigation, condition)
- **Statut** : Resolu (SESSION-010)

### ISS-014 : Intrants sans doses homologuees ni organismes cibles
- **Priorite** : P1
- **Description** : Les intrants n'avaient pas de champs pour les doses min/max, DDR, organismes cibles, cultures autorisees
- **Solution** : 7 nouveaux champs sur le type material (ddr_days, dose_min, dose_max, dose_unit, max_applications_per_cycle, target_organisms[], target_crops[])
- **Statut** : Resolu (SESSION-010)

---

## Template pour nouvelles issues

```markdown
### ISS-XXX : [Titre]
- **Priorite** : P0|P1|P2
- **Description** : ...
- **Solution** : ...
- **Statut** : A implementer | En cours | Resolu | Accepte
```

---

*Ce fichier trace tous les problemes connus. Mettre a jour le statut a chaque session.*
