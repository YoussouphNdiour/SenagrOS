# frozen_string_literal: true

module Corindon
  module DependencyInjection
    class RubyCompat
      class << self
        if ::Semantic::Version.new(RUBY_VERSION).satisfies?('>= 2.7.0')
          def do_call(obj, method, args, kwargs)
            obj.send(method, *args, **kwargs)
          end
        else
          def do_call(obj, method, args, kwargs)
            if args.empty? && kwargs.empty?
              obj.send(method)
            elsif args.empty?
              obj.send(method, **kwargs)
            elsif kwargs.empty?
              obj.send(method, *args)
            else
              obj.send(method, *args, **kwargs)
            end
          end
        end
      end
    end
  end
end
