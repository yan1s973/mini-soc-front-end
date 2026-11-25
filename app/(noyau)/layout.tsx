import { Engine } from "@/components/noyau/Engine";
import { Cursor } from "@/components/noyau/ui/Cursor";
import { Loader } from "@/components/noyau/ui/Loader";
import { MediaLayer } from "@/components/noyau/ui/Media";
import { Nav } from "@/components/noyau/ui/Nav";
import { TransitionLayer } from "@/components/noyau/ui/Transition";

/** NOYAU : moteur et interface persistants entre l'accueil et les fiches. */
export default function NoyauLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nz">
      <Engine />
      <MediaLayer />
      <Nav />
      {children}
      <TransitionLayer />
      <Cursor />
      <Loader />
    </div>
  );
}
