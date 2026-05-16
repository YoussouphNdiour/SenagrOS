# spec/controllers/backend/interventions_controller_spec.rb
require 'rails_helper'

RSpec.describe Backend::InterventionsController, type: :controller do
  let(:user) { create(:user) }

  before { sign_in user }

  describe 'GET #index' do
    let!(:intervention_done)     { create(:intervention, state: :done) }
    let!(:intervention_request)  { create(:intervention, :request) }
    let!(:intervention_rejected) { create(:intervention, state: :rejected) }

    context 'avec une requête Inertia (X-Inertia header)' do
      before { request.headers['X-Inertia'] = 'true' }

      it 'répond 200' do
        get :index
        expect(response).to have_http_status(:ok)
      end

      it 'retourne du JSON (réponse Inertia)' do
        get :index
        expect(response.content_type).to include('application/json')
      end

      it 'inclut le composant Interventions/Index' do
        get :index
        body = JSON.parse(response.body)
        expect(body['component']).to eq('Interventions/Index')
      end

      it 'expose les interventions non-rejetées' do
        get :index
        props = JSON.parse(response.body)['props']
        ids = props['interventions'].map { |i| i['id'] }
        expect(ids).to include(intervention_done.id, intervention_request.id)
        expect(ids).not_to include(intervention_rejected.id)
      end

      it 'filtre par state quand params[:state] est fourni' do
        get :index, params: { state: ['done'] }
        props = JSON.parse(response.body)['props']
        states = props['interventions'].map { |i| i['state'] }.uniq
        expect(states).to eq(['done'])
      end

      it 'expose les clés meta de pagination' do
        get :index
        props = JSON.parse(response.body)['props']
        expect(props['meta'].keys).to include('total_count', 'current_page', 'total_pages', 'per_page')
      end

      it 'expose les filters actuels' do
        get :index, params: { q: 'test' }
        props = JSON.parse(response.body)['props']
        expect(props['filters']['q']).to eq('test')
      end

      it 'expose la liste des activités' do
        get :index
        props = JSON.parse(response.body)['props']
        expect(props['activities']).to be_an(Array)
      end

      it 'sérialise les champs requis par le frontend' do
        get :index
        props = JSON.parse(response.body)['props']
        item = props['interventions'].first
        expect(item).to include('id', 'number', 'procedure_name', 'procedure_label',
                                'state', 'nature', 'started_at', 'stopped_at',
                                'working_duration', 'activities', 'human_target_names')
      end
    end

    context 'sans header Inertia' do
      it 'répond 200' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end
  end
end
