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
  class PurchaseInvoicesController < Backend::BaseController
    manage_restfully planned_at: 'Time.zone.today+2'.c, redirect_to: '{action: :show, id: "id".c}'.c,
                     except: %i[new create update], continue: [:nature_id]

    respond_to :csv, :ods, :xlsx, :pdf, :odt, :docx, :html, :xml, :json

    unroll :number, :amount, :currency, :invoiced_at, supplier: :full_name

    before_action :save_search_preference, only: :index

    def self.list_conditions
      code = ''
      code = search_conditions(purchase_invoice: %i[number reference_number created_at pretax_amount amount], entities: %i[number full_name]) + " ||= []\n"
      code << "if params[:period].present? && params[:period].to_s != 'all'\n"
      code << "  c[0] << ' AND #{PurchaseInvoice.table_name}.invoiced_at::DATE BETWEEN ? AND ?'\n"
      code << "  if params[:period].to_s == 'interval'\n"
      code << "    c << params[:started_on]\n"
      code << "    c << params[:stopped_on]\n"
      code << "  else\n"
      code << "    interval = params[:period].to_s.split('_')\n"
      code << "    c << interval.first\n"
      code << "    c << interval.second\n"
      code << "  end\n"
      code << "end\n"
      code << "if !params[:reconciliation_state].blank? && params[:reconciliation_state].to_s != 'all'\n"
      code << "  c[0] << ' AND #{Purchase.table_name}.reconciliation_state IN (?)'\n"
      code << "  c << params[:reconciliation_state]\n"
      code << "end\n"
      code << "if params[:responsible_id].to_i > 0\n"
      code << "  c[0] += ' AND #{PurchaseInvoice.table_name}.responsible_id = ?'\n"
      code << "  c << params[:responsible_id]\n"
      code << "end\n"
      code << "c\n "
      code << "if params[:payment_mode_id].to_i > 0\n"
      code << "  c[0] += ' AND #{Entity.table_name}.supplier_payment_mode_id = ?'\n"
      code << "  c << params[:payment_mode_id]\n"
      code << "end\n"
      code << "if params[:nature].present?\n"
      code << " if params[:nature] == 'unpaid'\n"
      code << "     c[0] << ' AND NOT #{PurchaseAffair.table_name}.closed'\n"
      code << " end\n"
      code << "end\n"
      code << "if params[:purchases_attachments] == 'y'\n"
      code << "    c[0] << ' AND #{PurchaseInvoice.table_name}.id IN (SELECT DISTINCT resource_id FROM #{Attachment.table_name} WHERE #{Attachment.table_name}.resource_type = \\'Purchase\\' AND #{Attachment.table_name}.deleted_at IS NULL)'\n"
      code << "end\n"
      code << "if params[:purchases_attachments] == 'n'\n"
      code << "    c[0] << ' AND NOT #{PurchaseInvoice.table_name}.id IN (SELECT DISTINCT resource_id FROM #{Attachment.table_name} WHERE #{Attachment.table_name}.resource_type = \\'Purchase\\' AND #{Attachment.table_name}.deleted_at IS NULL)'\n"
      code << "end\n"
      code << "c\n "
      code.c
    end

    list(conditions: list_conditions, joins: %i[affair supplier], line_class: :status, order: { created_at: :desc, number: :desc }) do |t|
      t.action :payment_mode, on: :both, if: :payable?
      t.action :edit
      t.action :destroy
      t.column :number, url: true
      t.column :supplier, url: true
      t.column :invoiced_at
      t.column :reference_number, url: true
      t.column :has_attachments, datatype: :boolean, class: 'center'
      t.column :entity_payment_mode_name, through: :supplier, label: :supplier_payment_mode, hidden: true
      t.column :created_at
      t.status
      t.column :human_status, label: :state, hidden: true
      t.column :pretax_amount, currency: true, on_select: :sum, hidden: true
      t.column :amount, currency: true, on_select: :sum
      t.column :affair_balance, currency: true, on_select: :sum, hidden: true
    end
    # Mode de paiement du fournisseur

    list(:items, model: :purchase_items, order: { id: :asc }, conditions: { purchase_id: 'params[:id]'.c }) do |t|
      t.column :variant, label_method: :name_with_unit, url: { controller: 'RECORD.variant.class.name.tableize'.c, namespace: :backend }
      t.column :annotation, hidden: true
      t.column :first_reception_number, label: :reception, url: { controller: '/backend/receptions', id: 'RECORD.first_reception_id'.c }
      t.column :conditioning_unit
      t.column :conditioning_quantity, class: 'right-align'
      t.column :unit_pretax_amount, currency: true, class: 'right-align'
      t.column :unit_amount, currency: true, hidden: true, class: 'right-align'
      t.column :reduction_percentage, class: 'right-align'
      t.column :tax, url: true, hidden: true, class: 'right-align'
      t.column :pretax_amount, currency: true, class: 'right-align'
      t.column :amount, currency: true, class: 'right-align'
      t.column :activity_budget, hidden: true
      t.column :team, hidden: true
      t.column :fixed_asset, url: true, hidden: true
    end

    list(:receptions, children: :items, conditions: { id: "PurchaseInvoice.find_by(id: params[:id]).receptions".c }) do |t|
      t.action :edit, if: :draft?
      t.action :destroy, if: :draft?
      t.column :number, url: true
      t.column :reference_number, url: true
      t.column :address, children: :product_name
      t.column :given_at, children: false
      # t.column :population, :datatype => :decimal
      # t.column :pretax_amount, currency: true
      # t.column :amount, currency: true
    end

    def index
      @purchase_invoices = PurchaseInvoice.joins(:supplier)

      if params[:q].present?
        q = "%#{params[:q].downcase}%"
        @purchase_invoices = @purchase_invoices.where(
          'LOWER(purchases.number) ILIKE ? OR LOWER(purchases.reference_number) ILIKE ? OR LOWER(entities.full_name) ILIKE ?',
          q, q, q
        )
      end

      if params[:reconciliation_state].is_a?(Array) && params[:reconciliation_state].any?
        @purchase_invoices = @purchase_invoices.where(reconciliation_state: params[:reconciliation_state])
      end

      if params[:unpaid] == 'true' || params[:unpaid] == true
        @purchase_invoices = @purchase_invoices.joins(:affair).where('NOT affairs.closed')
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
        @purchase_invoices = @purchase_invoices.where(
          'purchases.invoiced_at::DATE BETWEEN ? AND ?', started_on, stopped_on
        )
      end

      @purchase_invoices = @purchase_invoices.order(created_at: :desc, number: :desc)

      per_page    = 25
      page        = [params[:page].to_i, 1].max
      total_count = @purchase_invoices.count
      total_pages = (total_count.to_f / per_page).ceil
      @purchase_invoices = @purchase_invoices.offset((page - 1) * per_page).limit(per_page)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/FacturesIndex', props: {
            factures: @purchase_invoices.map { |f|
              {
                id: f.id,
                number: f.number,
                reference_number: f.reference_number,
                invoiced_at: f.invoiced_at&.to_date&.iso8601,
                supplier: { id: f.supplier.id, full_name: f.supplier.full_name },
                nature_name: f.nature&.name,
                pretax_amount: f.pretax_amount.to_f,
                amount: f.amount.to_f,
                currency: f.currency,
                reconciliation_state: f.reconciliation_state,
                unpaid: f.unpaid?,
                description: f.description,
                payment_delay: f.payment_delay,
                responsible_name: f.responsible&.full_name,
                items: [],
                destroyable: f.destroyable?,
                updatable: !f.linked_to_tax_declaration?
              }
            },
            filters: {
              q: params[:q],
              reconciliation_state: params[:reconciliation_state],
              unpaid: params[:unpaid] == 'true'
            },
            meta: { current_page: page, total_pages: total_pages, total_count: total_count }
          }
        end
      end
    end

    def show
      return unless @purchase_invoice = find_and_check

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/FacturesShow', props: {
            facture: {
              id: @purchase_invoice.id,
              number: @purchase_invoice.number,
              reference_number: @purchase_invoice.reference_number,
              invoiced_at: @purchase_invoice.invoiced_at&.to_date&.iso8601,
              supplier: { id: @purchase_invoice.supplier.id, full_name: @purchase_invoice.supplier.full_name },
              nature_name: @purchase_invoice.nature&.name,
              pretax_amount: @purchase_invoice.pretax_amount.to_f,
              amount: @purchase_invoice.amount.to_f,
              currency: @purchase_invoice.currency,
              reconciliation_state: @purchase_invoice.reconciliation_state,
              unpaid: @purchase_invoice.unpaid?,
              description: @purchase_invoice.description,
              payment_delay: @purchase_invoice.payment_delay,
              responsible_name: @purchase_invoice.responsible&.full_name,
              items: @purchase_invoice.items.map { |i|
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
              destroyable: @purchase_invoice.destroyable?,
              updatable: !@purchase_invoice.linked_to_tax_declaration?
            }
          }
        end
      end
    end

    def new
      nature = PurchaseNature.find_by(id: params[:nature_id]) || PurchaseNature.by_default
      items_data = []

      if params[:reception_ids].present?
        receptions = Reception.where(id: params[:reception_ids])
                              .select { |r| r.reconciliation_state == 'to_reconcile' && r.given? }
        if receptions.any?
          raw_items = InvoiceableItemsFilter.new.filter(receptions)
          items_data = raw_items.map { |i|
            {
              id: nil,
              variant_name: i.variant&.name,
              conditioning_quantity: i.conditioning_quantity.to_f,
              unit_pretax_amount: i.unit_pretax_amount.to_f,
              tax_id: i.tax_id,
              reduction_percentage: 0,
              pretax_amount: i.pretax_amount.to_f,
              amount: i.amount.to_f
            }
          }
        end
      elsif params[:reception_id]
        reception = Reception.find_by(id: params[:reception_id])
        if reception && reception.reconciliation_state == 'to_reconcile'
          raw_items = InvoiceableItemsFilter.new.filter([reception])
          items_data = raw_items.map { |i|
            {
              id: nil,
              variant_name: i.variant&.name,
              conditioning_quantity: i.conditioning_quantity.to_f,
              unit_pretax_amount: i.unit_pretax_amount.to_f,
              tax_id: i.tax_id,
              reduction_percentage: 0,
              pretax_amount: i.pretax_amount.to_f,
              amount: i.amount.to_f
            }
          }
        end
      elsif params[:duplicate_of]
        source = PurchaseInvoice.find_by(id: params[:duplicate_of])
        if source
          items_data = source.items.map { |i|
            { id: nil, variant_name: i.variant&.name, conditioning_quantity: i.conditioning_quantity.to_f,
              unit_pretax_amount: i.unit_pretax_amount.to_f, tax_id: i.tax_id,
              reduction_percentage: i.reduction_percentage.to_f, pretax_amount: i.pretax_amount.to_f, amount: i.amount.to_f }
          }
        end
      end

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/FacturesForm', props: {
            facture: { invoiced_at: Time.zone.today.iso8601, currency: nature&.currency || 'XOF', items: items_data },
            natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
            taxes: Tax.all.as_json(only: %i[id name short_label amount]),
            errors: {}
          }
        end
      end
    end

    def create
      @purchase_invoice = PurchaseInvoice.new(purchase_invoice_params)

      if @purchase_invoice.save
        redirect_to backend_purchase_invoice_path(@purchase_invoice)
      else
        respond_to do |format|
          format.html do
            render inertia: 'Backend/Achats/FacturesForm', props: {
              facture: { items: [] },
              natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
              taxes: Tax.all.as_json(only: %i[id name short_label amount]),
              errors: @purchase_invoice.errors.to_hash
            }, status: :unprocessable_entity
          end
        end
      end
    end

    def update
      return unless (@purchase_invoice = find_and_check)

      if @purchase_invoice.linked_to_tax_declaration?
        redirect_to backend_purchase_invoice_path(@purchase_invoice), alert: 'Facture liée à une déclaration fiscale'
        return
      end

      if @purchase_invoice.update(purchase_invoice_params)
        redirect_to backend_purchase_invoice_path(@purchase_invoice)
      else
        respond_to do |format|
          format.html do
            render inertia: 'Backend/Achats/FacturesForm', props: {
              facture: { id: @purchase_invoice.id, number: @purchase_invoice.number, items: [] },
              natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
              taxes: Tax.all.as_json(only: %i[id name short_label amount]),
              errors: @purchase_invoice.errors.to_hash
            }, status: :unprocessable_entity
          end
        end
      end
    end

    def edit
      return unless (@purchase_invoice = find_and_check)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Achats/FacturesForm', props: {
            facture: {
              id: @purchase_invoice.id,
              number: @purchase_invoice.number,
              reference_number: @purchase_invoice.reference_number,
              invoiced_at: @purchase_invoice.invoiced_at&.to_date&.iso8601,
              supplier: { id: @purchase_invoice.supplier.id, full_name: @purchase_invoice.supplier.full_name },
              nature_name: @purchase_invoice.nature&.name,
              nature_id: @purchase_invoice.nature_id,
              pretax_amount: @purchase_invoice.pretax_amount.to_f,
              amount: @purchase_invoice.amount.to_f,
              currency: @purchase_invoice.currency,
              reconciliation_state: @purchase_invoice.reconciliation_state,
              unpaid: @purchase_invoice.unpaid?,
              description: @purchase_invoice.description,
              payment_delay: @purchase_invoice.payment_delay,
              responsible_name: @purchase_invoice.responsible&.full_name,
              items: @purchase_invoice.items.map { |i|
                { id: i.id, variant_name: i.variant&.name, conditioning_quantity: i.conditioning_quantity.to_f,
                  unit_pretax_amount: i.unit_pretax_amount.to_f, tax_id: i.tax_id,
                  reduction_percentage: i.reduction_percentage.to_f, pretax_amount: i.pretax_amount.to_f, amount: i.amount.to_f }
              },
              destroyable: @purchase_invoice.destroyable?,
              updatable: !@purchase_invoice.linked_to_tax_declaration?
            },
            natures: PurchaseNature.all.as_json(only: %i[id name currency payment_delay]),
            taxes: Tax.all.as_json(only: %i[id name short_label amount]),
            errors: {}
          }
        end
      end
    end

    def destroy
      return unless (@purchase_invoice = find_and_check)

      if @purchase_invoice.linked_to_tax_declaration?
        notify_error(:unable_to_modify_purchase_invoice_link_to_tax_declaration)
        return redirect_to_back fallback_location: { action: :show, id: @purchase_invoice.id }
      end

      super
    end

    def payment_mode
      # use view to select payment mode for mass payment on purchase
    end

    def pay
      unless (mode = OutgoingPaymentMode.find_by(id: params[:mode_id]))
        notify_error :need_a_valid_payment_mode
        redirect_to action: :index
        return
      end
      purchases = find_purchases
      return unless purchases

      unless purchases.all?
        notify_error(:all_purchases_must_be_ordered_or_invoiced)
        redirect_to(params[:redirect] || { action: :index })
        return
      end

      if mode.sepa?
        unless purchases.all?(&:sepable?)
          notify_error(:purchases_invalid_for_sepa)
          redirect_to(params[:redirect] || { action: :index })
          return
        end
      end

      payments_list = OutgoingPaymentList.build_from_purchases(
        purchases,
        mode,
        current_user
      )

      if payments_list.save
        redirect_to backend_outgoing_payment_lists_path
      else
        notify_error(payments_list.errors.full_messages.join(', '))
        redirect_to(params[:redirect] || { action: :index })
      end
    end

    protected

      def find_purchases
        purchase_ids = params[:id].split(',')
        purchases = purchase_ids.map { |id| PurchaseInvoice.find_by(id: id) }.compact
        unless purchases.any?
          notify_error :no_purchases_given
          redirect_to(params[:redirect] || { action: :index })
          return nil
        end
        purchases
      end

    private

      def purchase_invoice_params
        params.require(:purchase_invoice).permit(
          :nature_id, :supplier_id, :invoiced_at, :reference_number,
          :payment_delay, :responsible_id, :description,
          items_attributes: %i[id variant_name conditioning_quantity unit_pretax_amount
                               tax_id reduction_percentage _destroy position]
        )
      end
  end
end
