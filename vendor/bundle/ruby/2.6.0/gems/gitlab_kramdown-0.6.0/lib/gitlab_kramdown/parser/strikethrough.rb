# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # Strikethrough
    #
    # This parser implements strikethrough markup based on GFM
    # used as-is in GitLab Flavored Markdown
    #
    # Based on Kramdown GFM implementation
    #
    # @see https://docs.gitlab.com/ee/user/markdown.html#emphasis
    module Strikethrough
      STRIKETHROUGH_DELIM = /~~/.freeze
      STRIKETHROUGH_MATCH = %r{
        (?<re>
          #{STRIKETHROUGH_DELIM} # start with ~~
          (?!\s|~)               # not followed by ~ or space (negative lookahead)
          (?:\g<re>|.*?)*        # recursive <re> or lazy match anything
          (?<!\s|~)              # something different than space and ~ (negative lookbehind)
          #{STRIKETHROUGH_DELIM} # end with ~~
        )
      }x.freeze

      def self.included(klass)
        klass.define_parser(:strikethrough_gitlab, STRIKETHROUGH_MATCH, '~~')
      end

      def parse_strikethrough_gitlab
        line_number = @src.current_line_number

        @src.pos += @src.matched_size
        el = Kramdown::Element.new(:html_element, 'del', {}, category: :span, line: line_number)
        @tree.children << el

        env = save_env
        reset_env(src: Kramdown::Utils::StringScanner.new(@src.matched[2..-3], line_number), text_type: :text)
        parse_spans(el)
        restore_env(env)

        el
      end
    end
  end
end
