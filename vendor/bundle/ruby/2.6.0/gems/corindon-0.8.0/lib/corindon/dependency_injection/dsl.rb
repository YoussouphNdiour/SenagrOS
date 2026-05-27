# frozen_string_literal: true

module Corindon
  module DependencyInjection
    class Dsl
      class << self
        # @param [Definition] definition
        # @return [Dsl]
        def from_definition(definition)
          new(
            definition.object_source,
            id: definition.id,
            args: definition.args,
            kwargs: definition.kwargs,
            calls: definition.calls,
            tags: definition.tags
          )
        end
      end

      # @param [Class] klass
      def initialize(klass, args: [], kwargs: {}, id: nil, calls: [], tags: [])
        @klass = klass
        @args = args
        @kwargs = kwargs
        @calls = calls
        @tags = tags
        @id = id
      end

      # @param [Hash] context
      # @return [Definition]
      def exec(context: {}, &block)
        if context.is_a?(Hash)
          context = OpenStruct.new(context)
        end

        instance_exec(context, &block)

        Definition.new(@klass, args: @args, kwargs: @kwargs, calls: @calls, tags: @tags, id: @id)
      end

      def args(*arguments, **kv_arguments)
        @args = arguments
        @kwargs = kv_arguments
      end

      # @param [String] name
      def call(name, *arguments, **kv_arguments)
        @calls << [name, arguments, kv_arguments]
      end

      # @param [String] id
      def id(id)
        @id = id
      end

      # @param [Class, #to_s] key
      # @return [Token::ParameterToken]
      def param(key)
        Token::ParameterToken.new(key: key)
      end

      # @param [String] tag
      def tag(tag)
        @tags << tag
      end

      # @return [Token::ServiceCallToken]
      def on(id)
        Token::ServiceCallToken.new(service: id)
      end

      # @return [Token::ValueToken]
      def value(val)
        Token::ValueToken.new(value: val)
      end

      # @param [String] tag
      # @return [Token::TaggedToken]
      def tagged(tag)
        Token::TaggedToken.new(tag)
      end
    end
  end
end
