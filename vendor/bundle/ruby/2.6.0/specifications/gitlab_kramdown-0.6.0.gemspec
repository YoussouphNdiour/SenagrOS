# -*- encoding: utf-8 -*-
# stub: gitlab_kramdown 0.6.0 ruby lib

Gem::Specification.new do |s|
  s.name = "gitlab_kramdown".freeze
  s.version = "0.6.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "bug_tracker_uri" => "http://gitlab.com/gitlab-org/gitlab_kramdown/issues", "changelog_uri" => "http://gitlab.com/gitlab-org/gitlab_kramdown/blob/master/CHANGELOG.md", "homepage_uri" => "http://gitlab.com/gitlab-org/gitlab_kramdown", "source_code_uri" => "http://gitlab.com/gitlab-org/gitlab_kramdown" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Gabriel Mazetto".freeze]
  s.date = "2019-05-07"
  s.description = "GitLab Flavored Markdown extensions on top of Kramdown markup. Tries to be as close as possible to existing extensions.".freeze
  s.email = "brodock@gmail.com".freeze
  s.extra_rdoc_files = ["LICENSE.txt".freeze, "README.md".freeze]
  s.files = ["LICENSE.txt".freeze, "README.md".freeze]
  s.homepage = "http://gitlab.com/gitlab-org/gitlab_kramdown".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new("~> 2.4".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "GitLab Flavored Kramdown".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<kramdown>.freeze, ["~> 1.16.2"])
      s.add_runtime_dependency(%q<rouge>.freeze, ["~> 3.0"])
      s.add_development_dependency(%q<rdoc>.freeze, ["~> 3.12"])
      s.add_development_dependency(%q<bundler>.freeze, ["~> 1.0"])
      s.add_development_dependency(%q<juwelier>.freeze, ["~> 2.1.0"])
      s.add_development_dependency(%q<simplecov>.freeze, [">= 0"])
      s.add_development_dependency(%q<rubocop>.freeze, [">= 0"])
      s.add_development_dependency(%q<rspec>.freeze, [">= 0"])
      s.add_development_dependency(%q<rspec_junit_formatter>.freeze, [">= 0"])
      s.add_development_dependency(%q<benchmark-ips>.freeze, ["~> 2.7"])
    else
      s.add_dependency(%q<kramdown>.freeze, ["~> 1.16.2"])
      s.add_dependency(%q<rouge>.freeze, ["~> 3.0"])
      s.add_dependency(%q<rdoc>.freeze, ["~> 3.12"])
      s.add_dependency(%q<bundler>.freeze, ["~> 1.0"])
      s.add_dependency(%q<juwelier>.freeze, ["~> 2.1.0"])
      s.add_dependency(%q<simplecov>.freeze, [">= 0"])
      s.add_dependency(%q<rubocop>.freeze, [">= 0"])
      s.add_dependency(%q<rspec>.freeze, [">= 0"])
      s.add_dependency(%q<rspec_junit_formatter>.freeze, [">= 0"])
      s.add_dependency(%q<benchmark-ips>.freeze, ["~> 2.7"])
    end
  else
    s.add_dependency(%q<kramdown>.freeze, ["~> 1.16.2"])
    s.add_dependency(%q<rouge>.freeze, ["~> 3.0"])
    s.add_dependency(%q<rdoc>.freeze, ["~> 3.12"])
    s.add_dependency(%q<bundler>.freeze, ["~> 1.0"])
    s.add_dependency(%q<juwelier>.freeze, ["~> 2.1.0"])
    s.add_dependency(%q<simplecov>.freeze, [">= 0"])
    s.add_dependency(%q<rubocop>.freeze, [">= 0"])
    s.add_dependency(%q<rspec>.freeze, [">= 0"])
    s.add_dependency(%q<rspec_junit_formatter>.freeze, [">= 0"])
    s.add_dependency(%q<benchmark-ips>.freeze, ["~> 2.7"])
  end
end
