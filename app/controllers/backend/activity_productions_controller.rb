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
  class ActivityProductionsController < Backend::BaseController
    manage_restfully(t3e: { name: :name }, creation_t3e: true, except: :index)

    unroll :rank_number, activity: :name, support: :name

    layout 'assets_injection_layout' if defined?(Planning)
    layout 'inertia', only: %i[index show new edit]

    def index
      scope = ActivityProduction
        .includes(:activity, :cultivable_zone, :campaign)
        .order(started_on: :desc)
        .page(params[:page]).per(25)

      # Ruby 2.6: no filter_map
      productions = scope.map do |prod|
        {
          'id'              => prod.id,
          'name'            => prod.name.to_s,
          'started_on'      => prod.started_on&.iso8601,
          'stopped_on'      => prod.stopped_on&.iso8601,
          'state'           => prod.state.to_s,
          'activity'        => prod.activity&.as_json(only: %i[id name family]),
          'cultivable_zone' => prod.cultivable_zone&.as_json(only: %i[id name]),
          'campaign'        => prod.campaign&.as_json(only: %i[id name harvest_year]),
          'can_destroy'     => prod.destroyable?
        }
      end

      render inertia: 'Backend/Productions/Index', props: {
        productions: productions,
        meta: {
          'total'    => scope.total_count,
          'page'     => (params[:page] || 1).to_i,
          'per_page' => 25
        }
      }
    end

    before_action only: %i[new edit update create] do
      @land_parcel_naming_format = NamingFormatLandParcel.includes(:fields).first
    end

    # List interventions for one production support
    list(:interventions, conditions: ["#{Intervention.table_name}.nature = ? AND interventions.id IN (SELECT activity_productions_interventions.intervention_id FROM activity_productions_interventions JOIN campaigns_interventions ON campaigns_interventions.intervention_id = activity_productions_interventions.intervention_id WHERE activity_production_id = ? AND campaigns_interventions.campaign_id = ?)", 'record', 'params[:id]'.c, 'current_campaign'.c], order: { created_at: :desc }, line_class: :status) do |t|
      t.column :name, url: true
      # t.status
      t.column :started_at
      t.column :human_working_duration
      t.column :human_target_names
      t.column :human_working_zone_area
      t.column :stopped_at, hidden: true
      t.column :issue, url: true
      # t.column :provisional
    end

    list(:plants, model: :plant, conditions: { activity_production_id: 'params[:id]'.c }, order: { name: :asc }, line_class: :status) do |t|
      t.column :name, url: true
      t.column :work_number, hidden: true
      t.column :variety
      t.column :work_name, through: :container, hidden: true, url: true
      t.column :net_surface_area, datatype: :measure
      t.status
      t.column :born_at
      t.column :dead_at
    end

    def show
      return unless @activity_production = find_and_check

      interventions = Intervention
        .joins(:activity_productions)
        .where(activity_productions: { id: @activity_production.id })
        .where(nature: 'record')
        .order(started_at: :desc)
        .limit(20)
        .map do |iv|
          {
            'id'         => iv.id,
            'name'       => iv.name.to_s,
            'started_at' => iv.started_at&.iso8601,
            'state'      => iv.state.to_s
          }
        end

      render inertia: 'Backend/Productions/Show', props: {
        can_destroy: @activity_production.destroyable?,
        production: {
          'id'                   => @activity_production.id,
          'name'                 => @activity_production.name.to_s,
          'custom_name'          => @activity_production.custom_name.to_s,
          'state'                => @activity_production.state.to_s,
          'started_on'           => @activity_production.started_on&.iso8601,
          'stopped_on'           => @activity_production.stopped_on&.iso8601,
          'usage'                => @activity_production.usage.to_s,
          'size_value'           => @activity_production.size_value.to_f,
          'size_indicator_name'  => @activity_production.size_indicator_name.to_s,
          'size_unit_name'       => @activity_production.size_unit_name.to_s,
          'irrigated'            => @activity_production.irrigated,
          'nitrate_fixing'       => @activity_production.nitrate_fixing,
          'rank_number'          => @activity_production.rank_number,
          'activity_id'          => @activity_production.activity_id,
          'activity_name'        => @activity_production.activity&.name.to_s,
          'activity_family'      => @activity_production.activity&.family.to_s,
          'cultivable_zone_id'   => @activity_production.cultivable_zone_id,
          'cultivable_zone_name' => @activity_production.cultivable_zone&.name.to_s,
          'campaign_id'          => @activity_production.campaign_id,
          'campaign_name'        => @activity_production.campaign&.name.to_s
        },
        interventions: interventions
      }
    end

    def new
      @activity_production = ActivityProduction.new
      render inertia: 'Backend/Productions/Form', props: {
        production:       nil,
        activities:       activity_production_activities,
        campaigns:        activity_production_campaigns,
        cultivable_zones: activity_production_cultivable_zones,
        errors:           {}
      }
    end

    def create
      @activity_production = ActivityProduction.new(permitted_production_params)
      if @activity_production.save
        redirect_to backend_activity_production_path(@activity_production), notice: 'Production créée avec succès.'
      else
        render inertia: 'Backend/Productions/Form', props: {
          production:       production_form_props(@activity_production),
          activities:       activity_production_activities,
          campaigns:        activity_production_campaigns,
          cultivable_zones: activity_production_cultivable_zones,
          errors:           production_errors(@activity_production)
        }, status: :unprocessable_entity
      end
    end

    def edit
      return unless @activity_production = find_and_check

      render inertia: 'Backend/Productions/Form', props: {
        production:       production_form_props(@activity_production),
        activities:       activity_production_activities,
        campaigns:        activity_production_campaigns,
        cultivable_zones: activity_production_cultivable_zones,
        errors:           {}
      }
    end

    def update
      return unless @activity_production = find_and_check

      if @activity_production.update(permitted_production_params)
        redirect_to backend_activity_production_path(@activity_production), notice: 'Production mise à jour.'
      else
        render inertia: 'Backend/Productions/Form', props: {
          production:       production_form_props(@activity_production),
          activities:       activity_production_activities,
          campaigns:        activity_production_campaigns,
          cultivable_zones: activity_production_cultivable_zones,
          errors:           production_errors(@activity_production)
        }, status: :unprocessable_entity
      end
    end

    def destroy
      return unless @activity_production = find_and_check

      if @activity_production.destroyable?
        @activity_production.destroy!
        redirect_to backend_activity_productions_path, notice: 'Production supprimée.'
      else
        redirect_to backend_activity_production_path(@activity_production),
                    alert: 'Impossible de supprimer : cette production a des interventions liées.'
      end
    end

    def traceability_xslx_export
      return unless @activity_production = find_and_check

      campaigns = @activity_production.campaigns
      InterventionExportJob.perform_later(activity_id: @activity_production.activity.id, activity_production_id: @activity_production.id, campaign_ids: campaigns.pluck(:id), user: current_user)
      notify_success(:document_in_preparation)
      redirect_to backend_activity_production_path(@activity_production)
    end

    def create_plants
      redirect = params[:redirect] || backend_activities_path
      if params[:activity_production_ids].blank? || params[:campaign_id].blank?
        notify_error_now(:no_production_defined_for_current_campaign)
        redirect_to redirect
      end
      productions = ActivityProduction.where(id: params[:activity_production_ids])
      campaign = Campaign.find(params[:campaign_id])
      if productions.any?
        productions.each do |production|
          plant_creation_service = ActivityProductions::VinePlantBuilder.new(production, campaign)
          plant_creation_service.create_vine_plant_from_production
        end
        notify_success_now(:plants_created_from_vine_productions, count: productions.count)
      else
        notify_error_now(:no_production_defined_for_current_campaign)
      end
      redirect_to redirect
    end

    private

      def production_form_props(prod)
        {
          'id'                  => prod.id,
          'activity_id'         => prod.activity_id,
          'campaign_id'         => prod.campaign_id,
          'cultivable_zone_id'  => prod.cultivable_zone_id,
          'started_on'          => prod.started_on&.iso8601,
          'stopped_on'          => prod.stopped_on&.iso8601,
          'irrigated'           => prod.irrigated,
          'nitrate_fixing'      => prod.nitrate_fixing,
          'state'               => prod.state.to_s
        }
      end

      def activity_production_activities
        Activity.order(:name).map { |a| { 'id' => a.id, 'name' => a.name.to_s } }
      end

      def activity_production_campaigns
        Campaign.order(harvest_year: :desc).map { |c| { 'id' => c.id, 'name' => c.name.to_s } }
      end

      def activity_production_cultivable_zones
        CultivableZone.order(:name).map { |z| { 'id' => z.id, 'name' => z.name.to_s } }
      end

      def production_errors(prod)
        prod.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
      end

      def permitted_production_params
        params.require(:production).permit(:activity_id, :campaign_id, :cultivable_zone_id, :started_on, :stopped_on, :irrigated, :nitrate_fixing, :state)
      end

  end
end
