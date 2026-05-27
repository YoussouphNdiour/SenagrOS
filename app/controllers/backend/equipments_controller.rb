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
  class EquipmentsController < Backend::MattersController
    layout 'inertia', only: %i[index show new edit]
    skip_before_action :check_variant_availability, only: :new

    # params:
    #   :q Text search
    #   :s State search
    #   :period Two Dates with _ separator
    #   :variant_id
    #   :activity_id
    def self.equipments_conditions
      code = ''
      code = search_conditions(products: %i[name work_number number description uuid],
                               product_nature_variants: [:name]) + " ||= []\n"
      code << "  if params[:variant_id].to_i > 0\n"
      code << "    c[0] << \" AND \#{ProductNatureVariant.table_name}.id = ?\"\n"
      code << "    c << params[:variant_id].to_i\n"
      code << "  end\n"

      # filter by activity_id
      code << "  if params[:activity_id].to_i > 0\n"
      code << "    c[0] << \" AND \#{Equipment.table_name}.id IN (SELECT target_id FROM target_distributions WHERE activity_id = ?)\"\n"
      code << "    c << params[:activity_id].to_i\n"
      code << "  end\n"

      code << "c\n"
      code.c
    end

    list(conditions: equipments_conditions, joins: :variants) do |t|
      t.action :edit
      t.action :destroy
      t.column :work_number, url: true
      t.column :name, url: true
      t.column :born_at
      t.column :variant, url: true
      t.column :nature, url: true
      t.status
      t.column :state, hidden: true
      t.column :container, url: true
      t.column :isacompta_analytic_code, hidden: AnalyticSegment.where(name: 'equipments').none?
    end

    list(:links, model: :product_link, conditions: { product_id: 'params[:id]'.c }) do |t|
      t.column :nature
      t.column :linked_id, url: { controller: 'backend/equipments', id: 'RECORD.linked_id'.c }, label_method: :linked_name
    end

    list(:catalog_items, conditions: { product_id: 'params[:id]'.c }) do |t|
      t.action :edit, url: { controller: '/backend/catalog_items' }
      t.action :destroy, url: { controller: '/backend/catalog_items' }
      t.column :name, url: { controller: '/backend/catalog_items' }
      t.column :unit
      t.column :amount, url: { controller: '/backend/catalog_items' }, currency: true
      t.column :all_taxes_included
      t.column :catalog, url: { controller: '/backend/catalogs' }
      t.column :started_at
      t.column :stopped_at
    end

    list(:interventions_on_field, model: :intervention_parameters, joins: :intervention, conditions: [
      "(interventions.nature = ?
        AND interventions.procedure_name != ?
        AND intervention_parameters.product_id = ?
       )
      OR
       (interventions.nature = ?
        AND interventions.procedure_name = ?
        AND intervention_parameters.product_id = ?
        AND intervention_parameters.type = ?
      )",
      'record', Procedo::Procedure.find(:equipment_maintenance).name, 'params[:id]'.c,
      'record', Procedo::Procedure.find(:equipment_maintenance).name, 'params[:id]'.c, 'InterventionTool'
    ]) do |t|
      t.column :intervention, url: true
      t.column :reference, label_method: :name, sort: :reference_name
      t.column :started_at, through: :intervention, datatype: :datetime
      t.column :stopped_at, through: :intervention, datatype: :datetime, hidden: true
      t.column :human_activities_names, through: :intervention
      t.column :actions, label_method: :human_actions_names, through: :intervention
      t.column :human_working_duration, through: :intervention
      t.column :human_working_zone_area, through: :intervention
    end

    list(:equipment_maintenance_interventions, model: :intervention_parameters, joins: :intervention, conditions: [
      "interventions.nature = ?
       AND interventions.procedure_name = ?
       AND intervention_parameters.product_id = ?
       AND intervention_parameters.type = ?",
      'record', Procedo::Procedure.find(:equipment_maintenance).name, 'params[:id]'.c, 'InterventionTarget'
    ]) do |t|
      t.column :intervention, url: true
      t.column :reference, label_method: :name, sort: :reference_name
      t.column :description, through: :intervention
      t.column :started_at, through: :intervention, datatype: :datetime
      t.column :stopped_at, through: :intervention, datatype: :datetime, hidden: true
      t.column :actions, label_method: :human_actions_names, through: :intervention
      t.column :human_working_duration, through: :intervention
    end

    def show
      return unless @equipment = find_and_check

      maintenance_procedure_name = Procedo::Procedure.find(:equipment_maintenance).name

      interventions = InterventionParameter
        .includes(:intervention)
        .where(product_id: @equipment.id, type: 'InterventionTool')
        .where("interventions.nature = ? AND interventions.procedure_name != ?",
               'record', maintenance_procedure_name)
        .order('interventions.started_at DESC')
        .limit(20)
        .map do |ip|
          {
            'id'         => ip.intervention.id,
            'name'       => ip.intervention.name.to_s,
            'started_at' => ip.intervention.started_at&.iso8601,
            'state'      => ip.intervention.state.to_s
          }
        end

      maintenances = InterventionParameter
        .includes(:intervention)
        .where(product_id: @equipment.id, type: 'InterventionTarget')
        .where("interventions.nature = ? AND interventions.procedure_name = ?",
               'record', maintenance_procedure_name)
        .order('interventions.started_at DESC')
        .limit(10)
        .map do |ip|
          {
            'id'          => ip.intervention.id,
            'description' => ip.intervention.description.to_s,
            'started_at'  => ip.intervention.started_at&.iso8601
          }
        end

      links = ProductLink.where(product_id: @equipment.id).map do |l|
        {
          'id'          => l.id,
          'nature'      => l.nature.to_s,
          'linked_name' => l.linked&.name.to_s
        }
      end

      render inertia: 'Backend/Equipements/Show', props: {
        can_destroy: @equipment.destroyable?,
        equipement: {
          'id'                    => @equipment.id,
          'name'                  => @equipment.name.to_s,
          'work_number'           => @equipment.work_number.to_s,
          'number'                => @equipment.number.to_s,
          'identification_number' => @equipment.identification_number.to_s,
          'description'           => @equipment.description.to_s,
          'born_at'               => @equipment.born_at&.iso8601,
          'dead_at'               => @equipment.dead_at&.iso8601,
          'variant_name'          => @equipment.variant&.name.to_s,
          'type'                  => @equipment.class.name.to_s
        },
        interventions: interventions,
        maintenances:  maintenances,
        links:         links
      }
    end

    def new
      @equipment = Equipment.new
      render inertia: 'Backend/Equipements/Form', props: {
        equipement: nil,
        errors:     {}
      }
    end

    def create
      @equipment = Equipment.new(permitted_equipement_params)
      if @equipment.save
        redirect_to backend_equipment_path(@equipment), notice: 'Équipement créé avec succès.'
      else
        render inertia: 'Backend/Equipements/Form', props: {
          equipement: equipement_form_props(@equipment),
          errors:     @equipment.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
        }, status: :unprocessable_entity
      end
    end

    def edit
      return unless @equipment = find_and_check

      render inertia: 'Backend/Equipements/Form', props: {
        equipement: equipement_form_props(@equipment),
        errors: {}
      }
    end

    def update
      return unless @equipment = find_and_check

      if @equipment.update(permitted_equipement_params)
        redirect_to backend_equipment_path(@equipment), notice: 'Équipement mis à jour.'
      else
        render inertia: 'Backend/Equipements/Form', props: {
          equipement: equipement_form_props(@equipment),
          errors: @equipment.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first.to_s }
        }, status: :unprocessable_entity
      end
    end

    def index
      scope = Equipment
        .includes(:variant)
        .order(:name)
        .page(params[:page]).per(50)

      equipements = scope.map do |e|
        {
          'id'           => e.id,
          'work_number'  => e.work_number.to_s,
          'name'         => e.name.to_s,
          'born_at'      => e.born_at&.iso8601,
          'variant_name' => e.variant&.name.to_s,
          'can_destroy'  => e.destroyable?
        }
      end

      render inertia: 'Backend/Equipements/Index', props: {
        equipements: equipements,
        meta: {
          'total'    => scope.total_count,
          'page'     => (params[:page] || 1).to_i,
          'per_page' => 50
        }
      }
    end

    def destroy
      return unless @equipment = find_and_check

      if @equipment.destroyable?
        @equipment.destroy!
        redirect_to backend_equipments_path, notice: 'Équipement supprimé.'
      else
        redirect_to backend_equipment_path(@equipment),
                    alert: 'Impossible de supprimer : cet équipement a des participations à des interventions.'
      end
    end

    def tool_costs_xslx_export
      equipments = Equipment.where(id: params[:equipment_ids])
      campaigns = Campaign.where(id: params[:campaign_id])
      ToolCostExportJob.perform_later(equipment_ids: equipments.pluck(:id), campaign_ids: campaigns.pluck(:id), user: current_user)
      notify_success(:document_in_preparation)
      redirect_to action: :show
    end

    private

      def equipement_form_props(equipment)
        {
          'id'          => equipment.id,
          'name'        => equipment.name.to_s,
          'work_number' => equipment.work_number.to_s,
          'description' => equipment.description.to_s,
          'born_at'     => equipment.born_at&.iso8601,
          'dead_at'     => equipment.dead_at&.iso8601
        }
      end

      def permitted_equipement_params
        params.require(:equipement).permit(:name, :work_number, :description, :born_at, :dead_at)
      end

  end
end
