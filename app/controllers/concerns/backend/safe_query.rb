# frozen_string_literal: true

module Backend
  module SafeQuery
    extend ActiveSupport::Concern

    # Nom de la société — jamais nil, ne crashe pas si aucune entity of_company.
    def safe_company_name(fallback: 'SenagrOS')
      Entity.of_company&.full_name || fallback
    rescue ActiveRecord::StatementInvalid, PG::Error
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
    rescue ActiveRecord::StatementInvalid, PG::Error
      { active: 0, scheduled: 0 }
    end

    # Surface totale des zones cultivables en hectares.
    def safe_area_ha
      CultivableZone
        .sum("ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2)")
        .to_f
    rescue ActiveRecord::StatementInvalid, PG::Error
      0.0
    end

    # Campagne courante sérialisée pour les props Inertia.
    # Pas de rescue : as_json ne peut pas lever d'erreur DB, nil est retourné si pas de campagne.
    def safe_campaign_json
      current_campaign&.as_json(only: %i[name started_on stopped_on])
    end

    # Nombre d'animaux vivants (dead_at IS NULL).
    def safe_animals_count
      Animal.where(dead_at: nil).count
    rescue ActiveRecord::StatementInvalid, PG::Error
      0
    end

    # Alertes dashboard : interventions en retard + animaux récemment décédés.
    # Ruby 2.6 compatible : pas de filter_map, pas de then, pas de yield_self.
    def safe_alerts
      overdue = Intervention.where(state: 'in_progress')
                            .where('started_at < ?', 7.days.ago)
                            .order(started_at: :asc)
                            .limit(5)
                            .select { |i| i.name.present? }
                            .map { |i|
                              days = ((Time.zone.now - i.started_at) / 86400).round
                              {
                                type: 'intervention_overdue',
                                label: i.name,
                                href: "/backend/interventions/#{i.id}",
                                detail: "commencée il y a #{days} jour#{days > 1 ? 's' : ''}"
                              }
                            }

      dead_animals = Animal.where('dead_at IS NOT NULL')
                           .where('dead_at >= ?', 30.days.ago)
                           .order(dead_at: :desc)
                           .limit(5)
                           .select { |a| a.name.present? }
                           .map { |a|
                             {
                               type: 'animal_dead',
                               label: a.name,
                               href: "/backend/animals/#{a.id}",
                               detail: "décédé le #{a.dead_at.to_date.strftime('%d/%m/%Y')}"
                             }
                           }

      overdue + dead_animals
    rescue ActiveRecord::StatementInvalid, PG::Error
      []
    end
  end
end
