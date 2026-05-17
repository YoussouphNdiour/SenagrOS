# frozen_string_literal: true
# Configure inertia_rails to use the app's Inertia layout instead of the
# default 'application' layout (which doesn't exist in this project).
InertiaRails.configure do |config|
  config.layout = 'inertia'
end
