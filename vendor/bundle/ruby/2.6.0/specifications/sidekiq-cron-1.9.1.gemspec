# -*- encoding: utf-8 -*-
# stub: sidekiq-cron 1.9.1 ruby lib

Gem::Specification.new do |s|
  s.name = "sidekiq-cron".freeze
  s.version = "1.9.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Ondrej Bartas".freeze]
  s.date = "2022-12-21"
  s.description = "Enables to set jobs to be run in specified time (using CRON notation or natural language)".freeze
  s.email = "ondrej@bartas.cz".freeze
  s.extra_rdoc_files = ["LICENSE.txt".freeze, "README.md".freeze]
  s.files = ["LICENSE.txt".freeze, "README.md".freeze]
  s.homepage = "https://github.com/sidekiq-cron/sidekiq-cron".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.6".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Scheduler/Cron for Sidekiq jobs".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<fugit>.freeze, ["~> 1.8"])
      s.add_runtime_dependency(%q<sidekiq>.freeze, [">= 4.2.1"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.15"])
      s.add_development_dependency(%q<mocha>.freeze, ["~> 1.14"])
      s.add_development_dependency(%q<rack>.freeze, ["~> 2.2"])
      s.add_development_dependency(%q<rack-test>.freeze, ["~> 1.1"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_development_dependency(%q<simplecov>.freeze, ["~> 0.21"])
    else
      s.add_dependency(%q<fugit>.freeze, ["~> 1.8"])
      s.add_dependency(%q<sidekiq>.freeze, [">= 4.2.1"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.15"])
      s.add_dependency(%q<mocha>.freeze, ["~> 1.14"])
      s.add_dependency(%q<rack>.freeze, ["~> 2.2"])
      s.add_dependency(%q<rack-test>.freeze, ["~> 1.1"])
      s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
      s.add_dependency(%q<simplecov>.freeze, ["~> 0.21"])
    end
  else
    s.add_dependency(%q<fugit>.freeze, ["~> 1.8"])
    s.add_dependency(%q<sidekiq>.freeze, [">= 4.2.1"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.15"])
    s.add_dependency(%q<mocha>.freeze, ["~> 1.14"])
    s.add_dependency(%q<rack>.freeze, ["~> 2.2"])
    s.add_dependency(%q<rack-test>.freeze, ["~> 1.1"])
    s.add_dependency(%q<rake>.freeze, ["~> 13.0"])
    s.add_dependency(%q<simplecov>.freeze, ["~> 0.21"])
  end
end
