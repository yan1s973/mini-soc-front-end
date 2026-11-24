import type { Metadata } from "next";
import { Noyau } from "@/components/noyau/Noyau";

export const metadata: Metadata = { title: "YANIS — Noyau (prototype)" };

export default function Page() {
  return <Noyau />;
}
