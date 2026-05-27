# == License
# Ekylibre - Simple agricultural ERP
# Copyright (C) 2012-2013 David Joulin, Brice Texier
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
  class PurchaseOrdersController < Backend::BaseController
    manage_restfully planned_at: 'Time.zone.today+2'.c, redirect_to: '{action: :show, id: "id".c}'.c,
                     except: %i[new create], continue: [:nature_id]

    unroll :number, :reference_number, :ordered_at, :pretax_amount, supplier: :full_name

    before_action :save_search_preference, only: :index

    def self.list_conditions
      code = ''
      code = search_conditions(purchase_order: %i[number reference_number created_at pretax_amount], entities: %i[number full_name]) + " ||= []\n"
      code << "if params[:period].present? && params[:period].to_s != 'all'\n"
      code << "  c[0] << ' AND #{PurchaseOrder.table_name}.ordered_at::DATE BETWEEN ? AND ?'\n"
      code << "  if params[:period].to_s == 'interval'\n"
      code << "    c << params[:started_on]\n"
      code << "    c << params[:stopped_on]\n"
      code << "  else\n"
      code << "    interval = params[:period].to_s.split('_')\n"
      code << "    c << interval.first\n"
      code << "    c << interval.second\n"
      code << "  end\n"
      code << "end\n"
      code << "if params[:state].is_a?(Array) && !params[:state].empty?\n"
      code << "  c[0] << ' AND #{PurchaseOrder.table_name}.state IN (?)'\n"
      code << "  c << params[:state]\n"
      code << "end\n "
      code << "if params[:responsible_id].to_i > 0\n"
      code << "  c[0] += ' AND #{PurchaseOrder.table_name}.responsible_id = ?'\n"
      code << "  c << params[:responsible_id]\n"
      code << "end\n"
      code << "c\n "
      code.c
    end

    list(conditions: list_conditions, joins: :supplier, order: { created_at: :desc, number: :desc }) do |t|
      t.action :edit
      t.action :destroy
      t.column :number, url: true
      t.column :reference_number, url: true
      t.column :created_at
      t.status
      t.column :state_label
      t.column :supplier, url: true
      t.column :pretax_amount, currency: true, on_select: :sum
      t.column :amount, currency: true, on_select: :sum
    end

    list(:items, model: :purchase_items, order: { id: :asc }, conditions: { purchase_id: 'params[:id]'.c }) do |t|
      t.column :variant, label_method: :name_with_unit, url: { controller: 'RECORD.variant.class.name.tableize'.c, namespace: :backend }
      t.column :annotation, hidden: true
      t.column :first_reception_number, label: :reception, url: { controller: '/backend/receptions', id: 'RECORD.first_reception_id'.c }
      t.column :conditioning_unit
      t.column :conditioning_quantity, class: 'right-align'
      t.column :human_received_quantity, label: :received_quantity, datatype: :decimal, class: 'right-align'
      t.column :human_quantity_to_receive, label: :quantity_to_receive, datatype: :decimal, class: 'right-align'
      t.column :unit_pretax_amount, currency: true, class: 'right-align'
      t.column :unit_amount, currency: true, hidden: true
      t.column :reduction_percentage, class: 'right-align'
      t.column :tax, url: true, hidden: true, class: 'right-align'
      t.column :pretax_amount, currency: true, class: 'right-align'
      t.column :amount, currency: true, class: 'right-align'
      t.column :activity_budget, hidden: true
      t.column :team, hidden: true
      t.column :fixed_asset, url: true, hidden: true
    end

    def index
      @purchase_orders = PurchaseOrder.joins(:supplier)

      if params[:q].present?
        q = "%#{params[:q].downcase}%"
        @purchase_orders = @purchase_orders.where(
          'LOWER(purchases.number) ILIKE ? OR LOWER(purchases.reference_number) ILIKE ? OR LOWER(entities.full_name) ILIKE ?',
          q, q, q
        )
      end

      if params[:state].is_a?(Array) && params[:state].any?
        @purchase_orders = @purchase_orders.where(state: params[:state])
      end

      if params[:period].present? && params[:period] != 'all'
        if params[:period] == 'interval'
          started_on = params[:started_on]
          stopped_on = params[:stopped_on]
        else
          interval = params[:period].split('_')
          started_on = interval.first
          stopped_on = interval.last
        end
        @purchase_orders = @purchase_orders.where(
          'purchases.ordered_at::DATE BETWEEN ? AND ?', started_on, stopped_on
        )
      end

      @purchase_orders = @purchase_orders.order(created_at: :desc, number: :desc)

      per_page    = 25
      page        = [params[:page].to_i, 1].max
      total_count = @purchase_orders.count
      total_pages = (total_count.to_f / per_page).ceil
      @purchase_orders = @purchase_orders.offset((page - 1) * per_page).limit(per_page)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/CommandesIndex', props: {
            commandes: @purchase_orders.map { |o|
              {
                id: o.id,
                number: o.number,
                reference_number: o.reference_number,
                state: o.state,
                ordered_at: o.ordered_at&.to_date&.iso8601,
                supplier: { id: o.supplier.id, full_name: o.supplier.full_name },
                nature_name: o.nature&.name,
                pretax_amount: o.pretax_amount.to_f,
                amount: o.amount.to_f,
                currency: o.currency,
                description: o.description,
                responsible_name: o.responsible&.full_name,
                receptions_count: o.receptions.count,
                destroyable: o.destroyable?
              }
            },
            filters: { q: params[:q], state: params[:state] },
            meta: { current_page: page, total_pages: total_pages, total_count: total_count }
          }
        end
      end
    end

    def show
      return unless @purchase_order = find_and_check

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/CommandesShow', props: {
            commande: {
              id: @purchase_order.id,
              number: @purchase_order.number,
              reference_number: @purchase_order.reference_number,
              state: @purchase_order.state,
              ordered_at: @purchase_order.ordered_at&.to_date&.iso8601,
              supplier: { id: @purchase_order.supplier.id, full_name: @purchase_order.supplier.full_name },
              nature_name: @purchase_order.nature&.name,
              pretax_amount: @purchase_order.pretax_amount.to_f,
              amount: @purchase_order.amount.to_f,
              currency: @purchase_order.currency,
              description: @purchase_order.description,
              responsible_name: @purchase_order.responsible&.full_name,
              items: @purchase_order.items.map { |i|
                {
                  id: i.id,
                  variant_name: i.variant&.name,
                  conditioning_quantity: i.conditioning_quantity.to_f,
                  unit_pretax_amount: i.unit_pretax_amount.to_f,
                  tax_id: i.tax_id,
                  reduction_percentage: i.reduction_percentage.to_f,
                  pretax_amount: i.pretax_amount.to_f,
                  amount: i.amount.to_f
                }
              },
              receptions_count: @purchase_order.receptions.count,
              destroyable: @purchase_order.destroyable?
            }
          }
        end
        format.odt do
          return unless template = DocumentTemplate.find_active_template(:purchases_order, 'odt')

          printed = print(template: template, format: :odt)
          send_data printed[:data], filename: "#{printed[:name]}.odt"
        end
        format.pdf do
          return unless template = find_and_check(:document_template, params[:template])

          printed = print(template: template, format: :pdf)
          send_data printed[:data], filename: "#{printed[:name]}.pdf", type: 'application/pdf', disposition: 'attachment'
        end
      end
    end

    def new
      nature = PurchaseNature.by_default
      @purchase_order = PurchaseOrder.new(nature: nature)
      @purchase_order.currency = @purchase_order.nature&.currency
      @purchase_order.responsible ||= current_user
      @purchase_order.ordered_at = Time.zone.now

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/CommandesForm', props: {
            commande: { ordered_at: Time.zone.today.iso8601, currency: @purchase_order.currency, items: [] },
            natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
            taxes: Tax.all.as_json(only: %i[id name short_label amount]),
            errors: {}
          }
        end
      end
    end

    def edit
      return unless @purchase_order = find_and_check(:purchase_order)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/CommandesForm', props: {
            commande: {
              id: @purchase_order.id,
              number: @purchase_order.number,
              reference_number: @purchase_order.reference_number,
              state: @purchase_order.state,
              ordered_at: @purchase_order.ordered_at&.to_date&.iso8601,
              supplier: { id: @purchase_order.supplier.id, full_name: @purchase_order.supplier.full_name },
              nature_name: @purchase_order.nature&.name,
              pretax_amount: @purchase_order.pretax_amount.to_f,
              amount: @purchase_order.amount.to_f,
              currency: @purchase_order.currency,
              description: @purchase_order.description,
              responsible_name: @purchase_order.responsible&.full_name,
              items: @purchase_order.items.map { |i|
                { id: i.id, variant_name: i.variant&.name, conditioning_quantity: i.conditioning_quantity.to_f,
                  unit_pretax_amount: i.unit_pretax_amount.to_f, tax_id: i.tax_id,
                  reduction_percentage: i.reduction_percentage.to_f, pretax_amount: i.pretax_amount.to_f, amount: i.amount.to_f }
              },
              receptions_count: @purchase_order.receptions.count,
              destroyable: @purchase_order.destroyable?
            },
            natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
            taxes: Tax.all.as_json(only: %i[id name short_label amount]),
            errors: {}
          }
        end
      end
    end

    def create
      @purchase_order = PurchaseOrder.new(purchase_order_params)

      if @purchase_order.save
        redirect_to backend_purchase_order_path(@purchase_order)
      else
        respond_to do |format|
          format.html do
            render inertia: 'Backend/Achats/CommandesForm', props: {
              commande: purchase_order_params.merge(items: []),
              natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
              taxes: Tax.all.as_json(only: %i[id name short_label amount]),
              errors: @purchase_order.errors.to_hash
            }, status: :unprocessable_entity
          end
        end
      end
    end

    def update
      return unless @purchase_order = find_and_check(:purchase_order)

      if @purchase_order.update(purchase_order_params)
        redirect_to backend_purchase_order_path(@purchase_order)
      else
        respond_to do |format|
          format.html do
            render inertia: 'Backend/Achats/CommandesForm', props: {
              commande: { id: @purchase_order.id, number: @purchase_order.number }.merge(purchase_order_params).merge(items: []),
              natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
              taxes: Tax.all.as_json(only: %i[id name short_label amount]),
              errors: @purchase_order.errors.to_hash
            }, status: :unprocessable_entity
          end
        end
      end
    end

    def destroy
      return unless @purchase_order = find_and_check

      if @purchase_order.destroyable?
        @purchase_order.destroy!
        redirect_to backend_purchase_orders_path, notice: 'Commande supprimée.'
      else
        redirect_to backend_purchase_order_path(@purchase_order),
                    alert: 'Impossible de supprimer : cette commande a des réceptions liées.'
      end
    end

    def open
      return unless @purchase_order = find_and_check

      @purchase_order.open
      redirect_to action: :show, id: @purchase_order.id
    end

    def close
      return unless @purchase_order = find_and_check

      @purchase_order.close
      redirect_to action: :show, id: @purchase_order.id
    end

    def email_supplier
      return unless @purchase_order = find_and_check

      return unless template = DocumentTemplate.find_active_template(:purchases_order, 'odt')

      if @purchase_order.supplier.default_email_address
        printed = print(template: template, format: :pdf, archived: true)
        document = printed[:document]
        PurchaseOrderExportJob.perform_later(@purchase_order, document, current_user)
        notify_success :email_in_preparation
      else
        notify_error :supplier_default_email_address_missing
      end

      redirect_to action: :show, id: @purchase_order.id
    end

    def print(template:, format: :pdf, archived: true)
      printer = Printers::PurchaseOrderPrinter.new(template: template, purchase_order: @purchase_order)
      generator = Ekylibre::DocumentManagement::DocumentGenerator.build
      if format == :pdf
        data = generator.generate_pdf(template: template, printer: printer)
      elsif format == :odt
        data = generator.generate_odt(template: template, printer: printer)
      end
      if archived == true && format == :pdf
        archiver = Ekylibre::DocumentManagement::DocumentArchiver.build
        document = archiver.archive_document(pdf_content: data, template: template, key: printer.key, name: printer.document_name)
      else
        document = nil
      end
      { data: data, name: printer.document_name, document: document }
    end

    private

      def purchase_order_params
        params.require(:purchase_order).permit(
          :nature_id, :supplier_id, :ordered_at, :reference_number,
          :responsible_id, :description,
          items_attributes: %i[id variant_name conditioning_quantity unit_pretax_amount
                               tax_id reduction_percentage _destroy position]
        )
      end
  end
end
