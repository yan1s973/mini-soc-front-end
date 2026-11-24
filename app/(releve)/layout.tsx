import { Stage } from "@/components/ui/Stage";

/** Le parcours RELEVÉ : couches persistantes (terrain, bornes, navigation). */
export default function ReleveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Stage />
      {children}
    </>
  );
}
