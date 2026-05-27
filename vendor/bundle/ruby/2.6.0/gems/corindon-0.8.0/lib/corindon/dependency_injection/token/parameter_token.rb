# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Token
      class ParameterToken < InjectionToken
        attr_reader :key

        def initialize(key:)
          super()

          @key = key
        end

        # @param [Injector] injector
        def resolve(injector:)
          injector.container.parameter(key)
        end
      end
    end
  end
end
