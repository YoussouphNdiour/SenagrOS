# frozen_string_literal: true

require 'semantic'

module Corindon
  module DependencyInjection
    class Definition
      attr_reader :object_source
      attr_reader :args
      attr_reader :kwargs
      attr_reader :calls
      attr_reader :tags
      # @return [String]
      attr_reader :id

      def initialize(object_source, args: [], kwargs: {}, calls: [], tags: [], id: nil)
        @object_source = object_source
        @args = args
        @kwargs = kwargs
        @calls = calls
        @tags = tags
        @id = id
      end

      # @param [Injector] injector
      # @return [Object]
      def build(injector)
        source = if object_source.is_a?(Class)
                   [object_source, :new]
                 else
                   injector.resolve(object_source)
                 end

        object = RubyCompat.do_call(*source, injector.resolve(args), injector.resolve(kwargs))

        calls.each do |(call, call_args, call_kwargs)|
          RubyCompat.do_call(object, call, injector.resolve(call_args), injector.resolve(call_kwargs))
        end

        object
      end
    end
  end
end
