import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/noyau/ui/CaseStudy";
import { RELEVES, codeOf, releveBySlug } from "@/content/projects";

export function generateStaticParams() {
  return RELEVES.map((r) => ({ slug: r.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = releveBySlug(slug);
  if (!r) return {};
  return { title: `${r.title ?? `Projet ${codeOf(r)}`} — YANIS`, description: r.summary ?? undefined };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = releveBySlug(slug);
  if (!r) notFound();
  return <CaseStudy r={r} />;
}
