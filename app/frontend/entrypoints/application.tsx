import type { ComponentType } from 'react'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import '../styles/tokens.css'

// Set the Rails CSRF token on all axios requests so that Inertia router.post/patch/delete
// requests pass the authenticity token check (protect_from_forgery).
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
if (csrfToken) axios.defaults.headers.common['X-CSRF-Token'] = csrfToken

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob<{ default: ComponentType }>(
      ['../pages/**/*.tsx', '!../pages/**/*.test.tsx', '!../pages/**/*.spec.tsx'],
      { eager: true }
    )
    const page = pages[`../pages/${name}.tsx`]
    if (!page) throw new Error(`Page not found: ${name}`)
    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <QueryClientProvider client={queryClient}>
        <App {...props} />
      </QueryClientProvider>
    )
  },
})
