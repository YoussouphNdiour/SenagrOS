# == License
# Ekylibre - Simple agricultural ERP
# Copyright (C) 2008-2013 David Joulin, Brice Texier
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
  class CultivableZonesController < Backend::BaseController
    layout 'inertia', only: %i[index show new edit]

    manage_restfully(t3e: { name: :name })

    def index
      # Ruby 2.6: no filter_map — use select + map
      zones = CultivableZone
        .select("id, name, ROUND((ST_Area(shape::geography) / 10000.0)::numeric, 2) AS area_ha, ST_AsGeoJSON(shape) AS geojson")
        .to_a

      parcelles = zones.map do |z|
        zone_obj = CultivableZone.find(z.id)
        z.as_json(only: %i[id name]).merge(
          'area_ha'     => z.area_ha&.to_f,
          'geojson'     => z.geojson,
          'can_destroy' => zone_obj.destroyable?
        )
      end

      render inertia: 'Backend/Parcelles/Index', props: {
        parcelles: parcelles,
        meta:      { total: parcelles.size }
      }
    end

    respond_to :pdf, :odt, :docx, :xml, :json, :html, :csv

    unroll

    list do |t|
      t.action :edit
      t.action :destroy, if: :destroyable?
      t.column :name, url: true
      t.column :work_number
      t.column :human_shape_area, datatype: :measure
      t.column :edge_length, datatype: :measure
      # FIXME: Remove use of "_name" for nomen columns
      t.column :production_system_name
      t.column :farmer, url: true
      t.column :owner, url: true
      t.column :city_name, hidden: true
      t.column :cap_number, hidden: true
    end

    # content production on current cultivable land parcel
    list(:productions, model: :activity_productions, conditions: { cultivable_zone_id: 'params[:id]'.c }, order: 'started_on DESC') do |t|
      t.column :name, url: true
      t.column :activity, url: true
      t.column :support, url: true
      t.column :usage
      t.column :grains_yield, datatype: :measure
      t.column :started_on
      t.column :stopped_on
    end

    # Show one cultivable zone with params_id
    def show
      return unless @cultivable_zone = find_and_check

      zone_data = CultivableZone
        .select("id, name, work_number, description, soil_nature, production_system_name, uuid, owner_id, farmer_id, created_at, ROUND((ST_Area(shape::geography)/10000.0)::numeric,2) AS area_ha, ST_AsGeoJSON(shape) AS geojson")
        .find(@cultivable_zone.id)

      productions = @cultivable_zone.activity_productions.map do |p|
        {
          'id'         => p.id,
          'name'       => p.name.to_s,
          'state'      => p.state.to_s,
          'started_on' => p.started_on&.iso8601,
          'stopped_on' => p.stopped_on&.iso8601
        }
      end

      render inertia: 'Backend/Parcelles/Show', props: {
        parcelle: {
          'id'                     => zone_data.id,
          'name'                   => zone_data.name.to_s,
          'work_number'            => zone_data.work_number.to_s,
          'description'            => zone_data.description.to_s,
          'soil_nature'            => zone_data.soil_nature.to_s,
          'production_system_name' => zone_data.production_system_name.to_s,
          'area_ha'                => zone_data.area_ha ? zone_data.area_ha.to_f : nil,
          'geojson'                => zone_data.geojson,
          'owner_name'             => @cultivable_zone.owner&.full_name.to_s,
          'farmer_name'            => @cultivable_zone.farmer&.full_name.to_s,
          'created_at'             => @cultivable_zone.created_at&.iso8601
        },
        productions: productions,
        can_destroy: @cultivable_zone.destroyable?
      }
    end

    def destroy
      return unless @cultivable_zone = find_and_check

      if @cultivable_zone.destroyable?
        @cultivable_zone.destroy!
        redirect_to backend_cultivable_zones_path, notice: 'Parcelle supprimée.'
      else
        redirect_to backend_cultivable_zone_path(@cultivable_zone),
                    alert: 'Impossible de supprimer : des productions sont associées à cette parcelle.'
      end
    end

    def new
      @cultivable_zone = CultivableZone.new
      render inertia: 'Backend/Parcelles/Form', props: {
        parcelle: nil,
        errors: {}
      }
    end

    def create
      @cultivable_zone = CultivableZone.new(permitted_cultivable_zone_params)
      if @cultivable_zone.save
        redirect_to backend_cultivable_zone_path(@cultivable_zone), notice: 'Parcelle créée avec succès.'
      else
        render inertia: 'Backend/Parcelles/Form', props: {
          parcelle: nil,
          errors: @cultivable_zone.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
        }, status: :unprocessable_entity
      end
    end

    def edit
      return unless @cultivable_zone = find_and_check

      render inertia: 'Backend/Parcelles/Form', props: {
        parcelle: {
          'id'          => @cultivable_zone.id,
          'name'        => @cultivable_zone.name.to_s,
          'description' => @cultivable_zone.description.to_s,
          'work_number' => @cultivable_zone.work_number.to_s
        },
        errors: {}
      }
    end

    def update
      return unless @cultivable_zone = find_and_check

      if @cultivable_zone.update(permitted_cultivable_zone_params)
        redirect_to backend_cultivable_zone_path(@cultivable_zone), notice: 'Parcelle mise à jour.'
      else
        render inertia: 'Backend/Parcelles/Form', props: {
          parcelle: {
            'id'          => @cultivable_zone.id,
            'name'        => @cultivable_zone.name.to_s,
            'description' => @cultivable_zone.description.to_s,
            'work_number' => @cultivable_zone.work_number.to_s
          },
          errors: @cultivable_zone.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
        }, status: :unprocessable_entity
      end
    end

    private

      def permitted_cultivable_zone_params
        params.require(:parcelle).permit(:name, :description, :work_number)
      end
  end
end
