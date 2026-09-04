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

## Screenshots V2 (design de reference)

Les screenshots de la V2 Next.js sont dans `/Users/yusper/Downloads/SENAGROS FARMOS/` :

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
