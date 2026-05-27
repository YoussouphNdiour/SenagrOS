# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Token
      class ServiceFactoryToken < InjectionToken
        attr_reader :service
        attr_reader :method

        def initialize(service, method)
          super()

          @service = service
          @method = method
        end

        # @param [Injector] injector
        def resolve(injector:)
          [injector.resolve(service), method]
        end
      end
    end
  end
end
