require 'rails_helper'

RSpec.describe Backend::DashboardsController, type: :controller do
  let(:user) { create(:user) }

  before do
    sign_in user
    # Header X-Inertia → response JSON au lieu de HTML
    request.headers['X-Inertia'] = 'true'
    request.headers['X-Inertia-Version'] = '1'
    # Stub le cache météo pour éviter les appels réseau
    allow(Rails.cache).to receive(:read).with('dashboard:weather').and_return(nil)
    # Stub les modèles
    allow(CultivableZone).to receive(:select).and_return([])
    allow(CultivableZone).to receive(:sum).and_return(0.0)
    allow(Intervention).to receive_message_chain(:of_campaign, :in_progress, :count).and_return(0)
    allow(Intervention).to receive_message_chain(:of_campaign, :planned, :count).and_return(0)
    allow(Intervention).to receive_message_chain(:order, :limit, :as_json).and_return([])
    allow(Entity).to receive_message_chain(:of_company, :full_name).and_return('Ferme Test')
  end

  describe 'GET #home' do
    it 'retourne HTTP 200' do
      get :home
      expect(response).to have_http_status(:ok)
    end

    it 'rend le composant Inertia Backend/Dashboard/Home' do
      get :home
      data = JSON.parse(response.body)
      expect(data['component']).to eq('Backend/Dashboard/Home')
    end

    it 'expose les clés de props attendues' do
      get :home
      props = JSON.parse(response.body)['props']
      expect(props.keys).to include('kpis', 'parcelles', 'recent_activity', 'weather', 'farm')
    end

    it 'expose weather nil quand le cache est vide' do
      get :home
      props = JSON.parse(response.body)['props']
      expect(props['weather']).to be_nil
    end

    it 'expose farm.name' do
      get :home
      props = JSON.parse(response.body)['props']
      expect(props.dig('farm', 'name')).to eq('Ferme Test')
    end
  end
end
