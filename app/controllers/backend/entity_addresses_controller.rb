# == License
# Ekylibre - Simple agricultural ERP
# Copyright (C) 2008-2011 Brice Texier, Thibaud Merigon
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

module Backend
  class EntityAddressesController < Backend::BaseController
    manage_restfully except: %i[new create edit update show index]

    layout 'inertia', only: [:new, :edit]

    def show
      if @entity_address = EntityAddress.find_by(id: params[:id])
        redirect_to backend_entity_path(@entity_address.entity_id)
      else
        redirect_to backend_entities_path
      end
    end

    alias index show

    def new
      @entity = Entity.find(params[:entity_id])
      render inertia: 'Backend/Entites/AddressForm', props: {
        address:   nil,
        entity_id: @entity.id,
        errors:    {}
      }
    end

    def create
      @entity = Entity.find(params[:entity_id])
      @entity_address = EntityAddress.new(permitted_address_params.merge(entity: @entity))
      if @entity_address.save
        redirect_to backend_entity_path(@entity), notice: 'Adresse ajoutée.'
      else
        render inertia: 'Backend/Entites/AddressForm', props: {
          address:   address_form_props(@entity_address),
          entity_id: @entity.id,
          errors:    address_errors(@entity_address)
        }, status: :unprocessable_entity
      end
    end

    def edit
      return unless @entity_address = find_and_check
      @entity = @entity_address.entity
      render inertia: 'Backend/Entites/AddressForm', props: {
        address:   address_form_props(@entity_address),
        entity_id: @entity.id,
        errors:    {}
      }
    end

    def update
      return unless @entity_address = find_and_check
      @entity = @entity_address.entity
      if @entity_address.update(permitted_address_params)
        redirect_to backend_entity_path(@entity), notice: 'Adresse mise à jour.'
      else
        render inertia: 'Backend/Entites/AddressForm', props: {
          address:   address_form_props(@entity_address),
          entity_id: @entity.id,
          errors:    address_errors(@entity_address)
        }, status: :unprocessable_entity
      end
    end

    private

      def address_form_props(addr)
        {
          'id'           => addr.id,
          'canal'        => addr.canal.to_s,
          'coordinate'   => addr.coordinate.to_s,
          'mail_line_4'  => addr.mail_line_4.to_s,
          'mail_line_6'  => addr.mail_line_6.to_s,
          'mail_country' => addr.mail_country.to_s
        }
      end

      def address_errors(addr)
        addr.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
      end

      def permitted_address_params
        params.require(:entity_address).permit(
          :canal, :coordinate, :mail_line_4, :mail_line_6, :mail_country, :by_default
        )
      end
  end
end
