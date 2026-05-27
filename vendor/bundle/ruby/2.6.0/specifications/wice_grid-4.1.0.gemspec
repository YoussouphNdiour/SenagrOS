# -*- encoding: utf-8 -*-
# stub: wice_grid 4.1.0 ruby lib

Gem::Specification.new do |s|
  s.name = "wice_grid".freeze
  s.version = "4.1.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Yuri Leikind and contributors".freeze]
  s.date = "2018-11-28"
  s.description = "A Rails grid plugin to create grids with sorting, pagination, and filters generated automatically based on column types. The contents of the cell are up for the developer, just like one does when rendering a collection via a simple table. WiceGrid automates implementation of filters, ordering, paginations, CSV export, and so on. Ruby blocks provide an elegant means for this.".freeze
  s.email = ["patrick@yamasolutions.com".freeze]
  s.homepage = "https://github.com/patricklindsay/wice_grid".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "A Rails grid plugin to quickly create grids with sorting, pagination, and filters.".freeze

  s.installed_by_version = "3.0.3.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rails>.freeze, ["~> 5.0", "< 5.3"])
      s.add_runtime_dependency(%q<kaminari>.freeze, ["~> 1.1.0"])
      s.add_runtime_dependency(%q<coffee-rails>.freeze, ["> 3.2"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 10.1"])
      s.add_development_dependency(%q<byebug>.freeze, [">= 0"])
      s.add_development_dependency(%q<appraisal>.freeze, [">= 0"])
      s.add_development_dependency(%q<rspec>.freeze, ["~> 3.6.0"])
      s.add_development_dependency(%q<rspec-rails>.freeze, ["~> 3.6.0"])
      s.add_development_dependency(%q<shoulda-matchers>.freeze, ["= 2.8.0"])
      s.add_development_dependency(%q<capybara>.freeze, ["~> 2.2.0"])
      s.add_development_dependency(%q<faker>.freeze, ["~> 1.8.7"])
      s.add_development_dependency(%q<poltergeist>.freeze, ["~> 1.9.0"])
      s.add_development_dependency(%q<capybara-screenshot>.freeze, ["~> 1.0.11"])
      s.add_development_dependency(%q<selenium-webdriver>.freeze, ["~> 2.51.0"])
      s.add_development_dependency(%q<haml>.freeze, ["~> 5.0.4"])
      s.add_development_dependency(%q<coderay>.freeze, ["~> 1.1.0"])
      s.add_development_dependency(%q<jquery-rails>.freeze, ["~> 4.3.3"])
      s.add_development_dependency(%q<jquery-ui-rails>.freeze, ["~> 5.0.5"])
      s.add_development_dependency(%q<jquery-ui-themes>.freeze, ["~> 0.0.11"])
      s.add_development_dependency(%q<sass-rails>.freeze, [">= 3.2"])
      s.add_development_dependency(%q<bootstrap-sass>.freeze, ["= 3.1.1.1"])
      s.add_development_dependency(%q<font-awesome-sass>.freeze, ["= 4.4.0"])
      s.add_development_dependency(%q<turbolinks>.freeze, ["~> 5.1.1"])
      s.add_development_dependency(%q<therubyracer>.freeze, [">= 0"])
      s.add_development_dependency(%q<bundler>.freeze, ["~> 1.3"])
      s.add_development_dependency(%q<simplecov>.freeze, ["~> 0.7"])
      s.add_development_dependency(%q<sqlite3>.freeze, ["~> 1.3"])
      s.add_development_dependency(%q<yard>.freeze, ["~> 0.8"])
      s.add_development_dependency(%q<inch>.freeze, ["~> 0.6.4"])
      s.add_development_dependency(%q<rdoc>.freeze, ["~> 4.2.0"])
    else
      s.add_dependency(%q<rails>.freeze, ["~> 5.0", "< 5.3"])
      s.add_dependency(%q<kaminari>.freeze, ["~> 1.1.0"])
      s.add_dependency(%q<coffee-rails>.freeze, ["> 3.2"])
      s.add_dependency(%q<rake>.freeze, ["~> 10.1"])
      s.add_dependency(%q<byebug>.freeze, [">= 0"])
      s.add_dependency(%q<appraisal>.freeze, [">= 0"])
      s.add_dependency(%q<rspec>.freeze, ["~> 3.6.0"])
      s.add_dependency(%q<rspec-rails>.freeze, ["~> 3.6.0"])
      s.add_dependency(%q<shoulda-matchers>.freeze, ["= 2.8.0"])
      s.add_dependency(%q<capybara>.freeze, ["~> 2.2.0"])
      s.add_dependency(%q<faker>.freeze, ["~> 1.8.7"])
      s.add_dependency(%q<poltergeist>.freeze, ["~> 1.9.0"])
      s.add_dependency(%q<capybara-screenshot>.freeze, ["~> 1.0.11"])
      s.add_dependency(%q<selenium-webdriver>.freeze, ["~> 2.51.0"])
      s.add_dependency(%q<haml>.freeze, ["~> 5.0.4"])
      s.add_dependency(%q<coderay>.freeze, ["~> 1.1.0"])
      s.add_dependency(%q<jquery-rails>.freeze, ["~> 4.3.3"])
      s.add_dependency(%q<jquery-ui-rails>.freeze, ["~> 5.0.5"])
      s.add_dependency(%q<jquery-ui-themes>.freeze, ["~> 0.0.11"])
      s.add_dependency(%q<sass-rails>.freeze, [">= 3.2"])
      s.add_dependency(%q<bootstrap-sass>.freeze, ["= 3.1.1.1"])
      s.add_dependency(%q<font-awesome-sass>.freeze, ["= 4.4.0"])
      s.add_dependency(%q<turbolinks>.freeze, ["~> 5.1.1"])
      s.add_dependency(%q<therubyracer>.freeze, [">= 0"])
      s.add_dependency(%q<bundler>.freeze, ["~> 1.3"])
      s.add_dependency(%q<simplecov>.freeze, ["~> 0.7"])
      s.add_dependency(%q<sqlite3>.freeze, ["~> 1.3"])
      s.add_dependency(%q<yard>.freeze, ["~> 0.8"])
      s.add_dependency(%q<inch>.freeze, ["~> 0.6.4"])
      s.add_dependency(%q<rdoc>.freeze, ["~> 4.2.0"])
    end
  else
    s.add_dependency(%q<rails>.freeze, ["~> 5.0", "< 5.3"])
    s.add_dependency(%q<kaminari>.freeze, ["~> 1.1.0"])
    s.add_dependency(%q<coffee-rails>.freeze, ["> 3.2"])
    s.add_dependency(%q<rake>.freeze, ["~> 10.1"])
    s.add_dependency(%q<byebug>.freeze, [">= 0"])
    s.add_dependency(%q<appraisal>.freeze, [">= 0"])
    s.add_dependency(%q<rspec>.freeze, ["~> 3.6.0"])
    s.add_dependency(%q<rspec-rails>.freeze, ["~> 3.6.0"])
    s.add_dependency(%q<shoulda-matchers>.freeze, ["= 2.8.0"])
    s.add_dependency(%q<capybara>.freeze, ["~> 2.2.0"])
    s.add_dependency(%q<faker>.freeze, ["~> 1.8.7"])
    s.add_dependency(%q<poltergeist>.freeze, ["~> 1.9.0"])
    s.add_dependency(%q<capybara-screenshot>.freeze, ["~> 1.0.11"])
    s.add_dependency(%q<selenium-webdriver>.freeze, ["~> 2.51.0"])
    s.add_dependency(%q<haml>.freeze, ["~> 5.0.4"])
    s.add_dependency(%q<coderay>.freeze, ["~> 1.1.0"])
    s.add_dependency(%q<jquery-rails>.freeze, ["~> 4.3.3"])
    s.add_dependency(%q<jquery-ui-rails>.freeze, ["~> 5.0.5"])
    s.add_dependency(%q<jquery-ui-themes>.freeze, ["~> 0.0.11"])
    s.add_dependency(%q<sass-rails>.freeze, [">= 3.2"])
    s.add_dependency(%q<bootstrap-sass>.freeze, ["= 3.1.1.1"])
    s.add_dependency(%q<font-awesome-sass>.freeze, ["= 4.4.0"])
    s.add_dependency(%q<turbolinks>.freeze, ["~> 5.1.1"])
    s.add_dependency(%q<therubyracer>.freeze, [">= 0"])
    s.add_dependency(%q<bundler>.freeze, ["~> 1.3"])
    s.add_dependency(%q<simplecov>.freeze, ["~> 0.7"])
    s.add_dependency(%q<sqlite3>.freeze, ["~> 1.3"])
    s.add_dependency(%q<yard>.freeze, ["~> 0.8"])
    s.add_dependency(%q<inch>.freeze, ["~> 0.6.4"])
    s.add_dependency(%q<rdoc>.freeze, ["~> 4.2.0"])
  end
end
