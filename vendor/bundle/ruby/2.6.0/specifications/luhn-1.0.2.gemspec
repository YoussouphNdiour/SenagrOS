# -*- encoding: utf-8 -*-
# stub: luhn 1.0.2 ruby lib

Gem::Specification.new do |s|
  s.name = "luhn".freeze
  s.version = "1.0.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Joel Junstr\u00F6m".freeze]
  s.date = "2015-09-19"
  s.email = ["joel.junstrom@gmail.com".freeze]
  s.homepage = "http://github.com/joeljunstrom/ruby_luhn".freeze
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "A small implementation of the Luhn algorithm.".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_development_dependency(%q<minitest>.freeze, ["~> 2.6.0"])
    else
      s.add_dependency(%q<minitest>.freeze, ["~> 2.6.0"])
    end
  else
    s.add_dependency(%q<minitest>.freeze, ["~> 2.6.0"])
  end
end
