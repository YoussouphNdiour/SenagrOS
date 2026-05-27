# frozen_string_literal: true

module Corindon
  module DependencyInjection
    class ParameterBag
      # @return [Hash{String => Object}]
      attr_reader :bag

      # @param [Hash{String => Object}] bag
      def initialize(bag = {})
        @bag = bag
      end

      # @param [Class, String, Token::ParameterToken] key
      # @return [Boolean]
      def has?(key)
        @bag.key?(to_key(key))
      end

      # @param [Class, String, Token::ParameterToken] key
      # @return [Object]
      def get(key)
        @bag.fetch(to_key(key))
      end

      # @param [Class, String, Token::ParameterToken] key
      # @param [Object] value
      def set(key, value)
        @bag[to_key(key)] = value
      end

      private

        def to_key(keylike)
          if keylike.is_a?(Class)
            keylike.name
          elsif keylike.is_a?(Token::ParameterToken)
            keylike.key
          elsif keylike.is_a?(String)
            keylike
          else
            raise StandardError.new("#{keylike} is not a valid key (objects of class #{keylike.class.name} are not handled.")
          end
        end
    end
  end
end
