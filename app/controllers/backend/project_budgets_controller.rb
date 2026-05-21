module Backend
  class ProjectBudgetsController < Backend::BaseController
    layout 'inertia', only: %i[index show new edit]

    before_action :set_budget, only: %i[show edit update destroy]

    def index
      scope = ProjectBudget.order(:name).page(params[:page]).per(25)
      budgets = scope.map { |b|
        {
          id:                      b.id,
          name:                    b.name.to_s,
          description:             b.description,
          isacompta_analytic_code: b.isacompta_analytic_code,
          purchase_items_count:    b.purchase_items.count,
          reception_items_count:   b.reception_items.count
        }
      }
      render inertia: 'Backend/Budgets/Index', props: {
        budgets: budgets,
        meta: {
          total:    scope.total_count,
          page:     (params[:page] || 1).to_i,
          per_page: 25
        }
      }
    end

    def show
      purchase_lines = @budget.purchase_items.includes(:purchase, :variant).map { |item|
        {
          id:              item.id,
          label:           item.label.presence || item.variant_name.to_s,
          quantity:        item.quantity.to_f,
          pretax_amount:   item.pretax_amount.to_f,
          currency:        item.currency.to_s,
          purchase_number: item.purchase&.number.to_s
        }
      }
      total_pretax = @budget.purchase_items.sum(:pretax_amount).to_f

      render inertia: 'Backend/Budgets/Show', props: {
        budget:              budget_json(@budget),
        purchase_lines:      purchase_lines,
        total_pretax_amount: total_pretax
      }
    rescue ActiveRecord::StatementInvalid, PG::Error => e
      Rails.logger.error("[ProjectBudgetsController#show] DB error: #{e.message}")
      render inertia: 'Backend/Budgets/Show', props: {
        budget:              budget_json(@budget),
        purchase_lines:      [],
        total_pretax_amount: 0.0
      }
    end

    def new
      @budget = ProjectBudget.new
      render inertia: 'Backend/Budgets/Form', props: {
        budget: budget_json(@budget),
        errors: {},
        mode:   'new'
      }
    end

    def edit
      render inertia: 'Backend/Budgets/Form', props: {
        budget: budget_json(@budget),
        errors: {},
        mode:   'edit'
      }
    end

    def create
      @budget = ProjectBudget.new(budget_params)
      if @budget.save
        redirect_to backend_project_budget_path(@budget)
      else
        render inertia: 'Backend/Budgets/Form', props: {
          budget: budget_json(@budget),
          errors: @budget.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v },
          mode:   'new'
        }, status: :unprocessable_entity
      end
    end

    def update
      if @budget.update(budget_params)
        redirect_to backend_project_budget_path(@budget)
      else
        render inertia: 'Backend/Budgets/Form', props: {
          budget: budget_json(@budget),
          errors: @budget.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v },
          mode:   'edit'
        }, status: :unprocessable_entity
      end
    end

    def destroy
      @budget.destroy
      redirect_to backend_project_budgets_path
    end

    private

      def set_budget
        @budget = ProjectBudget.find(params[:id])
      end

      def budget_params
        params.require(:project_budget).permit(:name, :description, :isacompta_analytic_code)
      end

      def budget_json(budget)
        {
          id:                      budget.id || 0,
          name:                    budget.name.to_s,
          description:             budget.description,
          isacompta_analytic_code: budget.isacompta_analytic_code,
          purchase_items_count:    budget.persisted? ? budget.purchase_items.count : 0,
          reception_items_count:   budget.persisted? ? budget.reception_items.count : 0
        }
      end
  end
end
