import { Logo } from '../Logo'

export function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden px-6 pt-24 pb-10 lg:px-[120px]">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center text-center">
        <h2 className="max-w-[760px] font-serif text-4xl leading-[1.1] text-balance text-white md:text-6xl">
          Envie d'en savoir <em className="italic">plus</em> ?
        </h2>
        <p className="mt-5 max-w-[560px] text-lg text-white/70">
          Le code, la démo et la documentation de l'API sont disponibles.
          N'hésitez pas à me contacter pour en discuter.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#github"
            className="rounded-[10px] bg-primary px-6 py-3.5 font-cabin text-base font-medium text-white transition-colors hover:bg-[#8d52fd]"
          >
            Voir le code sur GitHub
          </a>
          <a
            href="#contact"
            className="rounded-[10px] bg-primary-dark px-6 py-3.5 font-cabin text-base font-medium text-[#f6f7f9] transition-colors hover:bg-[#3a3058]"
          >
            Me contacter
          </a>
        </div>

        <div className="mt-24 flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <span className="flex items-center gap-2 text-white">
            <Logo className="h-6 w-6" />
            <span className="font-manrope text-base font-semibold tracking-tight">
              DataOracle
            </span>
          </span>
          <p className="text-sm text-white/40">
            Projet MLOps · Node.js, TensorFlow.js, PostgreSQL, Redis
          </p>
        </div>
      </div>
    </footer>
  )
}
