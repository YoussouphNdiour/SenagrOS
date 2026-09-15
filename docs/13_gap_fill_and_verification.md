# 13 - Gap Fill & Verification

## Ce qui existe dans la V2 et doit etre reproduit

| Fonctionnalite | V2 Status | Rebuild Status |
|---------------|-----------|----------------|
| Auth (login/register/logout) | OK | Done (Phase 0) |
| Multi-ferme + FarmSwitcher | OK | Done (Phase 0) |
| CRUD Assets (12 types) | OK | Done (Phase 1) |
| CRUD Logs (12 types) | OK | Done (Phase 2) |
| Carte MapLibre | OK | Done (Phase 1) |
| Plans/Campagnes | OK | Done (Phase 6) |
| Inventaire/Stock | OK | Done (Phase 3) |
| Rapports (4 types) | OK | Done (Phase 7) |
| DataTable avec tri/recherche/pagination | OK | Done (Phase 0) |
| KPI cards colorees | OK | Done (Phase 0) |
| Sidebar navigation | OK | Done (Phase 0) |
| BottomNav mobile | OK | Done (Phase 0) |
| Quick actions (5 types) | OK | A faire (Phase 10) |
| Cooperatives | OK | A faire (P1 — Phase 11) |
| API Keys | OK | A faire (P2) |
| Revisions history | OK | A faire |
| File uploads | OK | A faire |
| PWA/ServiceWorker | Partiel | A faire (Phase 9) |
| i18n FR/EN/WO | OK | A faire (Phase 10) |
| Notifications page | OK | A faire (Phase 10) |

## Ce qui MANQUE dans la V2 et doit etre AJOUTE

| Fonctionnalite | Source feedback | Priorite |
|---------------|----------------|----------|
| Type de semis (manuel/machine) | Agronomes | P0 |
| Ecartement lignes/plants | Agronomes | P0 |
| Selection machine pour semis | Agronomes | P0 |
| Intrants separes phyto/ferti/semence | Agronomes | P0 |
| Sous-categories intrants | Agronomes | P0 |
| Stock par intrant avec alertes | Agronomes | P0 |
| Fiche densite de levee | Fiche SCL | P0 |
| Fiche suivi stade cultural | Fiche SCL | P0 |
| Fiche maladies-ravageurs | Fiche SCL | P0 |
| Fiche agreage pre-recolte | Fiche SCL | P0 |
| Calendrier cultural par culture | Agronomes | P0 |
| Calendrier cultural par parcelle | Agronomes | P0 |
| Vue timeline Gantt | Agronomes | P0 |
| Alertes retard stade | Agronomes | P0 |
| Assignation machine→employe→activite | Agronomes | P0 |
| Referentiel cultures trilingues (FR/EN/WO) | Agronomes | P0 |
| Familles botaniques | Agronomes | P0 |
| Varietes par culture | Agronomes | P0 |
| Saisons/campagnes par ferme | Agronomes | P0 |
| Regles de rotation culturale | Agronomes | P0 |
| Reseau d'irrigation detaille (parcelle) | Agronomes | P1 |
| Intrants : doses homologuees, DDR, organismes cibles | Agronomes | P1 |
| Application intrant multi-produits (melange de cuve) | Agronomes | P0 |
| Conditions meteo lors d'application intrant | Agronomes | P0 |
| Dates recolte prevue/effective sur parcel_calendars | Agronomes | P0 |
| Sync offline queue (IndexedDB) | Technique | P1 |

## Verification checklist par phase

### Phase 0 : Scaffolding
- [ ] `pnpm dev` demarre sans erreur sur port 3000
- [ ] `pnpm db:migrate` applique le schema complet
- [ ] Login/Register fonctionnent
- [ ] Layout affiche sidebar + topbar + bottomnav mobile
- [ ] Composants UI de base rendus correctement
- [ ] `pnpm test` — au moins 10 tests de base passent
- [ ] `pnpm typecheck` — 0 erreur TypeScript
- [ ] `pnpm lint` — 0 erreur Biome

### Phase 1 : Assets
- [ ] Creer une parcelle avec tous les champs (code, surface, culture, dates, ecartements)
- [ ] Voir la parcelle sur la carte MapLibre
- [ ] Filtrer les assets par type
- [ ] Rechercher un asset par nom
- [ ] Paginer (25 par page)
- [ ] Archiver un asset (soft delete)
- [ ] 4 KPI cards avec bonnes valeurs

### Phase 2 : Logs & Semis
- [x] Creer un log de semis avec type=machine, machine selectionnee, ecartements remplis
- [x] Creer un log d'activite avec machine et employe assignes
- [x] Quantities ajoutees a un log
- [x] Filtrer logs par type et date

### Phase 3 : Intrants
- [ ] 3 onglets Phyto/Ferti/Semences visibles
- [ ] Creer un insecticide avec tous les champs
- [ ] Enregistrer une entree stock (achat)
- [ ] Enregistrer une sortie stock (application sur parcelle)
- [ ] Stock mis a jour automatiquement
- [ ] Alerte seuil affichee si stock < min

### Phase 4 : Observations
- [ ] Formulaire densite : 10 repetitions, calculs auto (total, densite/ha, % levee)
- [ ] Formulaire stade : dropdown stades, date atteinte
- [ ] Formulaire ravageurs : grille 10 cibles × N ravageurs, % et seuils
- [ ] Formulaire agreage : longueurs, defauts, maturite, calculs auto
- [ ] Export PDF d'une fiche

### Phase 5 : Calendrier
- [ ] Creer un template calendrier haricot vert avec 7 stades
- [ ] Assigner a une parcelle avec date de semis
- [ ] Vue timeline avec stades passes (vert), actuel (surbrillance), futurs (gris)
- [ ] Alerte si stade en retard

### Phase 6 : Plans & Campagnes — Done
- [x] Plans : CRUD + association logs
- [x] Suivi progression (barre done/total)

### Phase 7 : Rapports & Dashboard — Done
- [x] Dashboard : KPI, graphiques, meteo
- [x] Pages rapports (assets, logs, harvests)
- [x] Export Excel + PDF

### Phase 8 : Finances — Done
- [x] Finances : ventes, achats, comptabilite
- [x] Facturation (devis, pro forma, factures)
- [x] Tresorerie et journal comptable

### Phase 9 : Offline / PWA — A faire
- [ ] Offline : mutations queuees, sync au retour reseau

### Phase 10 : i18n & Polish — A faire
- [ ] i18n : toutes les pages en FR/EN/WO

---

## Comparaison avec les fiches SCL

| Champ fiche papier | Champ SenagrOS | Match |
|-------------------|----------------|-------|
| No Instruction | observation_forms.id (auto) | OK |
| Site | farms.name | OK |
| Ferme | — (alias du site) | OK |
| Ilot (Surface) | assets.data.code_parcelle + surface_ha | OK |
| Culture | observation_forms.crop_type | OK |
| Variete | observation_forms.variety | OK |
| Date plantation | assets.data.planting_date | OK |
| Date previsionnelle recolte | assets.data.expected_harvest_date | OK |
| Densite Semis | assets.data.density_plants_ha | OK |
| Repetition / Nombre plants | form_data.repetitions[] | OK |
| TOTAL | calculated.total_plants | Auto |
| Densite % | calculated.emergence_rate_pct | Auto |
| Date observation | observation_forms.observation_date | OK |
| Heure debut/fin | observation_forms.start_time / end_time | OK |
| Surface observee | observation_forms.observed_surface_ha | OK |
| Observateur | observation_forms.observer_id → users | OK |
| Remarques observateur | observation_forms.observer_remarks | OK |
| Remarques chef ferme | observation_forms.supervisor_remarks | OK |

---

*Ce fichier est la checklist de verification. Cocher apres chaque phase.*
