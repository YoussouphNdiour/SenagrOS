# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Testing
      # Defines the `mock_definition` on Container allowing to mock services returned by the container for a given Definition
      module MockUtils
        refine Container do
          # Allow to provide a specific value that the definition will resolve to
          # @param [Definition] definition
          # @param [Object] value
          def mock_definition(definition, value)
            singleton_class.prepend MockUtils unless is_a?(MockUtils)

            add_definition(definition) if !has?(definition)

            id = to_id(definition)
            mocks[definition] = services[id] = value
          end
        end

        using self

        def mocks
          @mocks ||= {}
        end

        def dup
          new_instance = super

          mocks.each do |definition, value|
            new_instance.mock_definition(definition, value)
          end

          new_instance
        end
      end
    end
  end
end
