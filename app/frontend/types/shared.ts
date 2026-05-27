export interface AppShellCampaign {
  name: string
  started_on: string
  stopped_on: string
}

export interface AppShellUser {
  name: string
  initials: string
}

export interface AppShellProps {
  farm: { name: string }
  campaign: AppShellCampaign | null
  user: AppShellUser
}

export interface InertiaSharedProps {
  appShell: AppShellProps
  flash: { notice: string | null; alert: string | null }
  errors: Record<string, string>
  [key: string]: unknown
}
