# -*- encoding: utf-8 -*-
# stub: iban-tools 1.1.0 ruby lib

Gem::Specification.new do |s|
  s.name = "iban-tools".freeze
  s.version = "1.1.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Iulian Dogariu".freeze, "Tor Erik Linnerud".freeze]
  s.date = "2016-01-04"
  s.description = "Validates IBAN account numbers".freeze
  s.email = ["code@iuliandogariu.com".freeze, "tor@alphasights.com".freeze]
  s.homepage = "https://github.com/alphasights/iban-tools".freeze
  s.licenses = ["MIT".freeze]
  s.requirements = ["none".freeze]
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "IBAN validator".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_development_dependency(%q<rspec>.freeze, ["~> 3.1"])
      s.add_development_dependency(%q<coveralls>.freeze, ["~> 0.7"])
    else
      s.add_dependency(%q<rspec>.freeze, ["~> 3.1"])
      s.add_dependency(%q<coveralls>.freeze, ["~> 0.7"])
    end
  else
    s.add_dependency(%q<rspec>.freeze, ["~> 3.1"])
    s.add_dependency(%q<coveralls>.freeze, ["~> 0.7"])
  end
end
