# frozen_string_literal: true

module Corindon
  module Guards
    module Ext
      refine Object do
        def unimplemented!(message = nil)
          raise NotImplementedError.new(message || 'This method is not implemented.')
        end

        def unreachable!(message = nil)
          raise StandardError.new(message || 'Reached unreachable code.')
        end
      end
    end
  end
end
