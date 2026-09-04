# 10 - Current Issues

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
- **Solution** : Acceptable si Zod est systematique. Ajouter des CHECK constraints PostgreSQL si critique
- **Statut** : Accepte comme pattern

### ISS-008 : Tests E2E a re-ecrire
- **Priorite** : P1
- **Description** : Les tests E2E de la V2 existent mais devront etre recrits pour le rebuild
- **Solution** : Playwright suite recrite au fur et a mesure des phases
- **Statut** : En cours

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
