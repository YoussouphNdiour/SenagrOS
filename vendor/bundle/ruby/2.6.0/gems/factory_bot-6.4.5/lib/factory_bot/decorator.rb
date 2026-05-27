module FactoryBot
  class Decorator < BasicObject
    undef_method :==

    def initialize(component)
      @component = component
    end

    def method_missing(*args, &block) # rubocop:disable Style/MethodMissingSuper
      @component.send(*args, &block)
    end

    def send(*args, &block)
      __send__(*args, &block)
    end

    def respond_to_missing?(name, include_private = false)
      @component.respond_to?(name, true) || super
    end

    def self.const_missing(name)
      ::Object.const_get(name)
    end
  end
end
