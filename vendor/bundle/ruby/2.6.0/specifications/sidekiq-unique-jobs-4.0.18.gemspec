# -*- encoding: utf-8 -*-
# stub: sidekiq-unique-jobs 4.0.18 ruby lib

Gem::Specification.new do |s|
  s.name = "sidekiq-unique-jobs".freeze
  s.version = "4.0.18"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Mikael Henriksson".freeze]
  s.date = "2016-07-24"
  s.description = "The unique jobs that were removed from sidekiq".freeze
  s.email = ["mikael@zoolutions.se".freeze]
  s.executables = ["jobs".freeze]
  s.files = ["bin/jobs".freeze]
  s.homepage = "https://github.com/mhenrixon/sidekiq-unique-jobs".freeze
  s.licenses = ["WTFPL-2.0".freeze]
  s.post_install_message = "WARNING: VERSION 4.0.0 HAS BREAKING CHANGES! Please see Readme for info".freeze
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "The unique jobs that were removed from sidekiq".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<sidekiq>.freeze, [">= 2.6"])
      s.add_runtime_dependency(%q<thor>.freeze, [">= 0"])
      s.add_development_dependency(%q<rspec>.freeze, ["~> 3.1"])
      s.add_development_dependency(%q<rake>.freeze, [">= 0"])
      s.add_development_dependency(%q<rubocop>.freeze, [">= 0"])
      s.add_development_dependency(%q<timecop>.freeze, [">= 0"])
      s.add_development_dependency(%q<yard>.freeze, [">= 0"])
    else
      s.add_dependency(%q<sidekiq>.freeze, [">= 2.6"])
      s.add_dependency(%q<thor>.freeze, [">= 0"])
      s.add_dependency(%q<rspec>.freeze, ["~> 3.1"])
      s.add_dependency(%q<rake>.freeze, [">= 0"])
      s.add_dependency(%q<rubocop>.freeze, [">= 0"])
      s.add_dependency(%q<timecop>.freeze, [">= 0"])
      s.add_dependency(%q<yard>.freeze, [">= 0"])
    end
  else
    s.add_dependency(%q<sidekiq>.freeze, [">= 2.6"])
    s.add_dependency(%q<thor>.freeze, [">= 0"])
    s.add_dependency(%q<rspec>.freeze, ["~> 3.1"])
    s.add_dependency(%q<rake>.freeze, [">= 0"])
    s.add_dependency(%q<rubocop>.freeze, [">= 0"])
    s.add_dependency(%q<timecop>.freeze, [">= 0"])
    s.add_dependency(%q<yard>.freeze, [">= 0"])
  end
end
