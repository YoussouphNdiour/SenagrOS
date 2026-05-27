# -*- encoding: utf-8 -*-
# stub: rjb-loader 0.0.2 ruby lib

Gem::Specification.new do |s|
  s.name = "rjb-loader".freeze
  s.version = "0.0.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Marlus Saraiva".freeze]
  s.date = "2013-08-23"
  s.description = "When working with multiple gems or several rails initializer files that use Rjb, \n                     you need to make sure that all java dependencies of each implementation \n                     gets set up before running Rjb::load. This is necessary because Rjb can be loaded only once.\n                     You can use rjb-loader to change classpath and java options, by adding 'before_load' to your gem or rails initializer.\n                     The 'after_load' hook can be used when your code needs an already loaded Rjb. \n                     For instance, when you need to import and use java classes.".freeze
  s.email = "marlussaraiva@grupofortes.com.br".freeze
  s.homepage = "https://github.com/fortesinformatica/rjb-loader".freeze
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Rjb loader with before_load and after_load hooks".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rjb>.freeze, [">= 1.4.8"])
      s.add_runtime_dependency(%q<rails>.freeze, [">= 3.2"])
    else
      s.add_dependency(%q<rjb>.freeze, [">= 1.4.8"])
      s.add_dependency(%q<rails>.freeze, [">= 3.2"])
    end
  else
    s.add_dependency(%q<rjb>.freeze, [">= 1.4.8"])
    s.add_dependency(%q<rails>.freeze, [">= 3.2"])
  end
end
