import { router } from '@inertiajs/react'
import type { InterventionFilters } from '../types/intervention'

export function useInterventionFilters(current: InterventionFilters) {
  const applyFilters = (patch: Partial<InterventionFilters>) => {
    router.visit(window.location.pathname, {
      method: 'get',
      data: { ...current, ...patch },
      preserveState:  true,
      preserveScroll: true,
      replace:        true,
    })
  }

  return { applyFilters }
}
