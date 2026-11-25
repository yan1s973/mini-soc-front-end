import type { Metadata } from "next";
import { Certifications } from "@/components/noyau/ui/Certifications";

export const metadata: Metadata = { title: "Certifications — YANIS" };

export default function Page() {
  return <Certifications />;
}
