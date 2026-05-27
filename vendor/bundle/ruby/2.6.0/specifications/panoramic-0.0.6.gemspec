# -*- encoding: utf-8 -*-
# stub: panoramic 0.0.6 ruby lib

Gem::Specification.new do |s|
  s.name = "panoramic".freeze
  s.version = "0.0.6"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Andrea Pavoni".freeze]
  s.date = "2016-02-24"
  s.description = "Stores rails views on database".freeze
  s.email = ["andrea.pavoni@gmail.com".freeze]
  s.homepage = "http://github.com/apeacox/panoramic".freeze
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Stores rails views on database".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rails>.freeze, [">= 3.0.7"])
      s.add_development_dependency(%q<capybara>.freeze, ["~> 2.5.0"])
      s.add_development_dependency(%q<factory_girl>.freeze, [">= 0"])
      s.add_development_dependency(%q<simplecov>.freeze, [">= 0"])
      s.add_development_dependency(%q<sqlite3>.freeze, [">= 0"])
      s.add_development_dependency(%q<rspec-rails>.freeze, ["~> 3.0"])
    else
      s.add_dependency(%q<rails>.freeze, [">= 3.0.7"])
      s.add_dependency(%q<capybara>.freeze, ["~> 2.5.0"])
      s.add_dependency(%q<factory_girl>.freeze, [">= 0"])
      s.add_dependency(%q<simplecov>.freeze, [">= 0"])
      s.add_dependency(%q<sqlite3>.freeze, [">= 0"])
      s.add_dependency(%q<rspec-rails>.freeze, ["~> 3.0"])
    end
  else
    s.add_dependency(%q<rails>.freeze, [">= 3.0.7"])
    s.add_dependency(%q<capybara>.freeze, ["~> 2.5.0"])
    s.add_dependency(%q<factory_girl>.freeze, [">= 0"])
    s.add_dependency(%q<simplecov>.freeze, [">= 0"])
    s.add_dependency(%q<sqlite3>.freeze, [">= 0"])
    s.add_dependency(%q<rspec-rails>.freeze, ["~> 3.0"])
  end
end
