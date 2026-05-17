# frozen_string_literal: true

# This file is copied to spec/ when you run 'rails generate rspec:install'
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../config/environment', __dir__)
# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'
# Add additional requires below this line. Rails is not loaded until this point!

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This directory, `spec/support`, must be
# explicitly required.
Dir[Rails.root.join('spec', 'support', '**', '*.rb')].sort.each { |f| require f }

# Load test factories for use with RSpec
Dir[Rails.root.join('test', 'factories', '**', '*.rb')].each do |f|
  begin
    require f
  rescue FactoryBot::DuplicateDefinitionError
    # Factory already registered (e.g. loaded by FactoryBot auto-discovery) — safe to ignore.
  end
end

# Checks for pending migrations and applies them before tests are run.
# NOTE: maintain_test_schema! is skipped because pg_dump version mismatch (pg14 vs pg17 server)
# prevents structure.sql reload; DB schema is confirmed current via `rails runner check_pending!`.
# begin
#   ActiveRecord::Migration.maintain_test_schema!
# rescue ActiveRecord::PendingMigrationError => e
#   puts e.to_s.strip
#   exit 1
# end

RSpec.configure do |config|
  # Include FactoryBot helpers
  config.include FactoryBot::Syntax::Methods

  # Include Devise test helpers for controller specs
  config.include Devise::Test::ControllerHelpers, type: :controller

  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # You can uncomment this line to turn off ActiveRecord support entirely.
  # config.use_active_record = false

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/controllers`.
  #
  # You can disable this behaviour by removing the line below, and instead
  # explicitly tag your specs with their type, e.g.:
  #
  #     RSpec.describe UsersController, type: :controller do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://rspec.info/features/6-0/rspec-rails
  config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.filter_rails_from_backtrace!
  # arbitrary gems may also be added to the filter list:
  # config.filter_gems_from_backtrace("gem name")
end
