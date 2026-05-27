# frozen_string_literal: true

using Corindon::Guards::Ext

module Corindon
  module Result
    class Result
      # @return [Boolean]
      def success?
        false
      end

      # @return [Boolean]
      def failure?
        false
      end

      # @raise [Exception] if called on a Failure
      # @return [Object]
      def unwrap!
        unimplemented!
      end

      # @yieldparam [Object] value
      # @yieldreturn [Result]
      # @return [Result]
      def and_then(&_block)
        self
      end
    end
  end
end
