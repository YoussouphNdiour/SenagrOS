# frozen_string_literal: true

module GitlabKramdown
  # GitLab Kramdown Parser
  #
  # All GitLab extensions to Kramdown are implemented as a Parser in this module
  module Parser
    autoload :Autolink, 'gitlab_kramdown/parser/autolink'
    autoload :Escape, 'gitlab_kramdown/parser/escape'
    autoload :FencedBlockquote, 'gitlab_kramdown/parser/fenced_blockquote'
    autoload :FencedCodeblock, 'gitlab_kramdown/parser/fenced_codeblock'
    autoload :Header, 'gitlab_kramdown/parser/header'
    autoload :Reference, 'gitlab_kramdown/parser/reference'
    autoload :Strikethrough, 'gitlab_kramdown/parser/strikethrough'
  end
end
