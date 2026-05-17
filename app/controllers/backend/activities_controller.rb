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
  class ActivitiesController < Backend::BaseController
    include InspectionViewable

    PLANT_FAMILY_ACTIVITIES = %w[plant_farming vine_farming].freeze

    unroll

    after_action :open_activity, only: :create, unless: -> { @activity.new_record? }

    list line_class: '(:success if RECORD.of_campaign?(current_campaign))'.c do |t|
      # t.action :show, url: {format: :pdf}, image: :print
      t.action :edit
      t.action :destroy, if: :destroyable?
      t.column :name, url: true
      t.column :nature
      t.column :family
      t.column :with_cultivation
      t.column :cultivation_variety, hidden: true
      t.column :with_supports
      t.column :support_variety, hidden: true
      t.column :isacompta_analytic_code, hidden: AnalyticSegment.where(name: 'activities').none?
    end

    def show
      return unless @activity = find_and_check

      productions = @activity.productions.includes(:cultivable_zone, :campaign).order(started_on: :desc).map do |p|
        {
          'id'                   => p.id,
          'name'                 => p.name.to_s,
          'state'                => p.state.to_s,
          'started_on'           => p.started_on&.iso8601,
          'stopped_on'           => p.stopped_on&.iso8601,
          'cultivable_zone_name' => p.cultivable_zone&.name.to_s,
          'campaign_name'        => p.campaign&.name.to_s
        }
      end

      render inertia: 'Backend/Activites/Show', props: {
        activite: {
          'id'                     => @activity.id,
          'name'                   => @activity.name.to_s,
          'description'            => @activity.description.to_s,
          'family'                 => @activity.family.to_s,
          'nature'                 => @activity.nature.to_s,
          'suspended'              => @activity.suspended,
          'production_cycle'       => @activity.production_cycle.to_s,
          'with_supports'          => @activity.with_supports,
          'with_cultivation'       => @activity.with_cultivation,
          'support_variety'        => @activity.support_variety.to_s,
          'cultivation_variety'    => @activity.cultivation_variety.to_s,
          'production_started_on'  => @activity.production_started_on&.iso8601,
          'production_stopped_on'  => @activity.production_stopped_on&.iso8601,
          'productions_count'      => productions.size
        },
        productions: productions
      }
    end

    manage_restfully except: %i[index show]

    layout 'inertia', only: [:index, :show]

    def index
      scope = Activity.order(:family, :name)

      render inertia: 'Backend/Activites/Index', props: {
        activites: scope.map { |a|
          {
            'id'        => a.id,
            'name'      => a.name.to_s,
            'family'    => a.family.to_s,
            'nature'    => a.nature.to_s,
            'suspended' => a.suspended
          }
        },
        meta: { total: scope.count }
      }
    end

    # Duplicate activity basing on campaign
    def duplicate
      source = if params[:source_campaign_id]
                 Campaign.find(params[:source_campaign_id])
               else
                 current_campaign.preceding
               end
      activity = Activity.find_by(id: params[:source_activity_id])

      new_campaign = Campaign.find_by(id: params[:campaign_id]) || current_campaign

      campaign_diff = new_campaign.harvest_year - source.harvest_year

      # Productions
      productions = ActivityProduction.of_campaign(source)
      productions = productions.of_activity(activity) if activity
      productions.each do |production|
        updates = { campaign: new_campaign }
        if production.started_on
          updates[:started_on] = production.started_on + campaign_diff.year
        end
        if production.stopped_on
          updates[:stopped_on] = production.stopped_on + campaign_diff.year
        end
        production.duplicate!(updates)
      end

      # Budgets
      budgets = ActivityBudget.of_campaign(source)
      budgets = budgets.of_activity(activity) if activity
      budgets.each do |budget|
        budget.duplicate!(budget.activity, new_campaign)
      end
      redirect_to params[:redirect] || { action: :index }
    end

    # add itk on all current campaign activities
    def add_itk_on_activities
      begin
        activities = Activity.of_campaign(current_campaign)
      rescue
        notify_error(:no_activities_present)
        return redirect_to(params[:redirect] || { action: :index })
      end
      if activities.any?
        ItkImportJob.perform_later(activity_ids: activities.pluck(:id), current_campaign: current_campaign, user: current_user)
      else
        notify_error(:no_activities_present)
        redirect_to(params[:redirect] || { action: :index })
      end
    end

    def compute_pfi_report
      campaign = Campaign.find_by(id: params[:campaign_id]) || current_campaign
      activities = if params[:id]
                     Activity.where(id: params[:id])
                   else
                     Activity.actives
                             .of_campaign(campaign)
                             .of_families(PLANT_FAMILY_ACTIVITIES)
                             .with_production_nature
                   end
      PfiReportJob.perform_later(campaign, activities.pluck(:id), current_user)
      notify_success(:document_in_preparation)
      redirect_path = params[:id] ? backend_activity_path(activities.first) : backend_activities_path
      redirect_to redirect_path
    end

    # List of productions for one activity
    list(:productions, model: :activity_production, conditions: { activity_id: 'params[:id]'.c, campaign_id: 'current_campaign'.c }, order: { started_on: :desc }) do |t|
      t.action :edit
      t.action :destroy
      t.column :name, url: true
      # t.column :campaign, url: true
      # t.column :product_nature, url: true
      t.column :human_support_shape_area
      t.column :state
      t.column :started_on
      t.column :stopped_on
    end

    # List of distribution for one activity
    list(:distributions, model: :activity_distributions, conditions: { activity_id: 'params[:id]'.c }) do |t|
      t.column :affectation_percentage, percentage: true
      t.column :main_activity, url: true
    end

    def generate_budget
      @activity = Activity.find(params[:id])
      budget = @activity.budgets.find_by(campaign: current_campaign)
      return if Preference.find_by(name: 'ItkImportJob_running').present?

      if @activity.technical_workflow(current_campaign).present? || ( ( @activity.vine_farming? || @activity.animal_farming? ) && @activity.technical_sequence.present? ) || ( @activity.auxiliary? && MasterBudget.of_family(@activity.family).any?)
        ItkImportJob.perform_later(activity_ids: [@activity.id], current_campaign: current_campaign, user: current_user)
      else
        notify_warning(:no_reference_budget_found)
        redirect_to action: :show
      end
    end

    def traceability_xslx_export
      return unless @activity = find_and_check

      campaigns = Campaign.where(id: params[:campaign_id])
      InterventionExportJob.perform_later(activity_id: @activity.id, campaign_ids: campaigns.pluck(:id), user: current_user)
      notify_success(:document_in_preparation)
      redirect_to backend_activity_path(@activity)
    end

    def global_costs_xslx_export
      return unless @activity = find_and_check

      campaigns = Campaign.where(id: params[:campaign_id])
      GlobalCostExportJob.perform_later(activity_id: @activity.id, campaign_ids: campaigns.pluck(:id), user: current_user)
      notify_success(:document_in_preparation)
      redirect_to backend_activity_path(@activity)
    end

    private

      def open_activity
        @campaign = Campaign.find_by(name: params[:campaign][:name])
        current_user.current_campaign = @campaign
        current_user.current_period = Date.new(@campaign.harvest_year).to_s
        @activity.budgets.find_or_create_by!(campaign: @campaign)
      end
  end
end
