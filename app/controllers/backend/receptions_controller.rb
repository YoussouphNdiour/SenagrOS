module Backend
  class ReceptionsController < Backend::ParcelsController
    manage_restfully except: %i[index show edit new create update]

    respond_to :csv, :ods, :xlsx, :pdf, :odt, :docx, :html, :xml, :json

    before_action :save_search_preference, only: :index
    unroll

    # params:
    #   :q Text search
    #   :s State search
    #   :period Two Dates with _ separator
    #   :recipient_id
    #   :sender_id
    #   :transporter_id
    #   :delivery_mode Choice
    #   :nature Choice
    def self.receptions_conditions
      code = search_conditions(receptions: %i[number reference_number], entities: %i[full_name number]) + " ||= []\n"
      code << "if params[:period].present? && params[:period] != 'all'\n"
      code << "  if params[:period] == 'interval' \n"
      code << "    started_on = params[:started_on] \n"
      code << "    stopped_on = params[:stopped_on] \n"
      code << "  else \n"
      code << "    interval = params[:period].split('_')\n"
      code << "    started_on = interval.first\n"
      code << "    stopped_on = interval.last\n"
      code << "  end \n"
      code << "  c[0] << \" AND #{Reception.table_name}.planned_at::DATE BETWEEN ? AND ?\"\n"
      code << "  c << started_on\n"
      code << "  c << stopped_on\n"
      code << "end\n "

      code << "if params[:recipient_id].to_i > 0\n"
      code << "  c[0] << \" AND \#{Reception.table_name}.recipient_id = ?\"\n"
      code << "  c << params[:recipient_id].to_i\n"
      code << "end\n"

      code << "if params[:sender_id].to_i > 0\n"
      code << "  c[0] << \" AND \#{Reception.table_name}.sender_id = ?\"\n"
      code << "  c << params[:sender_id].to_i\n"
      code << "end\n"

      code << "if params[:transporter_id].to_i > 0\n"
      code << "  c[0] << \" AND \#{Reception.table_name}.transporter_id = ?\"\n"
      code << "  c << params[:transporter_id].to_i\n"
      code << "end\n"

      code << "if params[:responsible_id].to_i > 0\n"
      code << "  c[0] << \" AND \#{Reception.table_name}.responsible_id = ?\"\n"
      code << "  c << params[:responsible_id]\n"
      code << "end\n"

      code << "if params[:delivery_mode].present? && params[:delivery_mode] != 'all'\n"
      code << "  if Reception.delivery_mode.values.include?(params[:delivery_mode].to_sym)\n"
      code << "    c[0] << ' AND #{Reception.table_name}.delivery_mode = ?'\n"
      code << "    c << params[:delivery_mode]\n"
      code << "  end\n"
      code << "end\n"

      code << "if params[:invoice_status] && params[:invoice_status] == 'invoiced'\n"
      code << "   c[0] << ' AND #{Reception.table_name}.id IN (SELECT parcel_id FROM #{ReceptionItem.table_name} WHERE #{ReceptionItem.table_name}.type = \\'ReceptionItem\\' AND #{ReceptionItem.table_name}.purchase_invoice_item_id IS NOT NULL)'\n"
      code << "elsif params[:invoice_status] && params[:invoice_status] == 'uninvoiced'\n"
      code << "   c[0] << ' AND #{Reception.table_name}.id IN (SELECT parcel_id FROM #{ReceptionItem.table_name} WHERE #{ReceptionItem.table_name}.type = \\'ReceptionItem\\' AND #{ReceptionItem.table_name}.purchase_invoice_item_id IS NULL)'\n"
      code << "end\n"
      code << "c\n"

      code.c
    end

    list(conditions: receptions_conditions, selectable: true, order: { planned_at: :desc }) do |t|
      t.action :edit, if: :updateable?
      t.action :destroy
      t.column :number, url: true
      t.column :reference_number, hidden: true
      t.column :content_sentence, label: :contains
      t.column :planned_at
      t.column :given_at
      t.column :sender, url: true
      t.status
      t.column :state_label, hidden: true
      t.column :delivery, url: true
      t.column :responsible, url: true, hidden: true
      t.column :transporter, url: true, hidden: true
      # t.column :sent_at
      t.column :delivery_mode
      # t.column :net_mass, hidden: true
      # t.column :purchase, url: true
    end

    list(:items, model: :reception_items, order: { id: :asc }, conditions: { parcel_id: 'params[:id]'.c, role: 'service' }) do |t|
      t.column :variant, url: { controller: 'RECORD.variant.class.name.tableize'.c, namespace: :backend }
      t.column :purchase_order_number, label: :order, through: :parcel_item, url: { controller: '/backend/purchase_orders', id: 'RECORD.purchase_order_item.purchase.id'.c }
      t.column :purchase_invoice_number, label: :invoice, url: { controller: 'backend/purchase_invoices', id: 'RECORD.purchase_invoice_item.purchase.id'.c }
      t.column :product_name
      t.column :product_work_number
      t.column :conditioning_unit
      t.column :annotation, hidden: true
      t.column :conditioning_quantity, class: 'left-align'
      t.column :unit_pretax_stock_amount, currency: true
      t.column :unit_pretax_amount, currency: true
      t.column :analysis, url: true
    end

    list(:storings, model: :parcel_item_storings, order: { id: :asc }, conditions: { parcel_item_id: 'Reception.find(params[:id]).items.pluck(:id)'.c }) do |t|
      t.column :variant, label_method: :name, through: :parcel_item, url: { controller: 'RECORD.parcel_item.variant.class.name.tableize'.c, id: 'RECORD.parcel_item.variant_id'.c, namespace: :backend }
      t.column :purchase_order_number, label: :order, through: :parcel_item, url: { controller: '/backend/purchase_orders', id: 'RECORD.parcel_item.purchase_order_item.purchase.id'.c }
      t.column :purchase_invoice_number, label: :invoice, through: :parcel_item, url: { controller: '/backend/purchase_invoices', id: 'RECORD.parcel_item.purchase_invoice_item.purchase.id'.c }
      t.column :product_name, through: :parcel_item
      t.column :product_work_number, through: :parcel_item
      t.column :storage, url: true
      t.column :product, url: true
      t.column :conditioning_unit
      t.column :conditioning_quantity
      t.column :unit_pretax_stock_amount, currency: true, through: :parcel_item
      t.column :unit_pretax_amount, currency: true, through: :parcel_item
      t.column :analysis, url: true, through: :parcel_item
    end

    def index
      @receptions = Reception.joins('INNER JOIN entities ON entities.id = parcels.sender_id')

      if params[:q].present?
        q = "%#{params[:q].downcase}%"
        @receptions = @receptions.where(
          'LOWER(parcels.number) ILIKE ? OR LOWER(parcels.reference_number) ILIKE ? OR LOWER(entities.full_name) ILIKE ?',
          q, q, q
        )
      end

      if params[:state].is_a?(Array) && params[:state].any?
        @receptions = @receptions.where(workflow_state: params[:state])
      end

      @receptions = @receptions.order(planned_at: :desc)

      per_page    = 25
      page        = [params[:page].to_i, 1].max
      total_count = @receptions.count
      total_pages = (total_count.to_f / per_page).ceil
      @receptions = @receptions.offset((page - 1) * per_page).limit(per_page)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Receptions/ReceptionsIndex', props: {
            receptions: @receptions.map { |r|
              {
                id: r.id,
                number: r.number,
                reference_number: r.reference_number,
                state: r.state,
                planned_at: r.planned_at&.to_date&.iso8601,
                given_at: r.given_at&.to_date&.iso8601,
                supplier: { id: r.sender.id, full_name: r.sender.full_name },
                purchase_order: r.purchase ? { id: r.purchase.id, number: r.purchase.number } : nil,
                reconciliation_state: r.reconciliation_state,
                pretax_amount: r.pretax_amount.to_f,
                currency: r.currency,
                items: [],
                can_destroy: r.destroyable?,
                invoiceable: r.reconciliation_state == 'to_reconcile' && r.given?
              }
            },
            filters: { q: params[:q], state: params[:state] },
            meta: { current_page: page, total_pages: total_pages, total_count: total_count }
          }
        end
      end
    end

    def show
      return unless (@reception = find_and_check(:reception))

      t3e(@reception.attributes)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Receptions/ReceptionsShow', props: {
            reception: {
              id: @reception.id,
              number: @reception.number,
              reference_number: @reception.reference_number,
              state: @reception.state,
              planned_at: @reception.planned_at&.to_date&.iso8601,
              given_at: @reception.given_at&.to_date&.iso8601,
              supplier: { id: @reception.sender.id, full_name: @reception.sender.full_name },
              purchase_order: @reception.purchase ? { id: @reception.purchase.id, number: @reception.purchase.number } : nil,
              reconciliation_state: @reception.reconciliation_state,
              pretax_amount: @reception.pretax_amount.to_f,
              currency: @reception.currency,
              items: @reception.items.map { |i|
                {
                  id: i.id,
                  variant_name: i.variant&.name,
                  conditioning_quantity: i.conditioning_quantity.to_f,
                  unit_pretax_amount: i.unit_pretax_amount.to_f,
                  role: i.role,
                  non_compliant: i.non_compliant?,
                  annotation: i.annotation,
                  purchase_invoice_item_id: i.purchase_invoice_item_id
                }
              },
              can_destroy: @reception.destroyable?,
              invoiceable: @reception.reconciliation_state == 'to_reconcile' && @reception.given?
            }
          }
        end
      end
    end

    def edit
      return unless (@reception = find_and_check(:reception))

      t3e(@reception.attributes)

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Receptions/ReceptionsForm', props: {
            reception: {
              id: @reception.id,
              number: @reception.number,
              reference_number: @reception.reference_number,
              state: @reception.state,
              planned_at: @reception.planned_at&.to_date&.iso8601,
              given_at: @reception.given_at&.to_date&.iso8601,
              supplier: { id: @reception.sender.id, full_name: @reception.sender.full_name },
              purchase_order: @reception.purchase ? { id: @reception.purchase.id, number: @reception.purchase.number } : nil,
              reconciliation_state: @reception.reconciliation_state,
              pretax_amount: @reception.pretax_amount.to_f,
              currency: @reception.currency,
              items: @reception.items.map { |i|
                {
                  id: i.id,
                  variant_name: i.variant&.name,
                  conditioning_quantity: i.conditioning_quantity.to_f,
                  unit_pretax_amount: i.unit_pretax_amount.to_f,
                  role: i.role,
                  non_compliant: i.non_compliant?,
                  annotation: i.annotation,
                  purchase_invoice_item_id: i.purchase_invoice_item_id
                }
              },
              can_destroy: @reception.destroyable?,
              invoiceable: @reception.reconciliation_state == 'to_reconcile' && @reception.given?
            },
            purchase_orders: purchase_orders_for_select,
            errors: {}
          }
        end
      end
    end

    def new
      reception_attrs = { given_at: Date.today, items: [] }

      if params[:purchase_order_ids]
        pos = PurchaseOrder.where(id: params[:purchase_order_ids].split(','))
        supplier_ids = pos.pluck(:supplier_id).uniq
        farest_date = pos.pluck(:ordered_at).compact.min
        reception_attrs = {
          sender_id: supplier_ids.length > 1 ? nil : supplier_ids.first,
          given_at: farest_date || Date.today,
          reconciliation_state: 'reconcile',
          items: ReceivableItemsFilter.new.filter(
            pos.includes(items: [parcels_purchase_orders_items: :reception])
               .references(items: [parcels_purchase_orders_items: :reception])
          ).map { |i|
            { id: nil, variant_name: i.variant&.name,
              conditioning_quantity: i.conditioning_quantity.to_f,
              unit_pretax_amount: i.unit_pretax_amount.to_f,
              role: i.role, non_compliant: false, annotation: nil, purchase_invoice_item_id: nil }
          }
        }
        sender = supplier_ids.length == 1 ? Entity.find_by(id: supplier_ids.first) : nil
        reception_attrs[:supplier] = sender ? { id: sender.id, full_name: sender.full_name } : nil
      end

      respond_to do |format|
        format.html do
          render inertia: 'Backend/Receptions/ReceptionsForm', props: {
            reception: reception_attrs,
            purchase_orders: purchase_orders_for_select,
            errors: {}
          }
        end
      end
    end

    def create
      @reception = Reception.new(reception_params)

      if @reception.save
        redirect_to backend_reception_path(@reception)
      else
        respond_to do |format|
          format.html do
            render inertia: 'Backend/Receptions/ReceptionsForm', props: {
              reception: { items: [] },
              purchase_orders: purchase_orders_for_select,
              errors: @reception.errors.to_hash
            }, status: :unprocessable_entity
          end
        end
      end
    end

    def update
      return unless (@reception = find_and_check(:reception))

      t3e(@reception.attributes)

      if @reception.update(reception_params)
        redirect_to backend_reception_path(@reception)
      else
        respond_to do |format|
          format.html do
            render inertia: 'Backend/Receptions/ReceptionsForm', props: {
              reception: { id: @reception.id, number: @reception.number, items: [] },
              purchase_orders: purchase_orders_for_select,
              errors: @reception.errors.to_hash
            }, status: :unprocessable_entity
          end
        end
      end
    end

    def destroy
      return unless (@reception = find_and_check(:reception))

      if @reception.destroyable?
        @reception.destroy!
        redirect_to backend_receptions_path, notice: 'Réception supprimée.'
      else
        redirect_to backend_reception_path(@reception),
                    alert: 'Impossible de supprimer : cette réception est liée à une facture ou a été validée.'
      end
    end

    def give
      return unless (record = find_and_check)

      transition = Reception::Transitions::Give.new(record, given_at: record.given_at.presence || Time.zone.now)

      ok = transition.run

      unless ok
        notify_error helpers.render_transition_error(transition.error), html: true
      end

      redirect_action = ok ? :show : :edit
      redirect_to params[:redirect] || { action: redirect_action, id: record.id }
    end

    def mergeable_matters
      matters = Matter.where(id: params[:selected])
      res = matters.all? do |mat|
        %i[variant container variety derivative_of].all? do |attr|
          mat.send(attr) == matters.first.send(attr)
        end
      end
      render json: res
    end

    def merge_matters
      if params[:id]
        matters = Matter.where(id: params[:id].split(','))
        f_matter = matters.first
        new_matter = Matter.new(
          name: f_matter.name,
          variant: f_matter.variant,
          description: f_matter.description,
          initial_container: f_matter.container,
          variety: f_matter.variety,
          derivative_of: f_matter.derivative_of,
          born_at: Time.now
        )
        if matters.all?{|matter| matter.conditioning_unit == f_matter.conditioning_unit}
          new_matter.update(
            conditioning_unit: f_matter.conditioning_unit,
            initial_population: matters.sum(&:population)
          )
          new_matter.save!
        else
          new_matter.update(
            conditioning_unit: f_matter.variant.default_unit,
            initial_population: matters.sum{|matter| (matter.population * matter.conditioning_unit.coefficient)}
          )
          if (price_attributes = merged_matters_price_attributes(matters)).present?
            if (catalog_item = CatalogItem.of_variant(f_matter.variant_id).of_unit(f_matter.variant.default_unit_id).of_usage(:stock).first)
              catalog_item.update!(price_attributes)
            else
              new_matter.variant.catalog_items.create!(price_attributes)
            end
          end
          new_matter.save!
        end
        matters.each do |matter|
          ProductMovement.create!(product: matter, delta: -matter.population, started_at: Time.now)
          matter.update!(dead_at: Time.now)
        end
        redirect_to backend_matter_path(id: new_matter.id)
      else
        render json: {}
      end
    end

    private

      def merged_matters_price_attributes(matters)
        with_cost_matters = matters.reject do |matter|
          matter.variant.catalog_items.of_usage(:stock).of_unit(matter.conditioning_unit).empty?
        end
        if with_cost_matters.present?
          begin
            amount = with_cost_matters.sum do |matter|
              unit_price = matter.variant.catalog_items.of_usage(:stock).of_unit(matter.conditioning_unit).first.uncoefficiented_amount
              matter.population * matter.conditioning_unit.coefficient * unit_price
            end
            amount /= with_cost_matters.sum(&:default_unit_population)
            attributes = {
              catalog: Catalog.find_by(usage: :stock),
              all_taxes_included: false,
              amount: amount.round(2),
              unit: matters.first.variant.default_unit,
              started_at: matters.map(&:born_at).min,
              currency: Preference.get(:currency).value
            }
          rescue
            return nil
          end
        end
      end

      def reception_params
        params.require(:reception).permit(
          :sender_id, :purchase_id, :planned_at, :given_at,
          :reference_number, :delivery_mode,
          items_attributes: %i[id variant_name conditioning_quantity unit_pretax_amount
                               role non_compliant annotation _destroy]
        )
      end

      def purchase_orders_for_select
        PurchaseOrder.order(:number).map { |po| { id: po.id, number: po.number } }
      end

  end
end
