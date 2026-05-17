# frozen_string_literal: true
require 'rails_helper'

RSpec.describe Backend::SafeQuery, type: :concern do
  let(:controller_class) do
    Class.new do
      include Backend::SafeQuery
      def current_campaign; nil; end
    end
  end
  let(:controller) { controller_class.new }

  describe '#safe_company_name' do
    context "quand aucune entity of_company n'existe" do
      it 'retourne le fallback sans crasher' do
        # receive_message_chain évite le chargement de la classe Entity (MasterLegalPosition manquant en test)
        allow(Entity).to receive_message_chain(:of_company).and_return(nil)
        expect(controller.safe_company_name).to eq('SenagrOS')
      end
    end

    context "quand l'entity existe" do
      it 'retourne le full_name' do
        entity = double('Entity', full_name: 'Ferme Demo')
        # receive_message_chain bypasse verify_partial_doubles sur la classe Entity
        allow(Entity).to receive_message_chain(:of_company).and_return(entity)
        expect(controller.safe_company_name).to eq('Ferme Demo')
      end
    end
  end

  describe '#safe_intervention_counts' do
    context 'quand current_campaign est nil' do
      it 'retourne { active: 0, scheduled: 0 } sans requête DB' do
        expect(controller.safe_intervention_counts).to eq({ active: 0, scheduled: 0 })
      end
    end
  end

  describe '#safe_area_ha' do
    it 'retourne 0.0 si CultivableZone.sum lève une erreur' do
      allow(CultivableZone).to receive(:sum).and_raise(StandardError)
      expect(controller.safe_area_ha).to eq(0.0)
    end
  end

  describe '#safe_campaign_json' do
    it 'retourne nil si current_campaign est nil' do
      expect(controller.safe_campaign_json).to be_nil
    end
  end
end
