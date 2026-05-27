# -*- encoding: utf-8 -*-
# stub: inertia_rails 2.0.1 ruby lib

Gem::Specification.new do |s|
  s.name = "inertia_rails".freeze
  s.version = "2.0.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "changelog_uri" => "https://github.com/inertiajs/inertia-rails/CHANGELOG.md", "homepage_uri" => "https://github.com/inertiajs/inertia-rails", "source_code_uri" => "https://github.com/inertiajs/inertia-rails" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Brian Knoles".freeze, "Brandon Shar".freeze, "Eugene Granovsky".freeze]
  s.bindir = "exe".freeze
  s.date = "2022-07-12"
  s.email = ["brain@bellawatt.com".freeze, "brandon@bellawatt.com".freeze, "eugene@bellawatt.com".freeze]
  s.homepage = "https://github.com/inertiajs/inertia-rails".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Inertia adapter for Rails".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rails>.freeze, [">= 5"])
      s.add_development_dependency(%q<bundler>.freeze, ["~> 2.0"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_development_dependency(%q<rspec-rails>.freeze, ["~> 4.0"])
      s.add_development_dependency(%q<rails-controller-testing>.freeze, [">= 0"])
      s.add_development_dependency(%q<sqlite3>.freeze, [">= 0"])
      s.add_development_dependency(%q<appraisal>.freeze, [">= 0"])
      s.add_development_dependency(%q<responders>.freeze, [">= 0"])
    else
      s.add_dependency(%q<rails>.freeze, [">= 5"])
      s.add_dependency(%q<bundler>.freeze, ["~> 2.0"])
      s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_dependency(%q<rspec-rails>.freeze, ["~> 4.0"])
      s.add_dependency(%q<rails-controller-testing>.freeze, [">= 0"])
      s.add_dependency(%q<sqlite3>.freeze, [">= 0"])
      s.add_dependency(%q<appraisal>.freeze, [">= 0"])
      s.add_dependency(%q<responders>.freeze, [">= 0"])
    end
  else
    s.add_dependency(%q<rails>.freeze, [">= 5"])
    s.add_dependency(%q<bundler>.freeze, ["~> 2.0"])
    s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
    s.add_dependency(%q<rspec-rails>.freeze, ["~> 4.0"])
    s.add_dependency(%q<rails-controller-testing>.freeze, [">= 0"])
    s.add_dependency(%q<sqlite3>.freeze, [">= 0"])
    s.add_dependency(%q<appraisal>.freeze, [">= 0"])
    s.add_dependency(%q<responders>.freeze, [">= 0"])
  end
end
