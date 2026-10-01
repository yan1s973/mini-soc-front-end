import type { LogEntry } from '../../data/types'
import { LogBadge } from './badges'

const TOAST_MS = 4500

type ToastsProps = {
  logs: LogEntry[]
  now: number
}

// Notable events stay on screen for a few seconds after they are logged.
export function Toasts({ logs, now }: ToastsProps) {
  const toasts = logs
    .filter((log) => log.notify && now - log.time < TOAST_MS)
    .slice(0, 3)

  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-40 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-xl border border-white/10 bg-[#15111f]/95 p-3 shadow-2xl backdrop-blur"
        >
          <p className="flex items-center gap-2 font-manrope text-sm font-semibold text-white">
            <LogBadge status={toast.status} />
            {toast.type}
          </p>
          <p className="mt-1.5 text-xs text-white/70">{toast.details}</p>
        </div>
      ))}
    </div>
  )
}
