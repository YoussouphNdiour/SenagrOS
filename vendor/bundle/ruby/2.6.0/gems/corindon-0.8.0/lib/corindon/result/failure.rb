# frozen_string_literal: true

module Corindon
  module Result
    class Failure < Result
      # @return [Exception]
      attr_reader :error

      # @param [Exception] error
      def initialize(error)
        super()

        @error = error
      end

      # @raise [Exception]
      def unwrap!
        raise error
      end

      # @return [Boolean]
      def failure?
        true
      end
    end
  end
end
