# frozen_string_literal: true

module Corindon
  module Result
    class Success < Result
      # @return [Object]
      attr_reader :value

      # @param [Object] value
      def initialize(value)
        super()

        @value = value
      end

      # @return [Boolean]
      def success?
        true
      end

      # @return [Object]
      def unwrap!
        value
      end

      def and_then(&block)
        retval = block.call(value)

        if retval.is_a?(Result)
          retval
        else
          Failure.new(Errors::BadReturnTypeError.new(retval))
        end
      rescue StandardError => error
        Failure.new(error)
      end
    end
  end
end
