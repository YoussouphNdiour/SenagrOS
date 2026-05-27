# frozen_string_literal: true

module Corindon
  module DependencyInjection
    class Injector
      # @return [Container]
      attr_reader :container

      # @param [Container] container
      def initialize(container:)
        @container = container
      end

      # @param [Object] value
      def resolve(value)
        if value.is_a?(Array)
          value.map(&method(:resolve))
        elsif value.is_a?(Hash)
          value.transform_values(&method(:resolve))
        elsif value.is_a?(Token::InjectionToken)
          value.resolve(injector: self)
        elsif value.is_a?(Definition)
          value.build(self)
        else
          container.get(value)
        end
      end
    end
  end
end
