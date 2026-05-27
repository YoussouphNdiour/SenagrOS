# frozen_string_literal: true

module Corindon
  module Something
    module Ext
      refine Object do
        def sth?
          !nil?
        end
      end
    end
  end
end
