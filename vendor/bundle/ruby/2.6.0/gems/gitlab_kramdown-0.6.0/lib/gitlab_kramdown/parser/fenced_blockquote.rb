# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # Multiline Blockquote
    #
    # This parser implements multiline blockquotes fenced by `>>>`
    #
    # @see https://docs.gitlab.com/ee/user/markdown.html#multiline-blockquote
    module FencedBlockquote
      FENCED_BLOCKQUOTE_START = />{3}/x.freeze

      FENCED_BLOCKQUOTE_MATCH = %r{
        ^(?<delimiter>>{3})   # line must start with >>>
        \s*                   # any amount of trailling whitespace
        \n                    # followed by a linebreak
        (?<content>[\S\s]+)   # at least one non whitespace chracter
        \n
        \k<delimiter>         # same delimiter used to open the block
        [ \t]*                # any amount of trailling whitespace
        \s
      }xm.freeze

      def self.included(klass)
        klass.define_parser(:fenced_blockquote, FENCED_BLOCKQUOTE_START)
      end

      def parse_fenced_blockquote
        if @src.check(FENCED_BLOCKQUOTE_MATCH)
          start_line_number = @src.current_line_number
          @src.pos += @src.matched_size

          el = new_block_el(:blockquote, nil, nil, location: start_line_number)

          content = parse_inner_fenced_content(@src[:content])
          el.children = content
          @tree.children << el
          true
        else
          false
        end
      end

      private

      def parse_inner_fenced_content(content)
        parsed = Kramdown::Parser::GitlabKramdown.parse(content, @options)
        parsed[0].children
      end
    end
  end
end
