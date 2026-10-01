import {
  HeartPulse,
  LayoutDashboard,
  Package,
  ScrollText,
  TriangleAlert,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '../Logo'

type NavItem = {
  id: string
  label: string
  icon: LucideIcon
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Général',
    items: [
      { id: 'vue-ensemble', label: 'Vue d’ensemble', icon: LayoutDashboard },
      { id: 'activite', label: 'Activité', icon: ScrollText },
      { id: 'anomalies', label: 'Anomalies', icon: TriangleAlert },
    ],
  },
  {
    title: 'Modèles',
    items: [
      { id: 'leaderboard', label: 'Leaderboard AutoML', icon: Trophy },
      { id: 'modeles', label: 'Versions', icon: Package },
      { id: 'sante', label: 'Santé de l’IA', icon: HeartPulse },
    ],
  },
]

type SidebarProps = {
  active: string
  onSelect: (id: string) => void
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-white/[0.06] p-4 lg:flex">
      <div className="flex items-center gap-2 px-2 py-2 text-white">
        <Logo className="h-6 w-6" />
        <span className="font-manrope text-base font-semibold tracking-tight">
          DataOracle
        </span>
      </div>

      <nav className="mt-6 flex flex-col gap-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-2 font-manrope text-xs font-medium text-white/40">
              {group.title}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = item.id === active
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-manrope text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-[rgba(164,132,215,0.3)] bg-primary-dark/50 p-4">
        <p className="font-manrope text-sm font-semibold text-white">
          Mode démo
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/60">
          Données simulées dans le navigateur. Branché au backend, le
          dashboard affiche le flux CoinGecko réel.
        </p>
      </div>
    </aside>
  )
}

export function MobileTabs({ active, onSelect }: SidebarProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-white/[0.06] px-4 py-3 lg:hidden">
      {navGroups
        .flatMap((group) => group.items)
        .map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => onSelect(item.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 font-manrope text-sm font-medium whitespace-nowrap ${
              item.id === active
                ? 'bg-primary text-white'
                : 'bg-white/5 text-white/70'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </a>
        ))}
    </nav>
  )
}
