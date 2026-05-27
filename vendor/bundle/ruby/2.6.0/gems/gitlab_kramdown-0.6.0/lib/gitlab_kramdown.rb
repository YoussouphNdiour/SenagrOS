# frozen_string_literal: true

require 'kramdown/parser'
require 'kramdown/converter'

# GitLab Kramdown implements Markdown flavored extensions on top of Kramdown
#
# This modules includes parser extensions that will be available as `GitlabKramdown`
# input option for Kramdown gem.
#
# Not all extensions are available as some of the requires access to context information
# that is only available on GitLab application.
#
# To use Kramdown with this extensions initialize your Kramdown::Document with:
#
#    Kramdown::Document.new(source, input: 'GitlabKramdown')
#
module GitlabKramdown
  autoload :VERSION, 'gitlab_kramdown/version'
  autoload :Parser, 'gitlab_kramdown/parser'

  # Gitlab Kramdown custom Converters
  module Converter
    autoload :GitlabHtml, 'gitlab_kramdown/converter/gitlab_html'
  end
end

# Autoload extensions
Kramdown::Parser.autoload :GitlabKramdown, 'kramdown/parser/gitlab_kramdown'

# Custom HTML extensions
Kramdown::Converter::Html.prepend(GitlabKramdown::Converter::GitlabHtml)
