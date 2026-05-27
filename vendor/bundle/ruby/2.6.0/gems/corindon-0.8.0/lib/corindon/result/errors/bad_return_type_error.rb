# frozen_string_literal: true

module Corindon
  module Result
    module Errors
      class BadReturnTypeError < ResultError
        # @return [Object]
        attr_reader :value

        # @param [Object] value
        def initialize(value)
          super("Expected a Result, got #{value}")

          @value = value
        end
      end
    end
  end
end
