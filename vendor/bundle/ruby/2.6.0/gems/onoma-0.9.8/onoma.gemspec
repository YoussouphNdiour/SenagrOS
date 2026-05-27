# frozen_string_literal: true

require_relative 'lib/onoma/version'

Gem::Specification.new do |spec|
  spec.name = 'onoma'
  spec.version = Onoma::VERSION
  spec.required_ruby_version = '>= 2.4.4'
  spec.authors = ['Ekylibre developers']
  spec.email = ['dev@ekylibre.com']

  spec.summary = 'Provides open nomenclature data in a gem'
  spec.description = 'Actual support Open-Nomenclature data and gem for use'
  spec.homepage = 'https://gitlab.com/ekylibre/onoma'
  spec.license = 'AGPL-3.0-only'

  spec.files = Dir.glob(%w[{bin,config,lib}/**/* db/reference.xml *.gemspec LICENSE.md])

  spec.require_paths = ['lib']

  spec.add_dependency 'activesupport', '>= 4.2'
  spec.add_dependency 'nokogiri', '>= 1.10.4'
  spec.add_dependency 'zeitwerk', '~> 2.4.0'

  spec.add_development_dependency 'bundler', '> 1.15'
  spec.add_development_dependency 'i18n-tasks'
  spec.add_development_dependency 'minitest'
  spec.add_development_dependency 'rake', '> 12.0'
  spec.add_development_dependency 'rubocop', '1.3.1'
end
