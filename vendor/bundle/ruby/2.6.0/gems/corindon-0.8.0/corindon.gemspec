# frozen_string_literal: true

require_relative 'lib/corindon/version'

Gem::Specification.new do |s|
  s.name = 'corindon'
  s.version = Corindon::VERSION
  s.summary = 'A collection of tools for Ruby'
  s.files = Dir.glob(%w[lib/**/*.rb corindon.gemspec])

  s.homepage = 'https://gitlab.com/piotaixr/corindon'
  s.author = 'Rémi Piotaix'
  s.email = 'remi@piotaix.fr'
  s.license = 'LGPL-3.0-only'

  s.required_ruby_version = '>= 2.6.0'

  s.add_dependency 'semantic', '~> 1.6'
  s.add_dependency 'zeitwerk', '~> 2.3'

  s.add_development_dependency 'bundler'
  s.add_development_dependency 'minitest', '~>  5.14'
  s.add_development_dependency 'minitest-reporters', '~> 1.4'
  s.add_development_dependency 'rake', '~> 13.0'
  s.add_development_dependency 'rubocop', '1.3.1'
end
