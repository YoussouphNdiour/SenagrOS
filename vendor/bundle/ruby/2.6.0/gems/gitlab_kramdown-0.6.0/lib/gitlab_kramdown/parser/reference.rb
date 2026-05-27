# frozen_string_literal: true

module GitlabKramdown
  module Parser
    # Special GitLab References
    #
    # This parser implements any non context-specific reference as described
    # in the GitLab Flavored Markdown reference
    #
    # @see https://docs.gitlab.com/ee/user/markdown.html#special-gitlab-references
    module Reference
      PATH_REGEX = /[a-zA-Z0-9_\.][a-zA-Z0-9_\-\.]+/.freeze

      NAMESPACE_FORMAT_REGEX = %r{
        (?:#{PATH_REGEX}[a-zA-Z0-9_\-])
        (?<!\.git|\.atom)
        |[a-zA-Z0-9_]
      }x.freeze

      FULL_NAMESPACE_FORMAT_REGEX = %r{(#{NAMESPACE_FORMAT_REGEX}/)*#{NAMESPACE_FORMAT_REGEX}}.freeze
      ALWAYS_FULL_NAMESPACE_FORMAT_REGEX = %r{(#{NAMESPACE_FORMAT_REGEX}/)+#{NAMESPACE_FORMAT_REGEX}}.freeze

      USER_GROUP_PATTERN = %r{
        #{Regexp.escape('@')}
        (?<user>#{FULL_NAMESPACE_FORMAT_REGEX})
      }x.freeze

      PROJECT_COMMIT_PATTERN = %r{
        (?<namespace>#{ALWAYS_FULL_NAMESPACE_FORMAT_REGEX})
        #{Regexp.escape('@')}
        (?<commit>[a-f0-9]{7,40})
        (?!\.{3})
      }x.freeze

      PROJECT_COMMIT_DIFF_PATTERN = %r{
        (?<namespace>#{ALWAYS_FULL_NAMESPACE_FORMAT_REGEX})
        #{Regexp.escape('@')}
        (?<commit_source>[a-f0-9]{7,40})
        \.{3}
        (?<commit_target>[a-f0-9]{7,40})
      }x.freeze

      PROJECT_ISSUE_PATTERN = %r{
        (?<namespace>#{ALWAYS_FULL_NAMESPACE_FORMAT_REGEX})
        #{Regexp.escape('#')}
        (?<issue>[1-9][0-9]*)
      }x.freeze

      PROJECT_MERGE_REQUEST_PATTERN = %r{
        (?<namespace>#{ALWAYS_FULL_NAMESPACE_FORMAT_REGEX})
        #{Regexp.escape('!')}
        (?<merge_request>[1-9][0-9]*)
      }x.freeze

      PROJECT_SNIPPET_PATTERN = %r{
        (?<namespace>#{ALWAYS_FULL_NAMESPACE_FORMAT_REGEX})
        #{Regexp.escape('$')}
        (?<snippet>[1-9][0-9]*)
      }x.freeze

      PROJECT_LABEL_PATTERN = %r{
        (?<namespace>#{ALWAYS_FULL_NAMESPACE_FORMAT_REGEX})
        #{Regexp.escape('~')}
        (?<label>
          [A-Za-z0-9_\-\?\.&]+ | # String-based single-word label title, or
          ".+?"                  # String-based multi-word label surrounded in quotes
        )
      }x.freeze

      def self.included(klass)
        klass.define_parser(:user_group_mention, USER_GROUP_PATTERN, '@')
        klass.define_parser(:commit, PROJECT_COMMIT_PATTERN, '@')
        klass.define_parser(:commit_diff, PROJECT_COMMIT_DIFF_PATTERN, '@')
        klass.define_parser(:issue, PROJECT_ISSUE_PATTERN, '#')
        klass.define_parser(:merge_request, PROJECT_MERGE_REQUEST_PATTERN, '\!')
        klass.define_parser(:snippet, PROJECT_SNIPPET_PATTERN, '\$')
        klass.define_parser(:label, PROJECT_LABEL_PATTERN, '\~')
      end

      def parse_user_group_mention
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        # should not start with anything that looks like project/namespace
        if @src.pre_match.match?(/[a-zA-Z0-9_\-]\Z/)
          add_text(@src[0])
          return
        end

        href = "#{@options[:gitlab_url]}/#{@src[:user]}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end

      def parse_commit
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        href = "#{@options[:gitlab_url]}/#{@src[:namespace]}/commit/#{@src[:commit]}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end

      def parse_commit_diff
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        href = "#{@options[:gitlab_url]}/#{@src[:namespace]}/compare/" \
               "#{@src[:commit_source]}...#{@src[:commit_target]}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end

      def parse_issue
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        href = "#{@options[:gitlab_url]}/#{@src[:namespace]}/issues/#{@src[:issue]}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end

      def parse_merge_request
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        href = "#{@options[:gitlab_url]}/#{@src[:namespace]}/merge_requests/#{@src[:merge_request]}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end

      def parse_snippet
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        href = "#{@options[:gitlab_url]}/#{@src[:namespace]}/snippets/#{@src[:snippet]}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end

      def parse_label
        start_line_number = @src.current_line_number
        @src.pos += @src.matched_size

        label_param = @src[:label].delete('"').tr(' ', '+')
        href = "#{@options[:gitlab_url]}/#{@src[:namespace]}/issues?label_name=#{label_param}"

        el = Kramdown::Element.new(:a, nil, { 'href' => href }, location: start_line_number)
        add_text(@src[0], el)
        @tree.children << el
      end
    end
  end
end
