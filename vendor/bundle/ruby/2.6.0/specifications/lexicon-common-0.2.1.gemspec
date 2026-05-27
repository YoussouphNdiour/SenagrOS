# -*- encoding: utf-8 -*-
# stub: lexicon-common 0.2.1 ruby lib

Gem::Specification.new do |s|
  s.name = "lexicon-common".freeze
  s.version = "0.2.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Ekylibre developers".freeze]
  s.date = "2023-02-22"
  s.email = ["dev@ekylibre.com".freeze]
  s.homepage = "https://www.ekylibre.com".freeze
  s.licenses = ["AGPL-3.0-only".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.6.0".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Common classes and services for Ekylibre's Lexicon".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<aws-sdk-s3>.freeze, ["~> 1.84"])
      s.add_runtime_dependency(%q<colored>.freeze, ["~> 1.2"])
      s.add_runtime_dependency(%q<concurrent-ruby>.freeze, ["~> 1.1"])
      s.add_runtime_dependency(%q<corindon>.freeze, ["~> 0.8.0"])
      s.add_runtime_dependency(%q<json_schemer>.freeze, ["~> 0.2.16"])
      s.add_runtime_dependency(%q<pg>.freeze, ["~> 1.2"])
      s.add_runtime_dependency(%q<semantic>.freeze, ["~> 1.6"])
      s.add_runtime_dependency(%q<zeitwerk>.freeze, ["~> 2.4"])
      s.add_development_dependency(%q<bundler>.freeze, ["~> 2.0"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.14"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_development_dependency(%q<rubocop>.freeze, ["= 1.11.0"])
    else
      s.add_dependency(%q<aws-sdk-s3>.freeze, ["~> 1.84"])
      s.add_dependency(%q<colored>.freeze, ["~> 1.2"])
      s.add_dependency(%q<concurrent-ruby>.freeze, ["~> 1.1"])
      s.add_dependency(%q<corindon>.freeze, ["~> 0.8.0"])
      s.add_dependency(%q<json_schemer>.freeze, ["~> 0.2.16"])
      s.add_dependency(%q<pg>.freeze, ["~> 1.2"])
      s.add_dependency(%q<semantic>.freeze, ["~> 1.6"])
      s.add_dependency(%q<zeitwerk>.freeze, ["~> 2.4"])
      s.add_dependency(%q<bundler>.freeze, ["~> 2.0"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.14"])
      s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_dependency(%q<rubocop>.freeze, ["= 1.11.0"])
    end
  else
    s.add_dependency(%q<aws-sdk-s3>.freeze, ["~> 1.84"])
    s.add_dependency(%q<colored>.freeze, ["~> 1.2"])
    s.add_dependency(%q<concurrent-ruby>.freeze, ["~> 1.1"])
    s.add_dependency(%q<corindon>.freeze, ["~> 0.8.0"])
    s.add_dependency(%q<json_schemer>.freeze, ["~> 0.2.16"])
    s.add_dependency(%q<pg>.freeze, ["~> 1.2"])
    s.add_dependency(%q<semantic>.freeze, ["~> 1.6"])
    s.add_dependency(%q<zeitwerk>.freeze, ["~> 2.4"])
    s.add_dependency(%q<bundler>.freeze, ["~> 2.0"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.14"])
    s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
    s.add_dependency(%q<rubocop>.freeze, ["= 1.11.0"])
  end
end
