# -*- encoding: utf-8 -*-
# stub: onoma 0.9.8 ruby lib

Gem::Specification.new do |s|
  s.name = "onoma".freeze
  s.version = "0.9.8"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Ekylibre developers".freeze]
  s.date = "2025-05-22"
  s.description = "Actual support Open-Nomenclature data and gem for use".freeze
  s.email = ["dev@ekylibre.com".freeze]
  s.homepage = "https://gitlab.com/ekylibre/onoma".freeze
  s.licenses = ["AGPL-3.0-only".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.4.4".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Provides open nomenclature data in a gem".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<activesupport>.freeze, [">= 4.2"])
      s.add_runtime_dependency(%q<nokogiri>.freeze, [">= 1.10.4"])
      s.add_runtime_dependency(%q<zeitwerk>.freeze, ["~> 2.4.0"])
      s.add_development_dependency(%q<bundler>.freeze, ["> 1.15"])
      s.add_development_dependency(%q<i18n-tasks>.freeze, [">= 0"])
      s.add_development_dependency(%q<minitest>.freeze, [">= 0"])
      s.add_development_dependency(%q<rake>.freeze, ["> 12.0"])
      s.add_development_dependency(%q<rubocop>.freeze, ["= 1.3.1"])
    else
      s.add_dependency(%q<activesupport>.freeze, [">= 4.2"])
      s.add_dependency(%q<nokogiri>.freeze, [">= 1.10.4"])
      s.add_dependency(%q<zeitwerk>.freeze, ["~> 2.4.0"])
      s.add_dependency(%q<bundler>.freeze, ["> 1.15"])
      s.add_dependency(%q<i18n-tasks>.freeze, [">= 0"])
      s.add_dependency(%q<minitest>.freeze, [">= 0"])
      s.add_dependency(%q<rake>.freeze, ["> 12.0"])
      s.add_dependency(%q<rubocop>.freeze, ["= 1.3.1"])
    end
  else
    s.add_dependency(%q<activesupport>.freeze, [">= 4.2"])
    s.add_dependency(%q<nokogiri>.freeze, [">= 1.10.4"])
    s.add_dependency(%q<zeitwerk>.freeze, ["~> 2.4.0"])
    s.add_dependency(%q<bundler>.freeze, ["> 1.15"])
    s.add_dependency(%q<i18n-tasks>.freeze, [">= 0"])
    s.add_dependency(%q<minitest>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, ["> 12.0"])
    s.add_dependency(%q<rubocop>.freeze, ["= 1.3.1"])
  end
end
