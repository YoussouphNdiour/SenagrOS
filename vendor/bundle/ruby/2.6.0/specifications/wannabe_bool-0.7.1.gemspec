# -*- encoding: utf-8 -*-
# stub: wannabe_bool 0.7.1 ruby lib

Gem::Specification.new do |s|
  s.name = "wannabe_bool".freeze
  s.version = "0.7.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Prodis a.k.a. Fernando Hamasaki de Amorim".freeze]
  s.date = "2018-03-13"
  s.description = "If string, numeric, symbol and nil values wanna be a boolean value, they can with the new #to_b method (and more).".freeze
  s.email = "prodis@gmail.com".freeze
  s.executables = ["console".freeze]
  s.files = ["bin/console".freeze]
  s.homepage = "https://github.com/prodis/wannabe_bool".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "If string, numeric, symbol and nil values wanna be a boolean value, they can with the new #to_b method (and more).".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_development_dependency(%q<coveralls>.freeze, ["~> 0.8.21"])
      s.add_development_dependency(%q<pry>.freeze, ["~> 0.11.3"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 12.3"])
      s.add_development_dependency(%q<rspec>.freeze, ["~> 3.7"])
    else
      s.add_dependency(%q<coveralls>.freeze, ["~> 0.8.21"])
      s.add_dependency(%q<pry>.freeze, ["~> 0.11.3"])
      s.add_dependency(%q<rake>.freeze, ["~> 12.3"])
      s.add_dependency(%q<rspec>.freeze, ["~> 3.7"])
    end
  else
    s.add_dependency(%q<coveralls>.freeze, ["~> 0.8.21"])
    s.add_dependency(%q<pry>.freeze, ["~> 0.11.3"])
    s.add_dependency(%q<rake>.freeze, ["~> 12.3"])
    s.add_dependency(%q<rspec>.freeze, ["~> 3.7"])
  end
end
