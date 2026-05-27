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
  class WorkersController < Backend::ProductsController

    def self.list_conditions
      code = search_conditions(workers: %i[name number work_number description], products: %i[variety]) + " ||= []\n"

      code << "if params[:variant_id].present?\n"
      code << " c[0] << ' AND #{Worker.table_name}.variant_id = ?'\n"
      code << " c << params[:variant_id]\n"
      code << "end\n"
      code << "c\n "
      code.c
    end

    def self.worker_time_logs_conditions
      code = search_conditions(worker_time_logs: %i[worker description]) + " ||= []\n"
      code << "if params[:id].present?\n"
      code << " c[0] << ' AND #{WorkerTimeLog.table_name}.worker_id = ?'\n"
      code << " c << params[:id]\n"
      code << "end\n"

      code << "if params[:current_period].present?\n"
      code << " c[0] << ' AND EXTRACT(YEAR FROM #{WorkerTimeLog.table_name}.started_at) = ?'\n"
      code << " c << params[:current_period].to_date.year\n"
      code << "end\n"
      code << "c\n "
      code.c

    end

    list(conditions: list_conditions, selectable: true) do |t|
      t.action :edit
      t.action :destroy, if: :destroyable?
      t.column :number, url: true
      t.column :work_number
      t.column :name, url: true
      t.column :variant, url: { controller: 'RECORD.variant.class.name.tableize'.c, namespace: :backend }
      t.column :variety
      t.column :container, url: true
      t.column :description
    end

    list(:time_logs, model: :worker_time_logs, conditions: worker_time_logs_conditions, order: { started_at: :asc }) do |t|
      t.action :edit
      t.action :destroy
      t.column :started_at, datatype: :datetime
      t.column :stopped_at, datatype: :datetime
      t.column :project_task
      t.column :description
      t.column :human_duration, on_select: :sum, value_method: 'duration.in(:second).in(:hour)', datatype: :decimal, class: 'center-align'
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

    respond_to :html, :json
    layout 'inertia', only: %i[index show new edit]
    skip_before_action :check_variant_availability, only: :new

    def index
      scope = Worker.includes(:variant).order(:name).page(params[:page]).per(50)

      travailleurs = scope.map do |w|
        {
          'id'          => w.id,
          'name'        => w.name.to_s,
          'number'      => w.number.to_s,
          'work_number' => w.work_number.to_s,
          'born_at'     => w.born_at&.iso8601,
          'dead_at'     => w.dead_at&.iso8601,
          'can_destroy' => w.destroyable?
        }
      end

      render inertia: 'Backend/Travailleurs/Index', props: {
        travailleurs: travailleurs,
        meta: {
          'total'    => scope.total_count,
          'page'     => (params[:page] || 1).to_i,
          'per_page' => 50
        }
      }
    end

    def show
      return unless @worker = find_and_check

      interventions = InterventionParameter
        .includes(:intervention)
        .where(product_id: @worker.id, type: 'InterventionDoer')
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

      render inertia: 'Backend/Travailleurs/Show', props: {
        can_destroy: @worker.destroyable?,
        travailleur: {
          'id'                    => @worker.id,
          'name'                  => @worker.name.to_s,
          'number'                => @worker.number.to_s,
          'work_number'           => @worker.work_number.to_s,
          'identification_number' => @worker.identification_number.to_s,
          'born_at'               => @worker.born_at&.iso8601,
          'dead_at'               => @worker.dead_at&.iso8601,
          'description'           => @worker.description.to_s
        },
        interventions: interventions
      }
    end

    def new
      render inertia: 'Backend/Travailleurs/Form', props: {
        travailleur: nil,
        errors: {}
      }
    end

    def edit
      return unless @worker = find_and_check(:worker)

      render inertia: 'Backend/Travailleurs/Form', props: {
        travailleur: worker_json(@worker),
        errors: {}
      }
    end

    def create
      @worker = Worker.new(worker_params)
      if @worker.save
        redirect_to backend_worker_path(@worker)
      else
        render inertia: 'Backend/Travailleurs/Form', props: {
          travailleur: nil,
          errors: @worker.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
        }, status: :unprocessable_entity
      end
    end

    def update
      return unless @worker = find_and_check(:worker)

      if @worker.update(worker_params)
        redirect_to backend_worker_path(@worker)
      else
        render inertia: 'Backend/Travailleurs/Form', props: {
          travailleur: worker_json(@worker),
          errors: @worker.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
        }, status: :unprocessable_entity
      end
    end

    def destroy
      return unless @worker = find_and_check

      if @worker.destroyable?
        @worker.destroy!
        redirect_to backend_workers_path, notice: 'Travailleur supprimé.'
      else
        redirect_to backend_worker_path(@worker),
                    alert: "Impossible de supprimer : ce travailleur a des interventions ou relevés d'heures liés."
      end
    end

    private

      def worker_json(worker)
        {
          id: worker.id,
          name: worker.name,
          work_number: worker.work_number,
          identification_number: worker.identification_number,
          born_at: worker.born_at&.to_date&.iso8601,
          dead_at: worker.dead_at&.to_date&.iso8601,
          description: worker.description
        }
      end

      def worker_params
        params.require(:worker).permit(
          :name, :work_number, :identification_number,
          :born_at, :dead_at, :description
        )
      end
  end
end
