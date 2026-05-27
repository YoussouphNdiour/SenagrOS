# frozen_string_literal: true

module Corindon
  module DependencyInjection
    class Container
      using Something::Ext

      attr_reader :injector

      # @param [Array<Definition>] definitions
      # @param [ParameterBag] parameters
      def initialize(definitions: [], parameters: ParameterBag.new, service_built_listeners: [])
        @services = {}
        @definitions = {}
        @parameters = parameters
        @tags = Hash.new { |hash, key| hash[key] = [] }

        @injector = Injector.new(container: self)

        definitions.each { |d| register_definition(d) }

        @service_built_listeners = service_built_listeners
      end

      # @return [Container]
      def dup
        Container.new(
          definitions: definitions.values,
          parameters: ParameterBag.new(parameters.bag.dup),
          service_built_listeners: service_built_listeners
        )
      end

      # @param [Definition, Injectable, Class]
      # @return [Definition]
      def as_definition(def_or_injectable)
        if def_or_injectable.is_a?(Definition)
          def_or_injectable
        elsif def_or_injectable.is_a?(Injectable)
          def_or_injectable.definition
        elsif def_or_injectable.is_a?(Class)
          Definition.new(def_or_injectable)
        else
          raise StandardError.new("Don't know how to build #{def_or_injectable}")
        end
      end

      # @param [Class, Injectable, Definition] def_or_injectable
      # @return [String]
      def add_definition(def_or_injectable, context: {}, &block)
        definition = as_definition(def_or_injectable)

        if block.sth?
          definition = Dsl.from_definition(definition).exec(context: context, &block)
        end

        id = definition.id || to_id(def_or_injectable)

        register_definition(
          Definition.new(
            definition.object_source,
            id: id,
            args: definition.args,
            kwargs: definition.kwargs,
            calls: definition.calls,
            tags: definition.tags
          )
        )

        id
      end

      # @param [String] tag
      # @return [Array<String>]
      def tagged(tag)
        if tags.key?(tag)

          tags.fetch(tag)
        else
          []
        end
      end

      # @param [Class, #to_s] key
      # @return [Boolean]
      def has?(key)
        definitions.key?(to_id(key))
      end

      # Clears all the cache of services
      def clear
        @services = {}
      end

      # @param [Class, #to_s] key
      # @return [Object]
      def get(key)
        id = to_id(key)

        if has?(key)
          services.fetch(id) { build_service(id) }
        elsif injectable?(key)
          key.definition.build(injector)
        else
          raise StandardError.new("No service #{id}")
        end
      end

      # @param [Class, String, Token::ParameterToken] key
      # @param [Object] value
      def set_parameter(key, value)
        parameters.set(key, value)
      end

      # @param [Class, String, Token::ParameterToken] key
      # @return [Boolean]
      def parameter?(key)
        parameters.has?(key)
      end

      # @param [Class, String, Token::ParameterToken] key
      # @return [Object]
      def parameter(key)
        parameters.get(key)
      end

      # @param [Proc{Object, Container}] listener
      def on_service_built(listener)
        service_built_listeners << listener
      end

      private

        # @return [Hash{String=>Definition}]
        attr_reader :definitions
        # @return [ParameterBag]
        attr_reader :parameters
        attr_reader :services
        attr_reader :tags
        attr_reader :service_built_listeners

        def register_definition(definition)
          definitions[definition.id] = definition
          definition.tags.each { |tag| tags[tag] << definition.id }
        end

        def build_service(id)
          service = injector.resolve(definitions.fetch(id)).tap do |svc|
            services[id] = svc
          end

          service_built_listeners.each do |listener|
            listener.call(service, self)
          end

          service
        end

        def injectable?(object)
          object.is_a?(Injectable)
        end

        # @param [Injectable, Identifiable, Class, Definition, #to_s] key
        # @return [String]
        def to_id(key)
          if key.is_a?(Definition)
            key.id
          elsif injectable?(key)
            to_id(key.definition)
          elsif key.is_a?(Class)
            key.name
          else
            key.to_s
          end
        end
    end
  end
end
