# -*- encoding: utf-8 -*-
# stub: rgeo-geojson 2.1.1 ruby lib

Gem::Specification.new do |s|
  s.name = "rgeo-geojson".freeze
  s.version = "2.1.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Daniel Azuma".freeze, "Tee Parham".freeze]
  s.date = "2018-11-28"
  s.description = "Convert RGeo data to and from GeoJSON. rgeo-geojson is an extension to the rgeo gem that converts RGeo data types to and from GeoJSON.".freeze
  s.email = ["dazuma@gmail.com".freeze, "parhameter@gmail.com".freeze]
  s.homepage = "https://github.com/rgeo/rgeo-geojson".freeze
  s.licenses = ["BSD".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.3.0".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Convert RGeo data to and from GeoJSON.".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rgeo>.freeze, [">= 1.0.0"])
      s.add_development_dependency(%q<bundler>.freeze, ["~> 1.6"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.8"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 12.0"])
    else
      s.add_dependency(%q<rgeo>.freeze, [">= 1.0.0"])
      s.add_dependency(%q<bundler>.freeze, ["~> 1.6"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.8"])
      s.add_dependency(%q<rake>.freeze, ["~> 12.0"])
    end
  else
    s.add_dependency(%q<rgeo>.freeze, [">= 1.0.0"])
    s.add_dependency(%q<bundler>.freeze, ["~> 1.6"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.8"])
    s.add_dependency(%q<rake>.freeze, ["~> 12.0"])
  end
end
