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

  # Renders the @vitejs/plugin-react Fast Refresh preamble in development.
  # Must appear before vite_client_tag and any module scripts.
  # Uses the proxied path /vite-dev/@react-refresh (not /@react-refresh directly,
  # which is outside the Rails proxy prefix and would 404).
  def vite_react_refresh_tag
    return unless ViteRuby.instance.manifest.dev_server_running?

    public_dir = ViteRuby.instance.config.public_output_dir
    tag.script(type: "module") do
      raw(<<~JS)
        import RefreshRuntime from '/#{public_dir}/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      JS
    end
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
    base = File.join(Rails.root, source_dir, entry_dir, name)
    %w[.tsx .ts .jsx .js].each do |ext|
      return ext if File.exist?("#{base}#{ext}")
    end
    ".js"
  end
end
