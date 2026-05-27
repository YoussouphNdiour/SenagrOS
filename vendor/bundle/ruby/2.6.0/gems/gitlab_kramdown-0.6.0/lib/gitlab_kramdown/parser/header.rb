# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # Header with embedded link anchor
    #
    # This parser implements header with additional a tag linking to own anchor
    # For best results, some CSS styling can be used to emulate :hover behavior
    #
    # @see https://docs.gitlab.com/ee/user/markdown.html#headers
    module Header
      HEADER_ID = /(?:[ \t]+\{#([A-Za-z][\w:-]*)\})?/.freeze
      SETEXT_HEADER_START = %r{
        ^(#{Kramdown::Parser::Kramdown::OPT_SPACE}[^ \t].*?)
          #{HEADER_ID}[ \t]*?\n
          (-|=)+\s*?\n
      }x.freeze

      def self.included(klass)
        klass.define_parser(:setext_gitlab_header, SETEXT_HEADER_START)
        klass.define_parser(:atx_gitlab_header, ATX_HEADER_START)
      end

      # Parse the Setext header at the current location.
      def parse_setext_gitlab_header
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size
        text, id, level = @src[1], @src[2], @src[3]
        text.strip!

        el = new_block_el(:header, nil, nil, level: (level == '-' ? 2 : 1), raw_text: text, location: start_line_number)
        add_text(text, el)
        el.attr['id'] = id || generate_header_id(text)

        if @options[:linkable_headers]
          el.children << Kramdown::Element.new(:a, nil, {
                                                 'href' => "##{el.attr['id']}",
                                                 'title' => 'Permalink',
                                                 'class' => 'anchor'
                                               }, location: start_line_number)
        end

        @tree.children << el
        true
      end

      ATX_HEADER_START = /^\#{1,6}/.freeze
      ATX_HEADER_MATCH = /^(\#{1,6})(.+?(?:\\#)?)\s*?#*#{HEADER_ID}\s*?\n/.freeze

      # Parse the Atx header at the current location.
      def parse_atx_gitlab_header
        start_line_number = @src.current_line_number
        @src.check(ATX_HEADER_MATCH)
        level, text, id = @src[1], @src[2].to_s.strip, @src[3]
        return false if text.empty?

        @src.pos += @src.matched_size

        el = new_block_el(:header, nil, nil, level: level.length, raw_text: text, location: start_line_number)
        add_text(text, el)
        el.attr['id'] = id || generate_header_id(text)

        if @options[:linkable_headers]
          el.children << Kramdown::Element.new(:a, nil, {
                                                 'href' => "##{el.attr['id']}",
                                                 'title' => 'Permalink',
                                                 'class' => 'anchor'
                                               }, location: start_line_number)
        end

        @tree.children << el
        true
      end

      NON_WORD_RE = /[^\p{Word}\- \t]/.freeze

      def generate_header_id(text)
        result = text.downcase
        result.gsub!(NON_WORD_RE, '')
        result.tr!(" \t", '-')
        @id_counter[result] += 1
        result << (@id_counter[result].positive? ? "-#{@id_counter[result]}" : '')
      end
    end
  end
end
