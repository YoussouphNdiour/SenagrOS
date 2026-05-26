import type { LucideIcon } from 'lucide-react'

interface IconBoxProps {
  icon: LucideIcon
  color: string
  bg: string
  size?: number
}

export function IconBox({ icon: Icon, color, bg, size = 48 }: IconBoxProps) {
  return (
    <div
      className="flex items-center justify-center rounded-xl shrink-0"
      style={{ width: size, height: size, background: bg }}
    >
      <Icon size={Math.round(size * 0.46)} style={{ color }} />
    </div>
  )
}
