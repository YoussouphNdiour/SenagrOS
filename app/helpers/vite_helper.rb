# frozen_string_literal: true

# Minimal reimplementation of vite_rails view helpers using vite_ruby core.
# Needed because only vite_ruby (~> 3.0) is in the Gemfile, not vite_rails.
#
# NOTE: vite_ruby 3.x uses Array#filter_map (Ruby 2.7+) inside resolve_entries,
# so we bypass that method entirely and build URLs directly from the config.
module ViteHelper
  # Renders <script type="module" src=".../@vite/client"> in development.
  # Returns nil in production (no HMR client needed).
  def vite_client_tag(**options)
    src = ViteRuby.instance.manifest.vite_client_src
    return unless src

    tag.script(src: src, type: "module", **options)
  end

  # Renders a <script type="module"> tag for the given Vite entry point.
  # In dev: points directly at the Vite dev server via the proxy path.
  # In production: reads the compiled path from the manifest JSON.
  def vite_javascript_tag(name, crossorigin: "anonymous", **options)
    src = vite_entry_src(name)
    tag.script("", src: src, type: "module", crossorigin: crossorigin, **options)
  end

  private

  def vite_entry_src(name)
    vite = ViteRuby.instance
    config = vite.config

    if vite.manifest.dev_server_running?
      # In dev, assets are served by the Vite dev server through the Rails proxy.
      # Path format: /<publicOutputDir>/<entrypointsDir>/<name>.<ext>
      entry_dir = config.respond_to?(:entrypoints_dir) ? config.entrypoints_dir : "entrypoints"
      ext = vite_entry_extension(config.source_code_dir, entry_dir, name)
      "/#{config.public_output_dir}/#{entry_dir}/#{name}#{ext}"
    else
      # In production, read from the compiled manifest.
      vite.manifest.path_for("#{name}.js", type: :javascript)
    end
  rescue StandardError
    "/#{ViteRuby.instance.config.public_output_dir}/#{name}.js"
  end

  # Detect the actual file extension from the source directory.
  def vite_entry_extension(source_dir, entry_dir, name)
    base = File.join(Rails.root, "app", source_dir, entry_dir, name)
    %w[.tsx .ts .jsx .js].each do |ext|
      return ext if File.exist?("#{base}#{ext}")
    end
    ".js"
  end
end
