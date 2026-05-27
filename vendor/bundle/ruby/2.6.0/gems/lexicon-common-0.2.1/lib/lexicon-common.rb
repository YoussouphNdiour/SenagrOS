# frozen_string_literal: true

# require 'lexicon/common'
require 'aws-sdk-s3'
require 'colored'
require 'concurrent-ruby'
require 'corindon'
require 'logger'
require 'json_schemer'
require 'pg'
require 'semantic'
require 'shellwords'
require 'zeitwerk'

# Require the common file as loading the version first through the gemspec prevents Zeitwerk to load it.
require_relative 'lexicon/common'

loader = Zeitwerk::Loader.for_gem
loader.ignore(__FILE__)
loader.setup
