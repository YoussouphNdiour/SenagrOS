# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # Fenced Codeblock
    #
    # This parser implements codeblocks fenced by ``` or ~~~
    #
    # With a codeblock you can pass the language after the initial fenced separator
    # and use one of Kramdowns syntax highlighters
    #
    # For maximum compatibility with GitLab, use `:rouge` as your highlighter.
    #
    # Based on Kramdown GFM implementation
    #
    # @see https://docs.gitlab.com/ee/user/markdown.html#code-and-syntax-highlighting
    module FencedCodeblock
      FENCED_CODEBLOCK_START = /^[ ]{0,3}[~`]{3,}/.freeze
      FENCED_CODEBLOCK_MATCH = /^[ ]{0,3}(([~`]){3,})\s*?((\S+?)(?:\?\S*)?)?\s*?\n(.*?)^[ ]{0,3}\1\2*\s*?\n/m.freeze

      def self.included(klass)
        klass.define_parser(:codeblock_fenced_gitlab, FENCED_CODEBLOCK_START, nil, 'parse_codeblock_fenced')
      end
    end
  end
end
