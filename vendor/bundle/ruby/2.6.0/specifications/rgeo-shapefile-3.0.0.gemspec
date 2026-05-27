# -*- encoding: utf-8 -*-
# stub: rgeo-shapefile 3.0.0 ruby lib

Gem::Specification.new do |s|
  s.name = "rgeo-shapefile".freeze
  s.version = "3.0.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Daniel Azuma".freeze, "Tee Parham".freeze]
  s.date = "2020-09-02"
  s.description = "RGeo is a geospatial data library for Ruby. RGeo::Shapefile is an optional RGeo module for reading the ESRI shapefile format, a common file format for geospatial datasets.".freeze
  s.email = ["dazuma@gmail.com".freeze, "parhameter@gmail.com".freeze]
  s.homepage = "http://github.com/rgeo/rgeo-shapefile".freeze
  s.licenses = ["BSD".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.4.0".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "An RGeo module for reading ESRI shapefiles.".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rgeo>.freeze, [">= 1.0"])
      s.add_runtime_dependency(%q<dbf>.freeze, ["~> 4.0"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.3"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 12.0"])
    else
      s.add_dependency(%q<rgeo>.freeze, [">= 1.0"])
      s.add_dependency(%q<dbf>.freeze, ["~> 4.0"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.3"])
      s.add_dependency(%q<rake>.freeze, ["~> 12.0"])
    end
  else
    s.add_dependency(%q<rgeo>.freeze, [">= 1.0"])
    s.add_dependency(%q<dbf>.freeze, ["~> 4.0"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.3"])
    s.add_dependency(%q<rake>.freeze, ["~> 12.0"])
  end
end
