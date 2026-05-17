# frozen_string_literal: true

# La table lexicon.master_legal_positions n'existe pas dans la DB de test (schema lexicon vide).
# Entity tente MasterLegalPosition.pluck(:code) à class-load time (entity.rb:102).
# On monkey-patch MasterLegalPosition.pluck pour le contexte de test uniquement,
# AVANT que Entity soit autoloadé.
#
# Note : cette approche est nécessaire tant que le schema lexicon n'est pas peuplé en test.
# À supprimer une fois que db:seed ou une tâche d'import lexicon sera exécutée en CI.

module LexiconTestStub
  def pluck(*column_names)
    # Dans le contexte de test, si la table lexicon n'existe pas encore, on retourne vide.
    super
  rescue ActiveRecord::StatementInvalid => e
    raise unless e.message.include?("does not exist")

    []
  end
end

RSpec.configure do |config|
  config.before(:suite) do
    MasterLegalPosition.singleton_class.prepend(LexiconTestStub)
    Entity # Force la classe Entity à se charger maintenant, avec le stub actif.
    warn "[spec/support] Entity loaded OK (with lexicon stub)"
  rescue StandardError => e
    warn "[spec/support] eager_load_models warning : #{e.message.lines.first.chomp}"
  end
end
