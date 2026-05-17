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
