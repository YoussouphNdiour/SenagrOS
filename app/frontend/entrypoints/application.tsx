import type { ComponentType } from 'react'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../styles/tokens.css'

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
