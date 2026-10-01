import {
  BookOpen,
  Boxes,
  BrainCircuit,
  Cable,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  Layers,
  Radio,
  Server,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

type Brick = {
  icon: LucideIcon
  name: string
  role: string
}

const bricks: Brick[] = [
  {
    icon: Server,
    name: 'Node.js',
    role: 'Backend en couches : services, models et config séparés.',
  },
  {
    icon: BrainCircuit,
    name: 'TensorFlow.js',
    role: 'Réseau de neurones, entraînement et prédiction.',
  },
  {
    icon: Radio,
    name: 'CoinGecko',
    role: 'Flux de prix Bitcoin réel, toutes les 10 secondes.',
  },
  {
    icon: Database,
    name: 'PostgreSQL',
    role: 'Historique persistant : recherche, statistiques, redémarrage.',
  },
  {
    icon: Layers,
    name: 'Redis',
    role: 'Cache de la dernière donnée connue et backend de la queue.',
  },
  {
    icon: Boxes,
    name: 'BullMQ',
    role: 'Queue de réentraînement et worker asynchrone séparé.',
  },
  {
    icon: Cable,
    name: 'WebSocket',
    role: 'Mises à jour instantanées du dashboard, sans sondage.',
  },
  {
    icon: BookOpen,
    name: 'Swagger',
    role: 'API documentée et testable sans lire le code.',
  },
  {
    icon: FlaskConical,
    name: 'Jest',
    role: 'npm test vérifie les fonctionnalités avant chaque évolution.',
  },
  {
    icon: FileText,
    name: 'Winston',
    role: 'Logs structurés INFO / WARN / ERROR dans des fichiers dédiés.',
  },
  {
    icon: GitBranch,
    name: 'GitHub Actions',
    role: 'À chaque push : tests, validation, résultat.',
  },
]

type Endpoint = {
  method: 'GET' | 'POST'
  path: string
  description: string
}

const endpoints: Endpoint[] = [
  { method: 'GET', path: '/data', description: 'Dernière donnée et prédiction' },
  { method: 'POST', path: '/shock', description: 'Simuler un choc de marché' },
  { method: 'POST', path: '/rollback', description: 'Revenir à une version' },
  { method: 'GET', path: '/leaderboard', description: 'Classement des candidats' },
  { method: 'GET', path: '/models', description: 'Versions disponibles' },
]

const ciSteps = ['git push', 'Tests Jest', 'Validation', 'Résultat']

export function Architecture() {
  return (
    <Section id="architecture" className="bg-surface/60">
      <SectionHeader
        tag="Architecture"
        title={
          <>
            Chaque brique répond à <em className="italic">un vrai besoin</em>
          </>
        }
      >
        Pas une liste de technologies pour la forme : chacune résout un
        problème précis de la mise en production.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bricks.map((brick, index) => (
          <Reveal key={brick.name} delay={(index % 4) * 60}>
            <Card className="h-full">
              <brick.icon className="h-6 w-6 text-lavender" />
              <h3 className="mt-4 font-manrope text-base font-semibold text-white">
                {brick.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {brick.role}
              </p>
            </Card>
          </Reveal>
        ))}
        <Reveal delay={180}>
          <div className="flex h-full flex-col justify-between rounded-2xl bg-primary p-6">
            <p className="font-serif text-3xl leading-tight text-white">
              Onze briques, <em className="italic">un seul</em> système.
            </p>
            <a
              href="#evaluation"
              className="mt-6 font-cabin text-base font-medium text-white transition-opacity hover:opacity-80"
            >
              Voir les résultats →
            </a>
          </div>
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full md:p-8">
            <p className="font-cabin text-sm font-medium text-lavender">
              API REST documentée avec Swagger
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {endpoints.map((endpoint) => (
                <li
                  key={endpoint.path}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-black/50 px-4 py-3"
                >
                  <span
                    className={`w-12 rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-semibold ${
                      endpoint.method === 'GET'
                        ? 'bg-lavender/20 text-lavender'
                        : 'bg-primary text-white'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-sm text-white">
                    {endpoint.path}
                  </code>
                  <span className="text-sm text-white/50">
                    {endpoint.description}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={150}>
          <Card className="flex h-full flex-col md:p-8">
            <p className="font-cabin text-sm font-medium text-lavender">
              Intégration continue
            </p>
            <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {ciSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="rounded-lg border border-primary/60 bg-black px-3 py-2 font-mono text-sm whitespace-nowrap text-white">
                    {step}
                  </span>
                  {index < ciSteps.length - 1 && (
                    <span className="hidden text-white/30 sm:inline" aria-hidden="true">
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-auto pt-6 text-white/70">
              À chaque modification, GitHub Actions lance les tests. On sait
              immédiatement si quelque chose a cassé, avant que ça n'arrive en
              production.
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}
