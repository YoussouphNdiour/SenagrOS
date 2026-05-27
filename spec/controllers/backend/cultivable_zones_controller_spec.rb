require 'rails_helper'

RSpec.describe Backend::CultivableZonesController, type: :controller do
  let(:user) { create(:user) }

  before do
    sign_in user
    request.headers['X-Inertia'] = 'true'
    request.headers['X-Inertia-Version'] = '1'
  end

  describe 'DELETE #destroy' do
    context 'when the parcelle is destroyable' do
      let(:zone) { instance_double(CultivableZone, id: 1, destroyable?: true) }

      before do
        allow(CultivableZone).to receive(:find_by).and_return(zone)
        allow(controller).to receive(:find_and_check).and_return(zone)
        allow(zone).to receive(:destroy!)
        controller.instance_variable_set(:@cultivable_zone, zone)
      end

      it 'destroys the record and redirects to index' do
        allow(zone).to receive(:destroy!).and_return(true)
        delete :destroy, params: { id: 1 }
        expect(zone).to have_received(:destroy!)
        expect(response).to redirect_to(backend_cultivable_zones_path)
        expect(flash[:notice]).to eq('Parcelle supprimée.')
      end
    end

    context 'when the parcelle is not destroyable' do
      let(:zone) { instance_double(CultivableZone, id: 1, destroyable?: false) }

      before do
        allow(controller).to receive(:find_and_check).and_return(zone)
        controller.instance_variable_set(:@cultivable_zone, zone)
      end

      it 'does not destroy and redirects to show with alert' do
        delete :destroy, params: { id: 1 }
        expect(response).to redirect_to(backend_cultivable_zone_path(zone))
        expect(flash[:alert]).to include('Impossible de supprimer')
      end
    end
  end
end
