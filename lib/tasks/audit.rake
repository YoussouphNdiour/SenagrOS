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
        puts "WARNING  #{relative}"
        issues.each do |issue|
          puts "   Line #{issue[:line]}: #{issue[:content]}"
          puts "   -> #{issue[:message]}"
          puts
        end
        total_issues += issues.count
      else
        puts "OK  #{relative}"
      end
    end

    puts "\n=== Résultat : #{total_issues} problème(s) détecté(s) dans #{inertia_controllers.count} fichier(s) ===\n\n"

    # Exit non-zero pour bloquer la CI si des problèmes sont trouvés
    exit 1 if total_issues.positive? && ENV['CI']
  end
end
