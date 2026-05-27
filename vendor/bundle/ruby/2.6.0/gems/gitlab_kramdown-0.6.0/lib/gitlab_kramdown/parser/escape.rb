# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # Escape chars support
    #
    # This is a standalone parser because making it so is an optimization
    #
    # Based on Kramdown GFM implementation
    module Escape
      ESCAPED_CHARS_GFM = /\\([\\.*_+`<>()\[\]{}#!:\|"'\$=\-~])/.freeze

      def self.included(klass)
        klass.define_parser(:escape_chars_gitlab, ESCAPED_CHARS_GFM, '\\\\', :parse_escaped_chars)
      end
    end
  end
end
