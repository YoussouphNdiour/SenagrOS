# frozen_string_literal: true

# Minimal reimplementation of vite_rails view helpers using vite_ruby core.
# Needed because only vite_ruby (~> 3.0) is in the Gemfile, not vite_rails.
module ViteHelper
  # Renders <script type="module" src=".../@vite/client"> in development.
  # Returns nil in production (no HMR client needed).
  def vite_client_tag(**options)
    src = ViteRuby.instance.manifest.vite_client_src
    return unless src

    tag.script(src: src, type: "module", **options)
  end

  # Renders a <script type="module"> tag for the given Vite entry point.
  # In dev, resolves against the running dev server.
  # In production, resolves against the built manifest.
  def vite_javascript_tag(name, crossorigin: "anonymous", **options)
    entries = ViteRuby.instance.manifest.resolve_entries(name, type: :javascript)
    scripts = entries.fetch(:scripts)

    safe_join(
      scripts.map { |src| tag.script("", src: src, type: "module", crossorigin: crossorigin, **options) }
    )
  end
end
