# -*- encoding: utf-8 -*-
# stub: formize 2.1.0 ruby lib

Gem::Specification.new do |s|
  s.name = "formize".freeze
  s.version = "2.1.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Brice Texier".freeze]
  s.date = "2014-07-09"
  s.description = "Adds some form helper to Rails (>= 3.2).".freeze
  s.email = "burisu@oneiros.fr".freeze
  s.extra_rdoc_files = ["LICENSE".freeze, "README.rdoc".freeze]
  s.files = ["LICENSE".freeze, "README.rdoc".freeze]
  s.homepage = "http://github.com/burisu/formize".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Form helpers".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rails>.freeze, [">= 3.2"])
      s.add_runtime_dependency(%q<jquery-rails>.freeze, [">= 3"])
      s.add_runtime_dependency(%q<jquery-ui-rails>.freeze, [">= 5"])
      s.add_development_dependency(%q<rake>.freeze, [">= 10"])
      s.add_development_dependency(%q<bundler>.freeze, [">= 1"])
      s.add_development_dependency(%q<minitest>.freeze, [">= 0"])
    else
      s.add_dependency(%q<rails>.freeze, [">= 3.2"])
      s.add_dependency(%q<jquery-rails>.freeze, [">= 3"])
      s.add_dependency(%q<jquery-ui-rails>.freeze, [">= 5"])
      s.add_dependency(%q<rake>.freeze, [">= 10"])
      s.add_dependency(%q<bundler>.freeze, [">= 1"])
      s.add_dependency(%q<minitest>.freeze, [">= 0"])
    end
  else
    s.add_dependency(%q<rails>.freeze, [">= 3.2"])
    s.add_dependency(%q<jquery-rails>.freeze, [">= 3"])
    s.add_dependency(%q<jquery-ui-rails>.freeze, [">= 5"])
    s.add_dependency(%q<rake>.freeze, [">= 10"])
    s.add_dependency(%q<bundler>.freeze, [">= 1"])
    s.add_dependency(%q<minitest>.freeze, [">= 0"])
  end
end
