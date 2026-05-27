# frozen_string_literal: true

module Corindon
  module DependencyInjection
    module Injectable
      refine Class do
        def factory(service, method)
          Token::ServiceFactoryToken.new(service, method)
        end

        def make_parameter(name)
          Token::ParameterToken.new(key: "#{self.name.downcase.gsub(/::/, '.')}.#{name}")
        end

        def make_definition(name, source, *args, **kwargs, &block)
          do_make_definition("#{self.name.downcase.gsub(/::/, '.')}.#{name}", source, args: args, kwargs: kwargs, &block)
        end

        def injectable(*args, **kwargs, &block)
          extend Injectable

          define_singleton_method :definition do
            do_make_definition(name, self, args: args, kwargs: kwargs, &block)
          end
        end

        private

          def do_make_definition(name, source, args:, kwargs:, &block)
            if block.nil?
              Definition.new(source, args: args, kwargs: kwargs, id: name)
            else
              Dsl.new(source, args: args, kwargs: kwargs, id: name).exec(&block)
            end
          end
      end
    end
  end
end
