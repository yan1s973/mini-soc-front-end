import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type SectionProps = {
  id: string
  children: ReactNode
  className?: string
}

export function Section({ id, children, className = '' }: SectionProps) {
  return (
    <section
      id={id}
      className={`relative px-6 py-24 md:py-32 lg:px-[120px] ${className}`}
    >
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  )
}

type TagProps = {
  children: ReactNode
}

export function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex h-[30px] items-center rounded-lg border border-[rgba(164,132,215,0.5)] bg-[rgba(85,80,110,0.4)] px-3 font-cabin text-sm font-medium text-white backdrop-blur-md">
      {children}
    </span>
  )
}

type SectionHeaderProps = {
  tag: string
  title: ReactNode
  children?: ReactNode
}

export function SectionHeader({ tag, title, children }: SectionHeaderProps) {
  return (
    <Reveal className="mx-auto mb-16 flex max-w-[760px] flex-col items-center text-center">
      <Tag>{tag}</Tag>
      <h2 className="mt-5 font-serif text-4xl leading-[1.1] text-balance text-white md:text-6xl">
        {title}
      </h2>
      {children && (
        <p className="mt-5 text-lg text-balance text-white/70">{children}</p>
      )}
    </Reveal>
  )
}

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[rgba(164,132,215,0.18)] bg-surface p-6 ${className}`}
    >
      {children}
    </div>
  )
}
