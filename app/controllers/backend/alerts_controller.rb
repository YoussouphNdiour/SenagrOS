module Backend
  class AlertsController < Backend::BaseController
    layout 'inertia', only: [:index]

    SEVERITY_ORDER = { 'high' => 0, 'medium' => 1, 'low' => 2 }.freeze

    def index
      overdue = Intervention.where(state: 'in_progress')
                            .where('started_at < ?', 7.days.ago)
                            .order(started_at: :asc)
                            .limit(10)
                            .select { |i| i.name.present? }
                            .map { |i|
                              days = ((Time.zone.now - i.started_at) / 86_400).round
                              { id: i.id, type: 'intervention_overdue', label: i.name,
                                href: "/backend/interventions/#{i.id}",
                                detail: "commencée il y a #{days} jour#{days > 1 ? 's' : ''}",
                                severity: days > 14 ? 'high' : 'medium' }
                            }

      dead_animals = Animal.where('dead_at IS NOT NULL')
                           .where('dead_at >= ?', 30.days.ago)
                           .order(dead_at: :desc)
                           .limit(10)
                           .select { |a| a.name.present? }
                           .map { |a|
                             { id: a.id, type: 'animal_dead', label: a.name,
                               href: "/backend/animals/#{a.id}",
                               detail: "décédé le #{a.dead_at.to_date.strftime('%d/%m/%Y')}",
                               severity: 'medium' }
                           }

      departed_workers = Worker.where('dead_at IS NOT NULL')
                               .where('dead_at >= ?', 30.days.ago)
                               .order(dead_at: :desc)
                               .limit(10)
                               .select { |w| w.name.present? }
                               .map { |w|
                                 { id: w.id, type: 'worker_departed', label: w.name,
                                   href: "/backend/workers/#{w.id}",
                                   detail: "parti le #{w.dead_at.to_date.strftime('%d/%m/%Y')}",
                                   severity: 'low' }
                               }

      alertes = (overdue + dead_animals + departed_workers)
                  .sort_by { |a| SEVERITY_ORDER[a[:severity].to_s] || 99 }

      issues = Issue.where(state: 'opened')
                    .order(gravity: :desc)
                    .limit(10)
                    .map { |i|
                      {
                        id:          i.id,
                        name:        i.name,
                        nature:      i.nature.to_s,
                        gravity:     i.gravity.to_i,
                        observed_at: i.observed_at&.to_date&.iso8601,
                        state:       i.state.to_s
                      }
                    }

      render inertia: 'Backend/Alertes/Index', props: {
        alertes: alertes,
        counts: {
          intervention_overdue: overdue.size,
          animal_dead: dead_animals.size,
          worker_departed: departed_workers.size
        },
        issues: issues
      }
    rescue ActiveRecord::StatementInvalid, PG::Error => e
      Rails.logger.error("[AlertsController#index] DB error: #{e.message}")
      render inertia: 'Backend/Alertes/Index', props: {
        alertes: [],
        counts: { intervention_overdue: 0, animal_dead: 0, worker_departed: 0 },
        issues: []
      }
    end
  end
end
