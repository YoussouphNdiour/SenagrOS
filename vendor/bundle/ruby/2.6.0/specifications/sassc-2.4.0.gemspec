# -*- encoding: utf-8 -*-
# stub: sassc 2.4.0 ruby lib
# stub: ext/extconf.rb

Gem::Specification.new do |s|
  s.name = "sassc".freeze
  s.version = "2.4.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Ryan Boland".freeze]
  s.date = "2020-06-02"
  s.description = "Use libsass with Ruby!".freeze
  s.email = ["ryan@tanookilabs.com".freeze]
  s.extensions = ["ext/extconf.rb".freeze]
  s.files = [".gitignore".freeze, ".gitmodules".freeze, ".travis.yml".freeze, "CHANGELOG.md".freeze, "CODE_OF_CONDUCT.md".freeze, "Gemfile".freeze, "LICENSE.txt".freeze, "README.md".freeze, "Rakefile".freeze, "ext/depend".freeze, "ext/extconf.rb".freeze, "ext/libsass/VERSION".freeze, "ext/libsass/contrib/plugin.cpp".freeze, "ext/libsass/include/sass.h".freeze, "ext/libsass/include/sass/base.h".freeze, "ext/libsass/include/sass/context.h".freeze, "ext/libsass/include/sass/functions.h".freeze, "ext/libsass/include/sass/values.h".freeze, "ext/libsass/include/sass/version.h".freeze, "ext/libsass/include/sass2scss.h".freeze, "ext/libsass/src/MurmurHash2.hpp".freeze, "ext/libsass/src/ast.cpp".freeze, "ext/libsass/src/ast.hpp".freeze, "ext/libsass/src/ast2c.cpp".freeze, "ext/libsass/src/ast2c.hpp".freeze, "ext/libsass/src/ast_def_macros.hpp".freeze, "ext/libsass/src/ast_fwd_decl.cpp".freeze, "ext/libsass/src/ast_fwd_decl.hpp".freeze, "ext/libsass/src/ast_helpers.hpp".freeze, "ext/libsass/src/ast_sel_cmp.cpp".freeze, "ext/libsass/src/ast_sel_super.cpp".freeze, "ext/libsass/src/ast_sel_unify.cpp".freeze, "ext/libsass/src/ast_sel_weave.cpp".freeze, "ext/libsass/src/ast_selectors.cpp".freeze, "ext/libsass/src/ast_selectors.hpp".freeze, "ext/libsass/src/ast_supports.cpp".freeze, "ext/libsass/src/ast_supports.hpp".freeze, "ext/libsass/src/ast_values.cpp".freeze, "ext/libsass/src/ast_values.hpp".freeze, "ext/libsass/src/b64/cencode.h".freeze, "ext/libsass/src/b64/encode.h".freeze, "ext/libsass/src/backtrace.cpp".freeze, "ext/libsass/src/backtrace.hpp".freeze, "ext/libsass/src/base64vlq.cpp".freeze, "ext/libsass/src/base64vlq.hpp".freeze, "ext/libsass/src/bind.cpp".freeze, "ext/libsass/src/bind.hpp".freeze, "ext/libsass/src/c2ast.cpp".freeze, "ext/libsass/src/c2ast.hpp".freeze, "ext/libsass/src/c99func.c".freeze, "ext/libsass/src/cencode.c".freeze, "ext/libsass/src/check_nesting.cpp".freeze, "ext/libsass/src/check_nesting.hpp".freeze, "ext/libsass/src/color_maps.cpp".freeze, "ext/libsass/src/color_maps.hpp".freeze, "ext/libsass/src/constants.cpp".freeze, "ext/libsass/src/constants.hpp".freeze, "ext/libsass/src/context.cpp".freeze, "ext/libsass/src/context.hpp".freeze, "ext/libsass/src/cssize.cpp".freeze, "ext/libsass/src/cssize.hpp".freeze, "ext/libsass/src/dart_helpers.hpp".freeze, "ext/libsass/src/debug.hpp".freeze, "ext/libsass/src/debugger.hpp".freeze, "ext/libsass/src/emitter.cpp".freeze, "ext/libsass/src/emitter.hpp".freeze, "ext/libsass/src/environment.cpp".freeze, "ext/libsass/src/environment.hpp".freeze, "ext/libsass/src/error_handling.cpp".freeze, "ext/libsass/src/error_handling.hpp".freeze, "ext/libsass/src/eval.cpp".freeze, "ext/libsass/src/eval.hpp".freeze, "ext/libsass/src/eval_selectors.cpp".freeze, "ext/libsass/src/expand.cpp".freeze, "ext/libsass/src/expand.hpp".freeze, "ext/libsass/src/extender.cpp".freeze, "ext/libsass/src/extender.hpp".freeze, "ext/libsass/src/extension.cpp".freeze, "ext/libsass/src/extension.hpp".freeze, "ext/libsass/src/file.cpp".freeze, "ext/libsass/src/file.hpp".freeze, "ext/libsass/src/fn_colors.cpp".freeze, "ext/libsass/src/fn_colors.hpp".freeze, "ext/libsass/src/fn_lists.cpp".freeze, "ext/libsass/src/fn_lists.hpp".freeze, "ext/libsass/src/fn_maps.cpp".freeze, "ext/libsass/src/fn_maps.hpp".freeze, "ext/libsass/src/fn_miscs.cpp".freeze, "ext/libsass/src/fn_miscs.hpp".freeze, "ext/libsass/src/fn_numbers.cpp".freeze, "ext/libsass/src/fn_numbers.hpp".freeze, "ext/libsass/src/fn_selectors.cpp".freeze, "ext/libsass/src/fn_selectors.hpp".freeze, "ext/libsass/src/fn_strings.cpp".freeze, "ext/libsass/src/fn_strings.hpp".freeze, "ext/libsass/src/fn_utils.cpp".freeze, "ext/libsass/src/fn_utils.hpp".freeze, "ext/libsass/src/inspect.cpp".freeze, "ext/libsass/src/inspect.hpp".freeze, "ext/libsass/src/json.cpp".freeze, "ext/libsass/src/json.hpp".freeze, "ext/libsass/src/kwd_arg_macros.hpp".freeze, "ext/libsass/src/lexer.cpp".freeze, "ext/libsass/src/lexer.hpp".freeze, "ext/libsass/src/listize.cpp".freeze, "ext/libsass/src/listize.hpp".freeze, "ext/libsass/src/mapping.hpp".freeze, "ext/libsass/src/memory.hpp".freeze, "ext/libsass/src/memory/allocator.cpp".freeze, "ext/libsass/src/memory/allocator.hpp".freeze, "ext/libsass/src/memory/config.hpp".freeze, "ext/libsass/src/memory/memory_pool.hpp".freeze, "ext/libsass/src/memory/shared_ptr.cpp".freeze, "ext/libsass/src/memory/shared_ptr.hpp".freeze, "ext/libsass/src/operation.hpp".freeze, "ext/libsass/src/operators.cpp".freeze, "ext/libsass/src/operators.hpp".freeze, "ext/libsass/src/ordered_map.hpp".freeze, "ext/libsass/src/output.cpp".freeze, "ext/libsass/src/output.hpp".freeze, "ext/libsass/src/parser.cpp".freeze, "ext/libsass/src/parser.hpp".freeze, "ext/libsass/src/parser_selectors.cpp".freeze, "ext/libsass/src/permutate.hpp".freeze, "ext/libsass/src/plugins.cpp".freeze, "ext/libsass/src/plugins.hpp".freeze, "ext/libsass/src/position.cpp".freeze, "ext/libsass/src/position.hpp".freeze, "ext/libsass/src/prelexer.cpp".freeze, "ext/libsass/src/prelexer.hpp".freeze, "ext/libsass/src/remove_placeholders.cpp".freeze, "ext/libsass/src/remove_placeholders.hpp".freeze, "ext/libsass/src/sass.cpp".freeze, "ext/libsass/src/sass.hpp".freeze, "ext/libsass/src/sass2scss.cpp".freeze, "ext/libsass/src/sass_context.cpp".freeze, "ext/libsass/src/sass_context.hpp".freeze, "ext/libsass/src/sass_functions.cpp".freeze, "ext/libsass/src/sass_functions.hpp".freeze, "ext/libsass/src/sass_values.cpp".freeze, "ext/libsass/src/sass_values.hpp".freeze, "ext/libsass/src/settings.hpp".freeze, "ext/libsass/src/source.cpp".freeze, "ext/libsass/src/source.hpp".freeze, "ext/libsass/src/source_data.hpp".freeze, "ext/libsass/src/source_map.cpp".freeze, "ext/libsass/src/source_map.hpp".freeze, "ext/libsass/src/stylesheet.cpp".freeze, "ext/libsass/src/stylesheet.hpp".freeze, "ext/libsass/src/to_value.cpp".freeze, "ext/libsass/src/to_value.hpp".freeze, "ext/libsass/src/units.cpp".freeze, "ext/libsass/src/units.hpp".freeze, "ext/libsass/src/utf8.h".freeze, "ext/libsass/src/utf8/checked.h".freeze, "ext/libsass/src/utf8/core.h".freeze, "ext/libsass/src/utf8/unchecked.h".freeze, "ext/libsass/src/utf8_string.cpp".freeze, "ext/libsass/src/utf8_string.hpp".freeze, "ext/libsass/src/util.cpp".freeze, "ext/libsass/src/util.hpp".freeze, "ext/libsass/src/util_string.cpp".freeze, "ext/libsass/src/util_string.hpp".freeze, "ext/libsass/src/values.cpp".freeze, "ext/libsass/src/values.hpp".freeze, "lib/sassc.rb".freeze, "lib/sassc/dependency.rb".freeze, "lib/sassc/engine.rb".freeze, "lib/sassc/error.rb".freeze, "lib/sassc/functions_handler.rb".freeze, "lib/sassc/import_handler.rb".freeze, "lib/sassc/importer.rb".freeze, "lib/sassc/native.rb".freeze, "lib/sassc/native/native_context_api.rb".freeze, "lib/sassc/native/native_functions_api.rb".freeze, "lib/sassc/native/sass2scss_api.rb".freeze, "lib/sassc/native/sass_input_style.rb".freeze, "lib/sassc/native/sass_output_style.rb".freeze, "lib/sassc/native/sass_value.rb".freeze, "lib/sassc/native/string_list.rb".freeze, "lib/sassc/sass_2_scss.rb".freeze, "lib/sassc/script.rb".freeze, "lib/sassc/script/functions.rb".freeze, "lib/sassc/script/value.rb".freeze, "lib/sassc/script/value/bool.rb".freeze, "lib/sassc/script/value/color.rb".freeze, "lib/sassc/script/value/list.rb".freeze, "lib/sassc/script/value/map.rb".freeze, "lib/sassc/script/value/number.rb".freeze, "lib/sassc/script/value/string.rb".freeze, "lib/sassc/script/value_conversion.rb".freeze, "lib/sassc/script/value_conversion/base.rb".freeze, "lib/sassc/script/value_conversion/bool.rb".freeze, "lib/sassc/script/value_conversion/color.rb".freeze, "lib/sassc/script/value_conversion/list.rb".freeze, "lib/sassc/script/value_conversion/map.rb".freeze, "lib/sassc/script/value_conversion/number.rb".freeze, "lib/sassc/script/value_conversion/string.rb".freeze, "lib/sassc/util.rb".freeze, "lib/sassc/util/normalized_map.rb".freeze, "lib/sassc/version.rb".freeze, "sassc.gemspec".freeze, "test/custom_importer_test.rb".freeze, "test/engine_test.rb".freeze, "test/error_test.rb".freeze, "test/fixtures/paths.scss".freeze, "test/functions_test.rb".freeze, "test/native_test.rb".freeze, "test/output_style_test.rb".freeze, "test/sass_2_scss_test.rb".freeze, "test/test_helper.rb".freeze]
  s.homepage = "https://github.com/sass/sassc-ruby".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.0.0".freeze)
  s.rubygems_version = "3.0.3.1".freeze
  s.summary = "Use libsass with Ruby!".freeze
  s.test_files = ["test/custom_importer_test.rb".freeze, "test/engine_test.rb".freeze, "test/error_test.rb".freeze, "test/fixtures/paths.scss".freeze, "test/functions_test.rb".freeze, "test/native_test.rb".freeze, "test/output_style_test.rb".freeze, "test/sass_2_scss_test.rb".freeze, "test/test_helper.rb".freeze]

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.5.1"])
      s.add_development_dependency(%q<minitest-around>.freeze, [">= 0"])
      s.add_development_dependency(%q<test_construct>.freeze, [">= 0"])
      s.add_development_dependency(%q<pry>.freeze, [">= 0"])
      s.add_development_dependency(%q<bundler>.freeze, [">= 0"])
      s.add_development_dependency(%q<rake>.freeze, [">= 0"])
      s.add_development_dependency(%q<rake-compiler>.freeze, [">= 0"])
      s.add_development_dependency(%q<rake-compiler-dock>.freeze, [">= 0"])
      s.add_runtime_dependency(%q<ffi>.freeze, ["~> 1.9"])
    else
      s.add_dependency(%q<minitest>.freeze, ["~> 5.5.1"])
      s.add_dependency(%q<minitest-around>.freeze, [">= 0"])
      s.add_dependency(%q<test_construct>.freeze, [">= 0"])
      s.add_dependency(%q<pry>.freeze, [">= 0"])
      s.add_dependency(%q<bundler>.freeze, [">= 0"])
      s.add_dependency(%q<rake>.freeze, [">= 0"])
      s.add_dependency(%q<rake-compiler>.freeze, [">= 0"])
      s.add_dependency(%q<rake-compiler-dock>.freeze, [">= 0"])
      s.add_dependency(%q<ffi>.freeze, ["~> 1.9"])
    end
  else
    s.add_dependency(%q<minitest>.freeze, ["~> 5.5.1"])
    s.add_dependency(%q<minitest-around>.freeze, [">= 0"])
    s.add_dependency(%q<test_construct>.freeze, [">= 0"])
    s.add_dependency(%q<pry>.freeze, [">= 0"])
    s.add_dependency(%q<bundler>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, [">= 0"])
    s.add_dependency(%q<rake-compiler>.freeze, [">= 0"])
    s.add_dependency(%q<rake-compiler-dock>.freeze, [">= 0"])
    s.add_dependency(%q<ffi>.freeze, ["~> 1.9"])
  end
end
