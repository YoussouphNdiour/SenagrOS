# -*- encoding: utf-8 -*-
# stub: i18n-complements 1.1.1 ruby lib

Gem::Specification.new do |s|
  s.name = "i18n-complements".freeze
  s.version = "1.1.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Brice Texier".freeze]
  s.date = "2021-03-22"
  s.email = "burisu@oneiros.fr".freeze
  s.extra_rdoc_files = ["LICENSE".freeze, "README.rdoc".freeze]
  s.files = ["LICENSE".freeze, "README.rdoc".freeze]
  s.homepage = "http://github.com/burisu/i18n-complements".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "I18n missing functionnalities".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<i18n>.freeze, [">= 0.6"])
      s.add_development_dependency(%q<coveralls>.freeze, [">= 0.6.3"])
      s.add_development_dependency(%q<term-ansicolor>.freeze, [">= 0"])
      s.add_development_dependency(%q<minitest>.freeze, [">= 0"])
      s.add_development_dependency(%q<rake>.freeze, ["> 10"])
    else
      s.add_dependency(%q<i18n>.freeze, [">= 0.6"])
      s.add_dependency(%q<coveralls>.freeze, [">= 0.6.3"])
      s.add_dependency(%q<term-ansicolor>.freeze, [">= 0"])
      s.add_dependency(%q<minitest>.freeze, [">= 0"])
      s.add_dependency(%q<rake>.freeze, ["> 10"])
    end
  else
    s.add_dependency(%q<i18n>.freeze, [">= 0.6"])
    s.add_dependency(%q<coveralls>.freeze, [">= 0.6.3"])
    s.add_dependency(%q<term-ansicolor>.freeze, [">= 0"])
    s.add_dependency(%q<minitest>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, ["> 10"])
  end
end
