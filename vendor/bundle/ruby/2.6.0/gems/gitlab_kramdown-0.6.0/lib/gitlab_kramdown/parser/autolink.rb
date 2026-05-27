# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # URL auto-linking
    #
    # This parser implements URL auto-linking support for the most widely used schemas
    #
    # @see https://docs.gitlab.com/ee/user/markdown.html#url-auto-linking
    module Autolink
      PUNCTUATION_PAIRS = /['"][)\]}][(\[{]/.freeze
      ACHARS = /[[:alnum:]]_/.freeze

      AUTOLINK_START = %r{
        (?<uri>
          (?<schema>mailto|https?|ftps?|irc|smb):
          [^\s\[\]>]+
          (?<!\?|!|\.|,|:)
        |
          [-.#{ACHARS}]+@[-#{ACHARS}]+(?:\.[-#{ACHARS}]+)*\.[a-z]+
        )
      }x.freeze

      def self.included(klass)
        klass.define_parser(:gitlab_autolink, AUTOLINK_START)
      end

      # Parse the autolink at the current location.
      def parse_gitlab_autolink
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        # current StringScanner has limitations that prevent lookbehind to work properly
        # so we can't use something like this: `(?<!\[)(?<!\]\()`. Using a negative lookbehind
        # would improve performance on the cases where it would prevent a match.
        #
        # There is an alternative we could explore: https://github.com/luikore/zscan which
        # does fix the current limitations, but them we are depending on another third party gem.
        #
        # Instead of depending on a third party, I'm opting for a simple fix that achieve the same
        # results but without the performance improvements:
        if @src.pre_match.end_with?('[', '](')
          add_text(@src[:uri])

          return
        end

        href = (@src[:schema].nil? ? "mailto:#{@src[:uri]}" : @src[:uri])
        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)

        add_text(@src[:uri].sub(/^mailto:/, ''), el)
        @tree.children << el
      end
    end
  end
end
