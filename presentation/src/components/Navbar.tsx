import { ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'

type NavLink = {
  label: string
  href: string
  hasDropdown?: boolean
}

const projectLinks = [
  { label: 'Le problème', href: '#projet' },
  { label: 'Le cycle temps réel', href: '#fonctionnement' },
  { label: 'Détection de dérive', href: '#derive' },
  { label: 'Réentraînement', href: '#reentrainement' },
  { label: 'Dashboard & Oracle AI', href: '#dashboard' },
  { label: 'Évaluation', href: '#evaluation' },
]

const links: NavLink[] = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Le projet', href: '#projet', hasDropdown: true },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  // Block page scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header className="relative z-20 w-full px-6 py-4 lg:px-[120px]">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-12">
          <a
            href="#accueil"
            className="flex items-center gap-2 text-white"
            aria-label="DataOracle — accueil"
          >
            <Logo className="h-7 w-7" />
            <span className="font-manrope text-lg font-semibold tracking-tight">
              DataOracle
            </span>
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <li key={link.label} className="group relative">
                <a
                  href={link.href}
                  className="flex items-center gap-1 font-manrope text-sm font-medium text-white transition-opacity hover:opacity-80"
                >
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown className="h-4 w-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
                  )}
                </a>
                {link.hasDropdown && (
                  <div className="invisible absolute top-full left-0 pt-3 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="w-60 rounded-xl border border-[rgba(164,132,215,0.3)] bg-[rgba(20,16,32,0.9)] p-2 backdrop-blur-md">
                      {projectLinks.map((item) => (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            className="block rounded-lg px-3 py-2 font-manrope text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#github"
            className="rounded-lg border border-[#d4d4d4] bg-white px-4 py-2 font-manrope text-sm font-semibold text-[#171717] transition-colors hover:bg-neutral-100"
          >
            GitHub
          </a>
          <a
            href="#demo"
            className="rounded-lg bg-primary px-4 py-2 font-manrope text-sm font-semibold text-[#fafafa] shadow-[0_1px_2px_rgba(0,0,0,0.15),0_4px_12px_rgba(123,57,252,0.35)] transition-colors hover:bg-[#8d52fd]"
          >
            Voir la démo
          </a>
        </div>

        <button
          type="button"
          className="text-white lg:hidden"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={isOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <Logo className="h-7 w-7" />
              <span className="font-manrope text-lg font-semibold tracking-tight">
                DataOracle
              </span>
            </span>
            <button
              type="button"
              className="text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <ul className="mt-16 flex flex-col gap-8">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 font-manrope text-2xl font-medium text-white transition-opacity hover:opacity-80"
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="h-5 w-5" />}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3 pb-6">
            <a
              href="#github"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-[#d4d4d4] bg-white px-4 py-3 text-center font-manrope text-sm font-semibold text-[#171717]"
            >
              GitHub
            </a>
            <a
              href="#demo"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-primary px-4 py-3 text-center font-manrope text-sm font-semibold text-[#fafafa] shadow-sm"
            >
              Voir la démo
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
