import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type PanelProps = {
  id?: string
  title: string
  icon: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({
  id,
  title,
  icon: Icon,
  action,
  children,
  className = '',
}: PanelProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-5 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-manrope text-[15px] font-semibold text-white">
          <Icon className="h-4 w-4 text-lavender" />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}
