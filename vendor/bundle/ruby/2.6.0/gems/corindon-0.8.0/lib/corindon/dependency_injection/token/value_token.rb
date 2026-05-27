# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Token
      class ValueToken < InjectionToken
        attr_reader :value

        # @param [Object] value
        def initialize(value:)
          super()

          @value = value
        end

        def resolve(*)
          @value
        end
      end
    end
  end
end
