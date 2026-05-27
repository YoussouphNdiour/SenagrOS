# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Token
      class ServiceCallToken < InjectionToken
        attr_reader :service
        attr_reader :method
        attr_reader :args
        attr_reader :kwargs

        def initialize(service:)
          super()

          @service = service
          @args = []
          @kwargs = {}
        end

        def call(method, *args, **kwargs)
          @method = method
          @args = args
          @kwargs = kwargs

          self
        end

        # @param [Injector] injector
        def resolve(injector:)
          RubyCompat.do_call(
            injector.resolve(service),
            method,
            injector.resolve(args),
            injector.resolve(kwargs)
          )
        end
      end
    end
  end
end
