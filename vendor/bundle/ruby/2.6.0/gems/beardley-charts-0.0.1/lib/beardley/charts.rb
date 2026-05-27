require 'beardley/charts/version'

module Beardley
  module Charts
    RjbLoader.before_load do |config|
      Dir[Pathname.new(__FILE__).dirname.join('..', '..', 'vendor', 'java', '*.jar')].each do |path|
        config.classpath << File::PATH_SEPARATOR + File.expand_path(path)
      end
    end
  end
end
