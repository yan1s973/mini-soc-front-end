import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'

const links = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Activité', href: '#activite' },
  { label: 'Modèles', href: '#modeles' },
]

type NavbarProps = {
  onShock: () => void
}

export function Navbar({ onShock }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Block page scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const shockAndClose = () => {
    onShock()
    setIsOpen(false)
  }

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
              <li key={link.label}>
                <a
                  href={link.href}
                  className="font-manrope text-sm font-medium text-white transition-opacity hover:opacity-80"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/api-docs"
            className="rounded-lg border border-[#d4d4d4] bg-white px-4 py-2 font-manrope text-sm font-semibold text-[#171717] transition-colors hover:bg-neutral-100"
          >
            API Swagger
          </a>
          <a
            href="#dashboard"
            onClick={onShock}
            className="rounded-lg bg-primary px-4 py-2 font-manrope text-sm font-semibold text-[#fafafa] shadow-[0_1px_2px_rgba(0,0,0,0.15),0_4px_12px_rgba(123,57,252,0.35)] transition-colors hover:bg-[#8d52fd]"
          >
            Simuler un choc
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
                  className="font-manrope text-2xl font-medium text-white transition-opacity hover:opacity-80"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 pb-6">
            <a
              href="/api-docs"
              className="rounded-lg border border-[#d4d4d4] bg-white px-4 py-3 text-center font-manrope text-sm font-semibold text-[#171717]"
            >
              API Swagger
            </a>
            <a
              href="#dashboard"
              onClick={shockAndClose}
              className="rounded-lg bg-primary px-4 py-3 text-center font-manrope text-sm font-semibold text-[#fafafa] shadow-sm"
            >
              Simuler un choc
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
