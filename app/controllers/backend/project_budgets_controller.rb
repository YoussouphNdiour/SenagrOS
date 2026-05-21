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
      render inertia: 'Backend/Budgets/Show', props: { budget: budget_json(@budget) }
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
