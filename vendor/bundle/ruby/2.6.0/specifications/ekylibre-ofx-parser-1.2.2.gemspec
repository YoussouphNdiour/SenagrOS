# -*- encoding: utf-8 -*-
# stub: ekylibre-ofx-parser 1.2.2 ruby lib

Gem::Specification.new do |s|
  s.name = "ekylibre-ofx-parser".freeze
  s.version = "1.2.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Andrew A. Smith".freeze, "Louis Coquio".freeze]
  s.date = "2017-06-06"
  s.description = "== DESCRIPTION:\n\nofx-parser is a ruby library to parse a realistic subset of the lengthy OFX 1.x specification.\n\n== FEATURES/PROBLEMS:\n\n* Reads OFX responses - i.e. those downloaded from financial institutions and\n  puts it into a usable object graph.\n* Supports the 3 main message sets: banking, credit card and investment\n  accounts, as well as the required 'sign on' set.\n* Knows about SIC codes - if your institution provides them.\n  See http://www.eeoc.gov/stats/jobpat/siccodes.html\n* Monetary amounts can be retrieved either as a raw string, or in pennies.\n* Supports OFX timestamps.".freeze
  s.email = "andy@tinnedfruit.org".freeze
  s.homepage = "https://github.com/ekylibre/ofx-parser".freeze
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "ofx-parser is a ruby library for parsing OFX 1.x data.".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<hpricot>.freeze, [">= 0.6"])
      s.add_development_dependency(%q<rdoc>.freeze, ["~> 3.10"])
      s.add_development_dependency(%q<hoe>.freeze, ["~> 3.3"])
    else
      s.add_dependency(%q<hpricot>.freeze, [">= 0.6"])
      s.add_dependency(%q<rdoc>.freeze, ["~> 3.10"])
      s.add_dependency(%q<hoe>.freeze, ["~> 3.3"])
    end
  else
    s.add_dependency(%q<hpricot>.freeze, [">= 0.6"])
    s.add_dependency(%q<rdoc>.freeze, ["~> 3.10"])
    s.add_dependency(%q<hoe>.freeze, ["~> 3.3"])
  end
end
