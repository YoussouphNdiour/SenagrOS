# frozen_string_literal: true

require 'kramdown/parser'

module Kramdown
  module Parser
    # Used for parsing documents in GitLab Flavored Markdown like format.
    #
    # This is not 100% compatible with GFM used in GitLab application as it
    # includes extensions available only in kramdown.
    class GitlabKramdown < Kramdown::Parser::Kramdown
      include ::GitlabKramdown::Parser::Autolink
      include ::GitlabKramdown::Parser::Escape
      include ::GitlabKramdown::Parser::FencedBlockquote
      include ::GitlabKramdown::Parser::FencedCodeblock
      include ::GitlabKramdown::Parser::Header
      include ::GitlabKramdown::Parser::Reference
      include ::GitlabKramdown::Parser::Strikethrough

      def initialize(source, options)
        super

        @options[:gitlab_url] ||= 'https://gitlab.com'
        @options[:autolink] = false if @options[:autolink].nil?
        @options[:linkable_headers] = true if @options[:linkable_headers].nil?
        @id_counter = Hash.new(-1)

        prepend_span_parsers(:gitlab_autolink) if @options[:autolink]
        prepend_span_parsers(:escape_chars_gitlab, :commit_diff, :commit, :user_group_mention,
                             :issue, :merge_request, :snippet, :label, :strikethrough_gitlab)
        prepend_block_parsers(:fenced_blockquote)
        replace_block_parser!(:codeblock_fenced, :codeblock_fenced_gitlab)
        replace_block_parser!(:atx_header, :atx_gitlab_header)
        replace_block_parser!(:setext_header, :setext_gitlab_header)
      end

      private

      def replace_block_parser!(original, new)
        index = @block_parsers.index(original)

        return false unless index

        @block_parsers[index] = new
      end

      def prepend_span_parsers(*parsers)
        @span_parsers.unshift(*parsers)
      end

      def prepend_block_parsers(*parsers)
        @block_parsers.unshift(*parsers)
      end
    end
  end
end
