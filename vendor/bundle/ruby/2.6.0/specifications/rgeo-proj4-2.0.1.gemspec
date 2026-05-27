# -*- encoding: utf-8 -*-
# stub: rgeo-proj4 2.0.1 ruby lib
# stub: ext/proj4_c_impl/extconf.rb

Gem::Specification.new do |s|
  s.name = "rgeo-proj4".freeze
  s.version = "2.0.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Tee Parham, Daniel Azuma".freeze]
  s.date = "2020-10-09"
  s.description = "Proj4 extension for rgeo.".freeze
  s.email = ["parhameter@gmail.com, dazuma@gmail.com".freeze]
  s.extensions = ["ext/proj4_c_impl/extconf.rb".freeze]
  s.files = ["ext/proj4_c_impl/extconf.rb".freeze]
  s.homepage = "https://github.com/rgeo/rgeo-proj4".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.3.0".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Proj4 extension for rgeo.".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rgeo>.freeze, ["~> 2.0"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.11"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 12.0"])
      s.add_development_dependency(%q<rake-compiler>.freeze, ["~> 1.0"])
    else
      s.add_dependency(%q<rgeo>.freeze, ["~> 2.0"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.11"])
      s.add_dependency(%q<rake>.freeze, ["~> 12.0"])
      s.add_dependency(%q<rake-compiler>.freeze, ["~> 1.0"])
    end
  else
    s.add_dependency(%q<rgeo>.freeze, ["~> 2.0"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.11"])
    s.add_dependency(%q<rake>.freeze, ["~> 12.0"])
    s.add_dependency(%q<rake-compiler>.freeze, ["~> 1.0"])
  end
end
