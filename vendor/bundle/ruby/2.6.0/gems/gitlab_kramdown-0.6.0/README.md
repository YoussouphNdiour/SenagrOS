# GitLab Kramdown

This is an official gem that implements [GitLab flavored Markdown] extensions on top of [Kramdown].

> **Note**: This is not the same code that runs on GitLab. The [GitLab flavored Markdown] runs on top of
CommonMark with extensions implemented inside the Rails application.

## GitLab Flavored Markdown extensions support

This is a list of GitLab Flavored Markdown (GFM) extensions and their status of support on this gem:

| GFM Extensions                  | Implemented? |
|---------------------------------|--------------|
| [Newlines]                      | No           |
| [Multiple underscores in words] | _Kramdown_   |
| [Headers with Anchors]          | **Yes**      |
| [URL auto-linking]              | **Yes**      |
| [Multiline Blockquote]          | **Yes**      |
| [Code and Syntax Highlighting]  | **Yes**      |
| [Strikethrough]                 | **Yes**      |
| [Inline Diff]                   | No           |
| [Emoji]                         | No           |
| [Special GitLab references]     | **Yes**      |
| [Task Lists]                    | No           |
| [Videos]                        | No           |
| [Math]                          | No           |
| [Colors]                        | No           |
| [Mermaid]                       | **Yes**      |

> **Note**: Extensions marked as `Kramdown` in the `Implemented?` means behavior already exists
  in Kramdown flavor.

## Configuration parameters

| Parameter          | Default              | Description                                  |
| :------------------| :------------------: | -------------------------------------------- |
| `gitlab_url`       | `https://gitlab.com` | GitLab instance URL to build reference links |
| `linkable_headers` | true                 | Generate anchor tags with headers?           |
| `autolink`         | false                | Converts URLs to HTML links (can be slow)    | 

## Usage example

To use this gem you're also required to install [Kramdown]. This gem will hook into Kramdown and provide custom
parser.

```ruby
require 'kramdown'
require 'gitlab_kramdown'

source = <<-EOF
# GFM example

We support custom extensions like:

>>>
This is a multiline
Blockquote

Using `>>>` as delimiter
>>>
EOF

Kramdown::Document.new(source, input: 'GitlabKramdown').to_html
```

To have also syntax highlighting using the same engine GitLab use, you need to define the highlighter as `:rouge`:

```ruby
Kramdown::Document.new(source, input: 'GitlabKramdown', syntax_highlighter: :rouge).to_html
```

## Contributing to gitlab_kramdown

* Check out the latest master to make sure the feature hasn't been implemented or the bug hasn't been fixed yet.
* Check out the issue tracker to make sure someone already hasn't requested it and/or contributed it.
* Fork the project.
* Start a feature/bugfix branch.
* Commit and push until you are happy with your contribution.
* Make sure to add tests for it. This is important so I don't break it in a future version unintentionally.
* Please try not to mess with the Rakefile, version, or history. If you want to have your own version,
  or is otherwise necessary, that is fine, but please isolate to its own commit so I can cherry-pick around it.

## Copyright

Copyright (c) 2018-2019 Gabriel Mazetto. See LICENSE.txt for
further details.

[GitLab flavored Markdown]: https://docs.gitlab.com/ee/user/markdown.html
[Kramdown]: https://kramdown.gettalong.org/
[Newlines]: https://docs.gitlab.com/ee/user/markdown.html#newlines
[Multiple underscores in words]: https://docs.gitlab.com/ee/user/markdown.html#multiple-underscores-in-words
[Headers with Anchors]: https://docs.gitlab.com/ee/user/markdown.html#headers
[URL auto-linking]: https://docs.gitlab.com/ee/user/markdown.html#url-auto-linking
[Multiline Blockquote]: https://docs.gitlab.com/ee/user/markdown.html#multiline-blockquote
[Code and Syntax Highlighting]: https://docs.gitlab.com/ee/user/markdown.html#code-and-syntax-highlighting
[Strikethrough]: https://docs.gitlab.com/ee/user/markdown.html#emphasis
[Inline Diff]: https://docs.gitlab.com/ee/user/markdown.html#inline-diff
[Emoji]: https://docs.gitlab.com/ee/user/markdown.html#emoji
[Special GitLab references]: https://docs.gitlab.com/ee/user/markdown.html#special-gitlab-references
[Task Lists]: https://docs.gitlab.com/ee/user/markdown.html#task-lists
[Videos]: https://docs.gitlab.com/ee/user/markdown.html#videos
[Math]: https://docs.gitlab.com/ee/user/markdown.html#math
[Colors]: https://docs.gitlab.com/ee/user/markdown.html#colors
[Mermaid]: https://docs.gitlab.com/ee/user/markdown.html#mermaid
