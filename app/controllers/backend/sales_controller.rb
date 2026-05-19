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
  class SalesController < Backend::BaseController
    manage_restfully except: %i[index show new], redirect_to: '{action: :show, id: "id".c}'.c, continue: [:nature_id]

    respond_to :csv, :ods, :xlsx, :pdf, :odt, :docx, :html, :xml, :json

    before_action :save_search_preference, only: :index

    unroll :number, :amount, :currency, :created_at, :invoiced_at, client: :full_name

    # management -> sales_conditions
    def self.sales_conditions
      code = search_conditions(sales: %i[pretax_amount amount reference_number number initial_number description], entities: %i[number full_name]) + " ||= []\n"
      code << "if params[:period].present? && params[:period].to_s != 'all'\n"
      code << "  c[0] << ' AND ((#{Sale.table_name}.invoiced_at IS NULL AND #{Sale.table_name}.created_at::DATE BETWEEN ? AND ?)'\n"
      code << "  if params[:period].to_s == 'interval'\n"
      code << "    c << params[:started_on]\n"
      code << "    c << params[:stopped_on]\n"
      code << "  else\n"
      code << "    interval = params[:period].to_s.split('_')\n"
      code << "    c << interval.first\n"
      code << "    c << interval.second\n"
      code << "  end\n"
      code << "  c[0] << ' OR (#{Sale.table_name}.invoiced_at::DATE BETWEEN ? AND ?))'\n"
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
      code << "  c[0] << ' AND #{Sale.table_name}.state IN (?)'\n"
      code << "  c << params[:state]\n"
      code << "end\n "
      code << "if params[:nature].present? && params[:nature].to_s != 'all'\n"
      code << "  if params[:nature] == 'unpaid'\n"
      code << "    c[0] << ' AND NOT #{Affair.table_name}.closed'\n"
      code << "  end\n"
      code << "end\n"
      code << "if params[:responsible_id].to_i > 0\n"
      code << "  c[0] += \" AND \#{Sale.table_name}.responsible_id = ?\"\n"
      code << "  c << params[:responsible_id]\n"
      code << "end\n"
      code << "if params[:provider].present?\n"
      code << "  c[0] += \" AND \#{Sale.table_name}.provider ->> 'vendor' = ?\"\n"
      code << "  c << params[:provider].tap { |e| e[0] = e[0].downcase }.to_s\n"
      code << "end\n"
      code << "c\n "
      code.c
    end

    list(conditions: sales_conditions, selectable: true, joins: %i[client affair], order: { created_at: :desc, number: :desc }) do |t| # , :line_class => 'RECORD.tags'
      # t.action :show, url: {format: :pdf}, image: :print
      t.action :edit, if: :updateable?
      t.action :cancel, if: :cancellable?
      t.action :destroy, if: :destroyable?
      t.column :number, url: { action: :show }
      t.column :reference_number
      t.column :nature, hidden: true
      t.column :created_at
      t.column :invoiced_at
      t.column :client, url: true
      t.column :responsible, hidden: true
      t.column :description, hidden: true
      t.column :provider_vendor, label_method: 'provider_vendor&.capitalize', sort: :provider_vendor, hidden: true
      t.status
      t.column :state_label
      t.column :pretax_amount, currency: true, on_select: :sum
      t.column :amount, currency: true, on_select: :sum
      t.column :affair_balance, currency: true, on_select: :sum, hidden: true

    end

    # Displays the main page with the list of sales
    def index
      respond_to do |format|
        format.html do
          sales = Sale.joins(:client, :affair)
                      .order(created_at: :desc, number: :desc)
                      .includes(:client, :affair)

          if (q = params[:q]).present?
            sales = sales.where(
              'sales.number ILIKE :q OR sales.reference_number ILIKE :q OR entities.full_name ILIKE :q',
              q: "%#{q}%"
            )
          end
          if params[:state].is_a?(Array) && params[:state].any?
            sales = sales.where(state: params[:state])
          end
          if params[:nature] == 'unpaid'
            sales = sales.where('NOT affairs.closed')
          end
          if params[:period].present? && params[:period] != 'all'
            if params[:period] == 'interval'
              started = params[:started_on]
              stopped = params[:stopped_on]
            else
              parts = params[:period].split('_')
              started = parts[0]
              stopped = parts[1]
            end
            if started && stopped
              sales = sales.where(
                '(sales.invoiced_at IS NULL AND sales.created_at::DATE BETWEEN ? AND ?) OR (sales.invoiced_at::DATE BETWEEN ? AND ?)',
                started, stopped, started, stopped
              )
            end
          end
          if params[:responsible_id].to_i > 0
            sales = sales.where(responsible_id: params[:responsible_id])
          end

          page     = [params[:page].to_i, 1].max
          per_page = 25
          total    = sales.count
          sales    = sales.offset((page - 1) * per_page).limit(per_page)

          render inertia: 'Backend/Ventes/Index', props: {
            sales: sales.map { |s|
              {
                id:               s.id,
                number:           s.number,
                reference_number: s.reference_number,
                state:            s.state,
                state_label:      s.state_label,
                client_name:      s.client.full_name,
                created_at:       s.created_at.iso8601,
                invoiced_at:      s.invoiced_at&.iso8601,
                pretax_amount:    s.pretax_amount.to_f,
                amount:           s.amount.to_f,
                currency:         s.currency,
                updateable:       s.updateable?,
                destroyable:      s.destroyable?,
                cancellable:      s.cancellable?,
              }
            },
            meta: { total:, page:, per_page: },
            filters: {
              q:              params[:q],
              state:          params[:state].is_a?(Array) ? params[:state] : [],
              period:         params[:period],
              started_on:     params[:started_on],
              stopped_on:     params[:stopped_on],
              nature:         params[:nature] || 'all',
              responsible_id: params[:responsible_id]&.to_i,
            },
            responsibles: Entity.where(id: Sale.select(:responsible_id).distinct.pluck(:responsible_id).compact)
                                .map { |e| { id: e.id, label: e.label } },
            natures: SaleNature.actives.reorder(:name).map { |n| { id: n.id, name: n.name } },
          }
        end
        format.xml  { render xml: @sales }
        format.pdf  { render pdf: @sales, with: params[:template] }
      end
    end

    list(:credits, model: :sales, conditions: { credited_sale_id: 'params[:id]'.c }, children: :items) do |t|
      t.column :number, url: true, children: :designation
      t.column :client, children: false
      t.column :created_at, children: false
      t.column :pretax_amount, currency: true
      t.column :amount, currency: true
    end

    list(:shipments, children: :items, conditions: { sale_id: 'params[:id]'.c }) do |t|
      t.column :number, children: :product_name, url: true
      t.column :delivery_mode
      t.column :delivery
      t.column :address, label_method: :coordinate, children: false
      t.status
      t.column :state, label_method: :human_state_name, hidden: true
      t.column :transporter, children: false, url: true
      t.action :edit, if: :updateable?
      t.action :destroy, if: :destroyable?
    end

    list(:subscriptions, joins: :sale, conditions: ['sales.id = ?', 'params[:id]'.c]) do |t|
      t.action :edit
      t.action :destroy
      t.column :number, url: true
      t.column :nature, url: true
      t.column :subscriber, url: true
      t.column :address
      t.column :started_on
      t.column :stopped_on
      t.column :quantity
    end

    list(:undelivered_items, model: :sale_items, conditions: { sale_id: 'params[:id]'.c }) do |t|
      t.column :name, through: :variant
      # t.column :pretax_amount, currency: true, through: :price
      t.column :quantity
      # t.column :unit
      # t.column :pretax_amount, :currency => true
      t.column :amount
      # t.column :undelivered_quantity, :datatype => :decimal
    end

    list(:items, model: :sale_items, conditions: { sale_id: 'params[:id]'.c }, order: { id: :asc }, export: false, line_class: "((RECORD.variant.subscribing? and RECORD.subscriptions.sum(:quantity) != RECORD.quantity) ? 'warning' : '')".c, include: %i[variant subscriptions]) do |t|
      # t.action :edit, if: 'RECORD.sale.draft? and RECORD.reduction_origin_id.nil? '
      # t.action :destroy, if: 'RECORD.sale.draft? and RECORD.reduction_origin_id.nil? '
      # t.column :name, through: :variant
      # t.column :position
      t.column :label
      t.column :annotation, hidden: true
      t.column :conditioning_unit
      t.column :conditioning_quantity, class: 'right-align'
      t.column :unit_pretax_amount, currency: true, class: 'right-align'
      t.column :unit_amount, currency: true, hidden: true, class: 'right-align'
      t.column :base_unit_amount, currency: true, hidden: true, class: "right-align default-unit-amount hidden"
      t.column :reduction_percentage, class: 'right-align'
      t.column :tax, url: true, hidden: true, class: 'right-align'
      t.column :pretax_amount, currency: true, class: 'right-align'
      t.column :amount, currency: true, class: 'right-align'
      t.column :activity_budget, hidden: true, class: 'right-align'
      t.column :team, hidden: true, class: 'right-align'
      t.column :undelivered_quantity, label_method: :undelivered_quantity, hidden: true
    end

    # Displays details of one sale selected with +params[:id]+
    def show
      return unless @sale = find_and_check
      t3e @sale.attributes, client: @sale.client.full_name, state: @sale.state_label, label: @sale.label

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Ventes/Show', props: {
            sale: {
              id:               @sale.id,
              number:           @sale.number,
              reference_number: @sale.reference_number,
              initial_number:   @sale.initial_number,
              state:            @sale.state,
              state_label:      @sale.state_label,
              currency:         @sale.currency,
              pretax_amount:    @sale.pretax_amount.to_f,
              amount:           @sale.amount.to_f,
              affair_balance:   @sale.affair&.balance&.to_f,
              affair_closed:    @sale.affair&.closed,
              invoiced_at:      @sale.invoiced_at&.iso8601,
              confirmed_at:     @sale.confirmed_at&.iso8601,
              created_at:       @sale.created_at.iso8601,
              payment_delay:    @sale.payment_delay,
              description:      @sale.description,
              client: {
                id:                     @sale.client.id,
                full_name:              @sale.client.full_name,
                number:                 @sale.client.number,
                default_mail_address_id: @sale.client.default_mail_address&.id,
              },
              client_number:    @sale.client.number,
              responsible_id:   @sale.responsible_id,
              responsible_name: @sale.responsible&.full_name,
              nature_id:        @sale.nature_id,
              nature_name:      @sale.nature&.name,
              address:         (@sale.address ? { id: @sale.address.id, mail_coordinate: @sale.address.mail_coordinate } : nil),
              invoice_address: (@sale.invoice_address ? { id: @sale.invoice_address.id, mail_coordinate: @sale.invoice_address.mail_coordinate } : nil),
              items: @sale.items.order(:id).map { |item|
                {
                  id:                    item.id,
                  variant_id:            item.variant_id,
                  variant_name:          item.variant&.name,
                  conditioning_unit_id:  item.conditioning_unit_id,
                  conditioning_unit_name: item.conditioning_unit&.name,
                  conditioning_quantity: item.conditioning_quantity.to_f,
                  unit_pretax_amount:    item.unit_pretax_amount.to_f,
                  tax_id:                item.tax_id,
                  tax_rate:              item.tax ? (item.tax.usable_amount.to_f / 100.0) : 0.0,
                  reduction_percentage:  item.reduction_percentage.to_f,
                  pretax_amount:         item.pretax_amount.to_f,
                  amount:                item.amount.to_f,
                  label:                 item.label,
                  annotation:            item.annotation,
                }
              },
              affair: @sale.affair ? {
                balance: @sale.affair.balance.to_f,
                closed:  @sale.affair.closed,
                incoming_payments: @sale.affair.incoming_payments.map { |p|
                  { id: p.id, amount: p.amount.to_f, paid_at: p.paid_at&.iso8601, mode_name: p.mode&.name }
                }
              } : nil,
              shipments: @sale.parcels.map { |p|
                {
                  id:               p.id,
                  number:           p.number,
                  state:            p.state,
                  human_state_name: p.human_state_name,
                  delivery_mode:    p.delivery_mode,
                  address_coordinate: p.address&.coordinate,
                }
              },
              credits: @sale.credits.map { |c|
                { id: c.id, number: c.number, amount: c.amount.to_f, pretax_amount: c.pretax_amount.to_f, currency: c.currency, created_at: c.created_at.iso8601 }
              },
              updateable:          @sale.updateable?,
              destroyable:         @sale.destroyable?,
              cancellable:         @sale.cancellable?,
              can_generate_parcel: @sale.can_generate_parcel?,
            }
          }
        end
        format.pdf  { render pdf: @sale, with: params[:template] }
        format.json { render json: @sale }
      end
    end

    def new
      @sale = Sale.new(nature_id: params[:sale]&.dig(:nature_id))
      begin
        @sale.responsible = current_user.person
      rescue StandardError
        nil
      end

      render inertia: 'Backend/Ventes/Form', props: {
        sale: {
          id: nil, number: nil, state: nil,
          nature_id:        @sale.nature_id,
          client_id:        nil,
          client_name:      nil,
          invoiced_at:      nil,
          reference_number: nil,
          responsible_id:   @sale.responsible_id,
          responsible_name: @sale.responsible&.full_name,
          payment_delay:    @sale.nature&.payment_delay,
          description:      nil,
          currency:         @sale.currency || 'XOF',
          items:            [],
        },
        natures: SaleNature.actives.reorder(:name).map { |n|
          { id: n.id, name: n.name, currency: n.currency, payment_delay: n.payment_delay }
        },
        taxes: Tax.current.map { |t|
          { id: t.id, name: t.name, short_label: t.short_label, amount: t.usable_amount.to_f / 100.0 }
        },
        errors: {},
      }
    end

    def edit
      return unless @sale = find_and_check
      render inertia: 'Backend/Ventes/Form', props: {
        sale: {
          id:               @sale.id,
          number:           @sale.number,
          state:            @sale.state,
          nature_id:        @sale.nature_id,
          client_id:        @sale.client_id,
          client_name:      @sale.client&.full_name,
          invoiced_at:      @sale.invoiced_at&.iso8601,
          reference_number: @sale.reference_number,
          responsible_id:   @sale.responsible_id,
          responsible_name: @sale.responsible&.full_name,
          payment_delay:    @sale.nature&.payment_delay,
          description:      @sale.description,
          currency:         @sale.currency,
          items: @sale.items.order(:id).map { |item|
            {
              id:                    item.id,
              variant_id:            item.variant_id,
              variant_name:          item.variant&.name,
              conditioning_unit_id:  item.conditioning_unit_id,
              conditioning_unit_name: item.conditioning_unit&.name,
              conditioning_quantity: item.conditioning_quantity.to_f,
              unit_pretax_amount:    item.unit_pretax_amount.to_f,
              tax_id:                item.tax_id,
              tax_rate:              item.tax ? (item.tax.usable_amount.to_f / 100.0) : 0.0,
              reduction_percentage:  item.reduction_percentage.to_f,
              pretax_amount:         item.pretax_amount.to_f,
              amount:                item.amount.to_f,
              label:                 item.label,
              annotation:            nil,
            }
          },
        },
        natures: SaleNature.actives.reorder(:name).map { |n|
          { id: n.id, name: n.name, currency: n.currency, payment_delay: n.payment_delay }
        },
        taxes: Tax.current.map { |t|
          { id: t.id, name: t.name, short_label: t.short_label, amount: t.usable_amount.to_f / 100.0 }
        },
        errors: {},
      }
    end

    def create
      @sale = Sale.new(sale_params)
      if @sale.save
        redirect_to backend_sale_path(@sale), notice: 'Vente créée avec succès.'
      else
        errors = @sale.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
        render inertia: 'Backend/Ventes/Form', props: {
          sale: {
            id: nil, number: nil, state: nil,
            nature_id:        @sale.nature_id,
            client_id:        @sale.client_id,
            client_name:      @sale.client&.full_name,
            invoiced_at:      @sale.invoiced_at&.iso8601,
            reference_number: @sale.reference_number,
            responsible_id:   @sale.responsible_id,
            responsible_name: @sale.responsible&.full_name,
            payment_delay:    @sale.nature&.payment_delay,
            description:      @sale.description,
            currency:         @sale.currency || 'XOF',
            items: @sale.items.map { |item|
              {
                id: item.id, variant_id: item.variant_id, variant_name: item.variant&.name,
                conditioning_unit_id: item.conditioning_unit_id,
                conditioning_unit_name: item.conditioning_unit&.name,
                conditioning_quantity: item.conditioning_quantity.to_f,
                unit_pretax_amount: item.unit_pretax_amount.to_f,
                tax_id: item.tax_id,
                tax_rate: item.tax ? (item.tax.usable_amount.to_f / 100.0) : 0.0,
                reduction_percentage: item.reduction_percentage.to_f,
                pretax_amount: item.pretax_amount.to_f, amount: item.amount.to_f,
                label: item.label, annotation: nil,
              }
            },
          },
          natures: SaleNature.actives.reorder(:name).map { |n|
            { id: n.id, name: n.name, currency: n.currency, payment_delay: n.payment_delay }
          },
          taxes: Tax.current.map { |t|
            { id: t.id, name: t.name, short_label: t.short_label, amount: t.usable_amount.to_f / 100.0 }
          },
          errors:,
        }, status: :unprocessable_entity
      end
    end

    def update
      return unless @sale = find_and_check
      if @sale.update(sale_params)
        redirect_to backend_sale_path(@sale), notice: 'Vente mise à jour.'
      else
        errors = @sale.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v }
        render inertia: 'Backend/Ventes/Form', props: {
          sale: {
            id:               @sale.id,
            number:           @sale.number,
            state:            @sale.state,
            nature_id:        @sale.nature_id,
            client_id:        @sale.client_id,
            client_name:      @sale.client&.full_name,
            invoiced_at:      @sale.invoiced_at&.iso8601,
            reference_number: @sale.reference_number,
            responsible_id:   @sale.responsible_id,
            responsible_name: @sale.responsible&.full_name,
            payment_delay:    @sale.nature&.payment_delay,
            description:      @sale.description,
            currency:         @sale.currency,
            items: @sale.items.map { |item|
              {
                id: item.id, variant_id: item.variant_id, variant_name: item.variant&.name,
                conditioning_unit_id: item.conditioning_unit_id,
                conditioning_unit_name: item.conditioning_unit&.name,
                conditioning_quantity: item.conditioning_quantity.to_f,
                unit_pretax_amount: item.unit_pretax_amount.to_f,
                tax_id: item.tax_id,
                tax_rate: item.tax ? (item.tax.usable_amount.to_f / 100.0) : 0.0,
                reduction_percentage: item.reduction_percentage.to_f,
                pretax_amount: item.pretax_amount.to_f, amount: item.amount.to_f,
                label: item.label, annotation: nil,
              }
            },
          },
          natures: SaleNature.actives.reorder(:name).map { |n|
            { id: n.id, name: n.name, currency: n.currency, payment_delay: n.payment_delay }
          },
          taxes: Tax.current.map { |t|
            { id: t.id, name: t.name, short_label: t.short_label, amount: t.usable_amount.to_f / 100.0 }
          },
          errors:,
        }, status: :unprocessable_entity
      end
    end

    def duplicate
      return unless @sale = find_and_check

      unless @sale.duplicatable?
        notify_error :sale_is_not_duplicatable
        redirect_to params[:redirect] || { action: :index }
        return
      end
      copy = @sale.duplicate(responsible: current_user.person)
      redirect_to params[:redirect] || { action: :show, id: copy.id }
    end

    def cancel
      return unless @sale = find_and_check

      url = { controller: :sale_credits, action: :new, credited_sale_id: @sale.id }
      url[:redirect] = params[:redirect] if params[:redirect]
      redirect_to url
    end

    def confirm
      return unless @sale = find_and_check

      if FinancialYearExchange.opened.at(@sale.invoiced_at).any?
        notify_error :financial_year_exchange_on_this_period
      else
        @sale.confirm
      end
      redirect_to action: :show, id: @sale.id
    end

    def contacts
      if request.xhr?
        address_id = nil
        client = if params[:selected] && address = EntityAddress.find_by(id: params[:selected])
                   address.entity
                 else
                   Entity.find_by(id: params[:client_id])
                 end
        if client
          session[:current_entity_id] = client.id
          address_id = (address ? address.id : client.default_mail_address.id)
        end
        @sale = Sale.find_by(id: params[:sale_id]) || Sale.new(address_id: address_id, delivery_address_id: address_id, invoice_address_id: address_id)
        render partial: 'addresses_form', locals: { client: client, object: @sale }
      else
        redirect_to action: :index
      end
    end

    def abort
      return unless @sale = find_and_check

      @sale.abort
      redirect_to action: :show, id: @sale.id
    end

    def correct
      return unless @sale = find_and_check

      @sale.correct
      redirect_to action: :show, id: @sale.id
    end

    def invoice
      return unless @sale = find_and_check

      if @sale.invoiced_at.nil?
        notify_error :sale_invoiced_at_missing
        redirect_to action: :edit, id: @sale.id
        return
      end

      if FinancialYearExchange.opened.at(@sale.invoiced_at).any?
        notify_error :financial_year_exchange_on_this_period
      elsif @sale.client.client_account.present?
        ApplicationRecord.transaction do
          raise ActiveRecord::Rollback unless @sale.invoice
        end
      else
        notify_error :error_client_account_empty
      end
      redirect_to action: :show, id: @sale.id
    end

    def propose
      return unless @sale = find_and_check

      if @sale.invoiced_at.nil?
        notify_error :sale_invoiced_at_missing
        redirect_to action: :edit, id: @sale.id
      else
        @sale.propose
        redirect_to action: :show, id: @sale.id
      end
    end

    def propose_and_invoice
      return unless @sale = find_and_check

      if @sale.invoiced_at.nil?
        notify_error :sale_invoiced_at_missing
        redirect_to action: :edit, id: @sale.id
        return
      end

      ApplicationRecord.transaction do
        raise ActiveRecord::Rollback unless @sale.propose
        raise ActiveRecord::Rollback unless @sale.confirm
        # raise ActiveRecord::Rollback unless @sale.deliver
        raise ActiveRecord::Rollback unless @sale.invoice
      end
      redirect_to action: :show, id: @sale.id
    end

    def refuse
      return unless @sale = find_and_check

      @sale.refuse
      redirect_to action: :show, id: @sale.id
    end

    def default_conditioning_unit
      product = ProductNatureVariant.find_by_id(params[:id].to_i)
      unit_id = product&.default_unit_id
      render json: {
        unit_id: unit_id.to_s,
        unit_name: Unit.find_by_id(unit_id)&.name&.to_s
      }
    end

    def conditioning_ratio
      conditioning = Conditioning.find_by_id(params[:id].to_i)
      coefficient = conditioning&.coefficient
      render json: { coeff: coefficient }
    end

    def conditioning_ratio_presence
      render json: Sale.find_by_id(params[:id])&.ratio_conditioning?
    end

    def email_client
      return unless @sale = find_and_check

      unless @sale.client.default_email_address
        notify_error :client_default_email_address_missing
        return
      end

      if @sale.parcels.any? && @sale.invoice?
        nature = :sales_invoice_shipment
      elsif @sale.invoice?
        nature = :sales_invoice
      elsif @sale.order?
        nature = :sales_order
      elsif @sale.estimate? || @sale.draft? || @sale.refused?
        nature = :sales_estimate
      end

      existing_document = Document.of(nature.to_s, @sale.number).reorder(:created_at)
      document_template = DocumentTemplate.find_active_template(nature, 'odt')

      if existing_document.any?
        document = existing_document.last
        SaleExportJob.perform_later(@sale, document, current_user)
        notify_success :email_in_preparation
      elsif document_template
        document = generate_n_send_pdf_for(@sale, document_template, true)
        SaleExportJob.perform_later(@sale, document, current_user)
        notify_success :document_and_email_in_preparation
      else
        notify_error :document_template_missing
      end

      redirect_to action: :show, id: @sale.id
    end

    private

      def generate_n_send_pdf_for(sale, template, only_archive = false)
        klass = printer_class(template.nature)
        if klass.nil?
          notify_error(:document_template_not_handled, nature: template.nature)

          return false
        end

        g = Ekylibre::DocumentManagement::DocumentGenerator.build
        printer = klass.new(template: template, sale: sale)
        pdf_data = g.generate_pdf(template: template, printer: printer)

        archiver = Ekylibre::DocumentManagement::DocumentArchiver.build
        document = archiver.archive_document(
          pdf_content: pdf_data,
          template: template,
          key: printer.key,
          name: printer.document_name
        )
        if only_archive
          document
        else
          send_data pdf_data, filename: "#{printer.document_name}.pdf", type: 'application/pdf', disposition: 'inline'
          true
        end
      end

      def printer_class(nature)
        case nature
        when 'sales_invoice'  then Printers::Sale::SalesInvoicePrinter
        when 'sales_invoice_shipment'  then Printers::Sale::SalesInvoiceShipmentPrinter
        when 'sales_order'    then Printers::Sale::SalesOrderPrinter
        when 'sales_estimate' then Printers::Sale::SalesEstimatePrinter
        else nil
        end
      end

      def sale_params
        params.require(:sale).permit(
          :nature_id, :client_id, :invoiced_at, :reference_number,
          :responsible_id, :description,
          items_attributes: [
            :id, :variant_name, :conditioning_quantity, :unit_pretax_amount,
            :tax_id, :reduction_percentage, :_destroy, :position
          ]
        )
      end

      def create_response
        respond_with(@sale, methods: %i[taxes_amount affair_closed client_number sales_conditions sales_mentions],
                            include: { address: { methods: [:mail_coordinate] },
                                       nature: { include: { payment_mode: { include: :cash } } },
                                       supplier: { methods: [:picture_path], include: { default_mail_address: { methods: [:mail_coordinate] }, websites: {}, emails: {}, mobiles: {} } },
                                       responsible: {},
                                       credits: {},
                                       parcels: { methods: %i[human_delivery_mode human_delivery_nature items_quantity], include: {
                                         address: {},
                                         sender: {},
                                         recipient: {}
                                       } },
                                       affair: { methods: [:balance], include: [incoming_payments: { include: :mode }] },
                                       invoice_address: { methods: [:mail_coordinate] },
                                       items: { methods: %i[taxes_amount tax_name tax_short_label], include: [:variant, :shipment_item, :shipment, shipment_items: { include: %i[product parcel] }] } })
      end
  end
end
