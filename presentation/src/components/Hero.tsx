import { Navbar } from './Navbar'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4'

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative flex min-h-screen flex-col overflow-hidden"
    >
      <video
        className="absolute inset-0 h-full min-h-screen w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      <Navbar />

      <div className="relative z-10 mx-auto mt-32 flex w-full flex-col items-center px-6 pb-24 text-center">
        <div className="inline-flex h-[38px] items-center whitespace-nowrap gap-2 rounded-[10px] border border-[rgba(164,132,215,0.5)] bg-[rgba(85,80,110,0.4)] pr-3 pl-1 font-cabin text-sm font-medium text-white backdrop-blur-md">
          <span className="rounded-md bg-primary px-2 py-1 leading-none">
            Nouveau
          </span>
          Plateforme MLOps temps réel
        </div>

        <h1 className="mt-6 max-w-[1000px] font-serif text-balance text-5xl leading-[1.1] text-white md:text-7xl lg:text-[96px]">
          L'IA qui prédit, se surveille{' '}
          <em className="mx-1 italic">et</em> se corrige seule
        </h1>

        <p className="mt-6 max-w-[662px] font-inter text-lg font-normal text-white/70">
          DataOracle prédit le prix du Bitcoin en temps réel, détecte ses
          propres dérives avec deux méthodes statistiques et ne déploie un
          nouveau modèle que s'il bat le précédent.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#projet"
            className="rounded-[10px] bg-primary px-6 py-3.5 font-cabin text-base font-medium text-white transition-colors hover:bg-[#8d52fd]"
          >
            Découvrir le projet
          </a>
          <a
            href="#architecture"
            className="rounded-[10px] bg-primary-dark px-6 py-3.5 font-cabin text-base font-medium text-[#f6f7f9] transition-colors hover:bg-[#3a3058]"
          >
            Voir l'architecture
          </a>
        </div>
      </div>
    </section>
  )
}
