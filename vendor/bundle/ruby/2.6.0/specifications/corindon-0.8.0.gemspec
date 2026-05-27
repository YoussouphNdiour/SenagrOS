# -*- encoding: utf-8 -*-
# stub: corindon 0.8.0 ruby lib

Gem::Specification.new do |s|
  s.name = "corindon".freeze
  s.version = "0.8.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["R\u00E9mi Piotaix".freeze]
  s.date = "2021-02-11"
  s.email = "remi@piotaix.fr".freeze
  s.homepage = "https://gitlab.com/piotaixr/corindon".freeze
  s.licenses = ["LGPL-3.0-only".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.6.0".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "A collection of tools for Ruby".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<semantic>.freeze, ["~> 1.6"])
      s.add_runtime_dependency(%q<zeitwerk>.freeze, ["~> 2.3"])
      s.add_development_dependency(%q<bundler>.freeze, [">= 0"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.14"])
      s.add_development_dependency(%q<minitest-reporters>.freeze, ["~> 1.4"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_development_dependency(%q<rubocop>.freeze, ["= 1.3.1"])
    else
      s.add_dependency(%q<semantic>.freeze, ["~> 1.6"])
      s.add_dependency(%q<zeitwerk>.freeze, ["~> 2.3"])
      s.add_dependency(%q<bundler>.freeze, [">= 0"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.14"])
      s.add_dependency(%q<minitest-reporters>.freeze, ["~> 1.4"])
      s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_dependency(%q<rubocop>.freeze, ["= 1.3.1"])
    end
  else
    s.add_dependency(%q<semantic>.freeze, ["~> 1.6"])
    s.add_dependency(%q<zeitwerk>.freeze, ["~> 2.3"])
    s.add_dependency(%q<bundler>.freeze, [">= 0"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.14"])
    s.add_dependency(%q<minitest-reporters>.freeze, ["~> 1.4"])
    s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
    s.add_dependency(%q<rubocop>.freeze, ["= 1.3.1"])
  end
end
