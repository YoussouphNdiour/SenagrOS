# frozen_string_literal: true

require_relative 'lib/lexicon/common/version'

Gem::Specification.new do |spec|
  spec.name = 'lexicon-common'
  spec.version = Lexicon::Common::VERSION
  spec.authors = ['Ekylibre developers']
  spec.email = ['dev@ekylibre.com']

  spec.summary = "Common classes and services for Ekylibre's Lexicon"
  spec.required_ruby_version = '>= 2.6.0'
  spec.homepage = 'https://www.ekylibre.com'
  spec.license = 'AGPL-3.0-only'

  # Specify which files should be added to the gem when it is released.
  spec.files = Dir.glob(%w[lib/**/*.rb resources/**/* *.gemspec])

  spec.require_paths = ['lib']

  spec.add_dependency 'aws-sdk-s3', '~> 1.84'
  spec.add_dependency 'colored', '~> 1.2'
  spec.add_dependency 'concurrent-ruby', '~> 1.1'
  spec.add_dependency 'corindon', '~> 0.8.0'
  spec.add_dependency 'json_schemer', '~> 0.2.16'
  spec.add_dependency 'pg', '~> 1.2'
  spec.add_dependency 'semantic', '~> 1.6'
  spec.add_dependency 'zeitwerk', '~> 2.4'

  spec.add_development_dependency 'bundler', '~> 2.0'
  spec.add_development_dependency 'minitest', '~> 5.14'
  spec.add_development_dependency 'rake', '~> 13.0'
  spec.add_development_dependency 'rubocop', '1.11.0'
end
