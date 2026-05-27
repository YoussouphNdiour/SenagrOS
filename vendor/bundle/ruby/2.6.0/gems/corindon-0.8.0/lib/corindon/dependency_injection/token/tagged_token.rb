# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Token
      class TaggedToken < InjectionToken
        # @return [String] tag
        attr_reader :tag

        # @param [String] tag
        def initialize(tag)
          super()

          @tag = tag
        end

        # @param [Injector] injector
        def resolve(injector:)
          injector.container.tagged(tag).map { |id| injector.resolve(id) }
        end
      end
    end
  end
end
