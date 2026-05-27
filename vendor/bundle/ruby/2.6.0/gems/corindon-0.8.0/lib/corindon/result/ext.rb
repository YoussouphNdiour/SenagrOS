# frozen_string_literal: true

module Corindon
  module Result
    module Ext
      refine Object do
        def rescue_failure(&block)
          block.call
        rescue StandardError => error
          Corindon::Result::Failure.new(error)
        end

        # rubocop:disable Naming/MethodName
        def Failure(error)
          Corindon::Result::Failure.new(error)
        end

        def Success(value)
          Corindon::Result::Success.new(value)
        end
        # rubocop:enable Naming/MethodName
      end
    end
  end
end
