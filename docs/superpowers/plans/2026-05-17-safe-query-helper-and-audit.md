# SafeQueryHelper + Rake Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer les crashes runtime dans les controllers Inertia en (A) centralisant les appels dangereux dans un module défensif, et (B) ajoutant une rake task d'audit statique à lancer avant chaque migration de module.

**Architecture:** Un concern `Backend::SafeQuery` inclus dans `Backend::BaseController` expose des helpers nil-safe pour `Entity.of_company`, `current_campaign`, et les scopes d'`Intervention`. Une rake task `audit:inertia_controllers` lit le source des controllers Inertia avec une regex et signale les patterns dangereux connus.

**Tech Stack:** Ruby on Rails 5.2, RSpec, Rake. Pas de gem supplémentaire.

---

## File Structure

| Fichier | Rôle |
|---|---|
| `app/controllers/concerns/backend/safe_query.rb` | Concern — helpers nil-safe pour tous les controllers Backend |
| `app/controllers/backend/base_controller.rb` | Modifié — `include Backend::SafeQuery` |
| `app/controllers/backend/dashboards_controller.rb` | Modifié — remplace appels bruts par helpers |
| `app/controllers/backend/interventions_controller.rb` | Modifié — remplace appels bruts par helpers |
| `lib/tasks/audit.rake` | Rake task — analyse statique des controllers Inertia |
| `spec/concerns/backend/safe_query_spec.rb` | Spec RSpec du concern |

---

### Task 1 : Concern `Backend::SafeQuery`

**Files:**
- Create: `app/controllers/concerns/backend/safe_query.rb`
- Test: `spec/concerns/backend/safe_query_spec.rb`

- [ ] **Step 1 : Écrire le test qui échoue**

```bash
mkdir -p spec/concerns/backend
```

```ruby
# spec/concerns/backend/safe_query_spec.rb
require 'rails_helper'

RSpec.describe Backend::SafeQuery, type: :concern do
  # Controller anonyme minimal qui inclut le concern
  let(:controller_class) do
    Class.new(Backend::BaseController) do
      include Backend::SafeQuery
      # Stub current_campaign pour les tests
      def current_campaign; nil; end
    end
  end
  let(:controller) { controller_class.new }

  describe '#safe_company_name' do
    context 'quand aucune entity of_company n\'existe' do
      it 'retourne le fallback sans crasher' do
        allow(Entity).to receive(:of_company).and_return(nil)
        expect(controller.safe_company_name).to eq('SenagrOS')
      end
    end

    context 'quand l\'entity existe' do
      it 'retourne le full_name' do
        entity = instance_double(Entity, full_name: 'Ferme Demo')
        allow(Entity).to receive(:of_company).and_return(entity)
        expect(controller.safe_company_name).to eq('Ferme Demo')
      end
    end
  end

  describe '#safe_intervention_counts' do
    context 'quand current_campaign est nil' do
      it 'retourne { active: 0, scheduled: 0 } sans lancer de requête' do
        expect(controller.safe_intervention_counts).to eq({ active: 0, scheduled: 0 })
      end
    end

    context 'quand une campaign existe' do
      it 'retourne les comptages réels' do
        campaign = instance_double(Campaign, id: 1)
        allow(controller).to receive(:current_campaign).and_return(campaign)
        active_rel   = instance_double(ActiveRecord::Relation, count: 3)
        scheduled_rel = instance_double(ActiveRecord::Relation, count: 5)
        allow(Intervention).to receive(:of_campaign).with(campaign).and_return(active_rel)
        allow(active_rel).to receive(:where).with(state: 'in_progress').and_return(active_rel)
        allow(active_rel).to receive(:where).with(nature: 'request').and_return(scheduled_rel)
        expect(controller.safe_intervention_counts).to eq({ active: 3, scheduled: 5 })
      end
    end
  end

  describe '#safe_area_ha' do
    it 'retourne 0.0 si aucune zone cultivable' do
      allow(CultivableZone).to receive(:sum).and_return(0)
      expect(controller.safe_area_ha).to eq(0.0)
    end
  end
end
```

- [ ] **Step 2 : Lancer le test — vérifier qu'il échoue**

```bash
bundle exec rspec spec/concerns/backend/safe_query_spec.rb --format documentation
```

Expected: `NameError: uninitialized constant Backend::SafeQuery`

- [ ] **Step 3 : Créer le concern**

```ruby
# app/controllers/concerns/backend/safe_query.rb
# frozen_string_literal: true

module Backend
  module SafeQuery
    extend ActiveSupport::Concern

    # Nom de la société — jamais nil, ne crashe pas si aucune entity of_company.
    def safe_company_name(fallback: 'SenagrOS')
      Entity.of_company&.full_name || fallback
    rescue StandardError
      fallback
    end

    # Comptages d'interventions pour le dashboard — retourne zéros si pas de campagne.
    def safe_intervention_counts
      return { active: 0, scheduled: 0 } unless current_campaign

      base = Intervention.of_campaign(current_campaign)
      {
        active:    base.where(state: 'in_progress').count,
        scheduled: base.where(nature: 'request').count
      }
    rescue StandardError
      { active: 0, scheduled: 0 }
    end

    # Surface totale des zones cultivables en hectares.
    def safe_area_ha
      CultivableZone
        .sum("ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2)")
        .to_f
    rescue StandardError
      0.0
    end

    # Campagne courante sérialisée pour les props Inertia.
    def safe_campaign_json
      current_campaign&.as_json(only: %i[name started_on stopped_on])
    end
  end
end
```

- [ ] **Step 4 : Relancer le test — vérifier qu'il passe**

```bash
bundle exec rspec spec/concerns/backend/safe_query_spec.rb --format documentation
```

Expected:
```
Backend::SafeQuery
  #safe_company_name
    quand aucune entity of_company n'existe
      retourne le fallback sans crasher
    quand l'entity existe
      retourne le full_name
  #safe_intervention_counts
    quand current_campaign est nil
      retourne { active: 0, scheduled: 0 } sans lancer de requête
  #safe_area_ha
    retourne 0.0 si aucune zone cultivable

4 examples, 0 failures
```

- [ ] **Step 5 : Commit**

```bash
git add app/controllers/concerns/backend/safe_query.rb spec/concerns/backend/safe_query_spec.rb
git commit -m "feat: add Backend::SafeQuery concern with nil-safe helpers"
```

---

### Task 2 : Inclure SafeQuery dans BaseController

**Files:**
- Modify: `app/controllers/backend/base_controller.rb:21-25`

- [ ] **Step 1 : Ajouter l'include**

Dans `app/controllers/backend/base_controller.rb`, après la ligne `include Autocomplete` (ligne ~21), ajouter :

```ruby
module Backend
  class BaseController < ::BaseController
    include Autocomplete
    include Backend::SafeQuery   # ← ajouter cette ligne
    prepend RespondWithTemplate
    # ... reste inchangé
```

- [ ] **Step 2 : Vérifier que le serveur démarre sans erreur**

```bash
bundle exec rails runner "puts Backend::BaseController.ancestors.include?(Backend::SafeQuery)"
```

Expected: `true`

- [ ] **Step 3 : Commit**

```bash
git add app/controllers/backend/base_controller.rb
git commit -m "feat: include Backend::SafeQuery in Backend::BaseController"
```

---

### Task 3 : Migrer DashboardsController vers SafeQuery

**Files:**
- Modify: `app/controllers/backend/dashboards_controller.rb:52-70`

- [ ] **Step 1 : Remplacer les appels bruts par les helpers**

Remplacer le bloc `render inertia:` dans `def home` (lignes 52–70) par :

```ruby
def home
  weather_data = Rails.cache.read('dashboard:weather')

  parcelles = CultivableZone
    .select("id, name, ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2) AS area_ha, ST_AsGeoJSON(shape) AS geojson")
    .map { |z| z.as_json(only: %i[id name]).merge('area_ha' => z.area_ha.to_f, 'geojson' => z.geojson) }

  recent = Intervention
    .order(started_at: :desc)
    .limit(5)
    .as_json(only: %i[id name state started_at])

  render inertia: 'Backend/Dashboard/Home', props: {
    kpis: {
      campaign:      safe_campaign_json,
      area_ha:       safe_area_ha,
      interventions: safe_intervention_counts,
      expenses_xof:  nil
    },
    parcelles:       parcelles,
    recent_activity: recent,
    weather:         weather_data,
    farm: {
      name:     safe_company_name,
      locale:   I18n.locale.to_s,
      timezone: Time.zone.name
    }
  }
end
```

- [ ] **Step 2 : Tester que le dashboard répond 200**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/backend
```

Expected: `HTTP 200` (après authentification — tester depuis le navigateur si la session est ouverte).

- [ ] **Step 3 : Commit**

```bash
git add app/controllers/backend/dashboards_controller.rb
git commit -m "refactor: use SafeQuery helpers in DashboardsController#home"
```

---

### Task 4 : Rake task `audit:inertia_controllers`

**Files:**
- Create: `lib/tasks/audit.rake`

- [ ] **Step 1 : Créer la rake task**

```ruby
# lib/tasks/audit.rake
# frozen_string_literal: true

namespace :audit do
  desc 'Analyse statique des controllers Inertia — signale les patterns dangereux'
  task inertia_controllers: :environment do
    require 'English'

    # Patterns qui causent des crashes en base vide ou campagne nil
    DANGEROUS_PATTERNS = [
      {
        regex: /Entity\.of_company\.[^&\s]/,
        message: "Entity.of_company appelé sans nil-safety (&.) — utiliser safe_company_name"
      },
      {
        regex: /Intervention\.of_campaign\([^)]+\)\.(in_progress|planned|running)\b/,
        message: "Scope enumerize non chaînable sur une relation — utiliser .where(state: 'in_progress') ou safe_intervention_counts"
      },
      {
        regex: /current_campaign\.(name|started_on|stopped_on|id)\b/,
        message: "current_campaign peut être nil — utiliser safe_campaign_json ou current_campaign&.X"
      },
      {
        regex: /\.(in_progress|planned)\.(count|all|first|last)\b/,
        message: "Scope potentiellement inexistant sur une relation — vérifier la définition sur le modèle"
      }
    ].freeze

    # Trouver les controllers avec render inertia:
    inertia_controllers = Dir.glob(Rails.root.join('app/controllers/**/*.rb')).select do |path|
      File.read(path).include?('render inertia:')
    end

    if inertia_controllers.empty?
      puts "Aucun controller Inertia trouvé."
      next
    end

    puts "\n=== Audit des #{inertia_controllers.count} controller(s) Inertia ===\n\n"

    total_issues = 0

    inertia_controllers.each do |path|
      relative = path.sub(Rails.root.to_s + '/', '')
      source = File.read(path)
      issues = []

      source.each_line.with_index(1) do |line, lineno|
        DANGEROUS_PATTERNS.each do |pattern|
          next unless line.match?(pattern[:regex])
          issues << { line: lineno, content: line.strip, message: pattern[:message] }
        end
      end

      if issues.any?
        puts "⚠️  #{relative}"
        issues.each do |issue|
          puts "   Line #{issue[:line]}: #{issue[:content]}"
          puts "   → #{issue[:message]}"
          puts
        end
        total_issues += issues.count
      else
        puts "✅ #{relative}"
      end
    end

    puts "\n=== Résultat : #{total_issues} problème(s) détecté(s) dans #{inertia_controllers.count} fichier(s) ===\n\n"

    # Exit non-zero pour bloquer la CI si des problèmes sont trouvés
    exit 1 if total_issues.positive? && ENV['CI']
  end
end
```

- [ ] **Step 2 : Lancer l'audit sur la base de code actuelle**

```bash
bundle exec rails audit:inertia_controllers
```

Expected : `✅ app/controllers/backend/dashboards_controller.rb` (après Task 3) et `✅ app/controllers/backend/interventions_controller.rb` si propre. Sinon la task liste les lignes à corriger.

- [ ] **Step 3 : Commit**

```bash
git add lib/tasks/audit.rake
git commit -m "feat: add rails audit:inertia_controllers rake task for static analysis"
```

---

### Task 5 : Corriger les patterns signalés par l'audit

> Cette task s'exécute APRÈS `rails audit:inertia_controllers` — corriger chaque problème signalé.

**Files:**
- Modify: tous les fichiers signalés par l'audit (ex. `app/controllers/backend/interventions_controller.rb`)

- [ ] **Step 1 : Lancer l'audit et noter chaque fichier/ligne**

```bash
bundle exec rails audit:inertia_controllers 2>&1 | tee /tmp/audit_report.txt
cat /tmp/audit_report.txt
```

- [ ] **Step 2 : Pour chaque `Entity.of_company.X` signalé — remplacer par le helper**

Remplacer les patterns comme :
```ruby
# AVANT (dangereux)
name: Entity.of_company.full_name
id:   Entity.of_company.id

# APRÈS (nil-safe)
name: safe_company_name
# Si besoin de l'id :
id: Entity.of_company&.id
```

- [ ] **Step 3 : Pour chaque `.in_progress` ou `.planned` signalé**

```ruby
# AVANT (dangereux — scope enumerize non chaînable)
Intervention.of_campaign(current_campaign).in_progress.count
Intervention.of_campaign(current_campaign).planned.count

# APRÈS (via helper)
safe_intervention_counts[:active]
safe_intervention_counts[:scheduled]
```

- [ ] **Step 4 : Relancer l'audit — vérifier 0 problème**

```bash
bundle exec rails audit:inertia_controllers
```

Expected:
```
=== Audit des N controller(s) Inertia ===

✅ app/controllers/backend/dashboards_controller.rb
✅ app/controllers/backend/interventions_controller.rb

=== Résultat : 0 problème(s) détecté(s) ===
```

- [ ] **Step 5 : Commit**

```bash
git add app/controllers/backend/
git commit -m "fix: apply SafeQuery helpers to all Inertia controllers flagged by audit"
```

---

## Utilisation quotidienne

Avant chaque migration d'un nouveau module vers Inertia, lancer :

```bash
bundle exec rails audit:inertia_controllers
```

Si la sortie contient des `⚠️`, corriger avant de pusher. En CI, la variable `CI=true` fait terminer la task avec exit code 1.
