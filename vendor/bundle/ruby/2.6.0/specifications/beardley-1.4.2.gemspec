# -*- encoding: utf-8 -*-
# stub: beardley 1.4.2 ruby lib

Gem::Specification.new do |s|
  s.name = "beardley".freeze
  s.version = "1.4.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Brice Texier".freeze]
  s.date = "2017-06-28"
  s.description = "Generate reports using JasperReports reporting tool".freeze
  s.email = "burisu@oneiros.fr".freeze
  s.homepage = "https://github.com/ekylibre/beardley".freeze
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "JasperReports integration".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rjb>.freeze, [">= 1.4.8"])
      s.add_runtime_dependency(%q<rjb-loader>.freeze, [">= 0.0.2"])
      s.add_development_dependency(%q<minitest>.freeze, [">= 0"])
      s.add_development_dependency(%q<rake>.freeze, [">= 10"])
      s.add_development_dependency(%q<coveralls>.freeze, [">= 0.6"])
      s.add_development_dependency(%q<bundler>.freeze, ["> 1"])
      s.add_development_dependency(%q<term-ansicolor>.freeze, ["> 1"])
    else
      s.add_dependency(%q<rjb>.freeze, [">= 1.4.8"])
      s.add_dependency(%q<rjb-loader>.freeze, [">= 0.0.2"])
      s.add_dependency(%q<minitest>.freeze, [">= 0"])
      s.add_dependency(%q<rake>.freeze, [">= 10"])
      s.add_dependency(%q<coveralls>.freeze, [">= 0.6"])
      s.add_dependency(%q<bundler>.freeze, ["> 1"])
      s.add_dependency(%q<term-ansicolor>.freeze, ["> 1"])
    end
  else
    s.add_dependency(%q<rjb>.freeze, [">= 1.4.8"])
    s.add_dependency(%q<rjb-loader>.freeze, [">= 0.0.2"])
    s.add_dependency(%q<minitest>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, [">= 10"])
    s.add_dependency(%q<coveralls>.freeze, [">= 0.6"])
    s.add_dependency(%q<bundler>.freeze, ["> 1"])
    s.add_dependency(%q<term-ansicolor>.freeze, ["> 1"])
  end
end
