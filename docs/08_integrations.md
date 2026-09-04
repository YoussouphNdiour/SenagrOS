# 08 - Integrations

## Integrations prevues

### 1. Meteo — ANACIM / Open-Meteo (P1)
- **Source** : API Open-Meteo (gratuite, pas de cle)
- **Alternative Senegal** : ANACIM (Agence Nationale de l'Aviation Civile et de la Meteorologie)
- **Donnees** : Temperature, humidite, precipitations, vent, ETP
- **Utilisation** : Widget dashboard, alertes meteo, historique parcelle
- **Implementation** : Route API proxy cote serveur, cache 30 min, TanStack Query cote client

### 2. Cartographie — OpenStreetMap / Stadia (P0)
- **Tiles** : OpenStreetMap (gratuit) ou Stadia Maps (gratuit jusqu'a 200k tiles/mois)
- **Satellite** : Esri World Imagery (gratuit pour usage non-commercial)
- **Cadastre** : DGID Senegal (si API disponible)
- **Implementation** : MapLibre GL JS, styles personnalisables

### 3. Capteurs IoT (P2)
- **Protocoles** : MQTT, LoRaWAN (via The Things Network)
- **Capteurs** : Humidite sol, temperature sol/air, pluviometre
- **Implementation** : Webhook endpoint, stockage time-series dans logs type `sensor_reading`

### 4. Export / Import (P1)
- **Export** : CSV, Excel (xlsx via SheetJS), PDF (via @react-pdf/renderer)
- **Import** : CSV avec mapping colonnes, validation Zod
- **Formats standards** : farmOS JSON (compatibilite), GeoJSON (parcelles)

### 5. SMS / Notifications (P2)
- **Orange Money API** : Notifications paiement (si marketplace)
- **Twilio / Africa's Talking** : SMS alertes (seuil stock, stade cultural en retard)
- **Web Push** : Notifications navigateur (PWA)

### 6. ERP — Odoo (P2)
- **Module** : `tsc_deposit_invoice` (developpe separement)
- **Sync** : API REST Odoo ← → SenagrOS pour factures, stock, comptabilite
- **Statut** : Projet separe, pas dans le rebuild initial

### 7. API publique (P2)
- **tRPC-openapi** : Generer une API REST OpenAPI depuis les routers tRPC
- **Auth** : API keys (table `api_keys` deja prevue)
- **Use case** : Integration bailleurs, dashboards externes, apps tierces

---

## Integrations NON prevues (hors scope)
- WhatsApp Business API (complexite, cout)
- Mobile money direct (necessite partenariat operateur)
- ERP SAP/Oracle (hors cible)
- Drones / imagerie satellite (P3+)

---

*Ce fichier liste les integrations externes. Chaque integration doit avoir un ticket avant implementation.*
