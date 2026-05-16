# spec/controllers/backend/interventions_controller_spec.rb
require 'rails_helper'

RSpec.describe Backend::InterventionsController, type: :controller do
  let(:user) { create(:user) }

  before do
    sign_in user
    request.headers['X-Inertia']         = 'true'
    request.headers['X-Inertia-Version'] = '1'
  end

  describe 'GET #index' do
    it 'répond 200' do
      get :index
      expect(response).to have_http_status(:ok)
    end

    it 'retourne du JSON (réponse Inertia)' do
      get :index
      expect(response.content_type).to include('application/json')
    end

    it 'rend le composant Inertia Backend/Interventions/Index' do
      get :index
      body = JSON.parse(response.body)
      expect(body['component']).to eq('Backend/Interventions/Index')
    end

    it 'expose les clés de props attendues' do
      get :index
      props = JSON.parse(response.body)['props']
      expect(props.keys).to include('interventions', 'kanban', 'map_geojson', 'filters', 'meta')
    end

    it 'expose un kanban avec les 4 colonnes' do
      get :index
      kanban = JSON.parse(response.body)['props']['kanban']
      expect(kanban.keys).to match_array(%w[planned in_progress done validated])
    end

    it 'expose un map_geojson de type FeatureCollection' do
      get :index
      map = JSON.parse(response.body)['props']['map_geojson']
      expect(map['type']).to eq('FeatureCollection')
      expect(map['features']).to be_an(Array)
    end

    it 'expose les filtres courants dans les props' do
      get :index, params: { state: 'done' }
      filters = JSON.parse(response.body)['props']['filters']
      expect(filters['state']).to eq('done')
    end

    it 'expose la pagination dans meta' do
      get :index
      meta = JSON.parse(response.body)['props']['meta']
      expect(meta.keys).to include('total', 'page', 'per_page', 'procedures')
    end

    context 'avec des interventions existantes' do
      let!(:intervention_done)    { create(:intervention, nature: :record, state: :done) }
      let!(:intervention_request) { create(:intervention, nature: :request) }

      it 'filtre les interventions par état' do
        get :index, params: { state: 'done' }
        interventions = JSON.parse(response.body)['props']['interventions']
        expect(interventions.all? { |i| i['state'] == 'done' }).to be true
      end

      it 'filtre les interventions par nature' do
        get :index, params: { nature: 'request' }
        interventions = JSON.parse(response.body)['props']['interventions']
        expect(interventions.all? { |i| i['nature'] == 'request' }).to be true
      end
    end
  end
end
