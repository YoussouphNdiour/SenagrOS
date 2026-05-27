# frozen_string_literal: true

module Lexicon
  module Common
    LEXICON_SCHEMA_RELATIVE_PATH = 'resources/lexicon.schema.json'
    LEXICON_SCHEMA_ABSOLUTE_PATH = Pathname.new(__dir__).join('..', '..', LEXICON_SCHEMA_RELATIVE_PATH).freeze
  end
end
