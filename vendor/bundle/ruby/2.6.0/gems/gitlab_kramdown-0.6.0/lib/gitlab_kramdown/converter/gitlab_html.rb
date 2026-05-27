# frozen_string_literal: true

require 'kramdown/converter/html'

module GitlabKramdown
  module Converter
    # Converts a Kramdown::Document to HTML.
    #
    # This includes GitLab custom elements from GitLab Flavored Markdown syntax
    module GitlabHtml
      # Codeblock is customized in order to implement a different output to Mermaid
      #
      # Mermaid requires `<div class="mermaid"></div>` surrounding the content in order
      # to trigger the unobtrusive JS.
      def convert_codeblock(element, opts)
        if element.options[:lang] == 'mermaid'
          %(<div class="mermaid">#{element.value}</div>\n)
        else
          super
        end
      end
    end
  end
end
