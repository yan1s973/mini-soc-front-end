/**
 * Lettres en rouleau. Chaque lettre est une colonne de deux glyphes : la
 * lettre pleine, puis sa jumelle en contour. Au survol d'un parent
 * `.roll-root`, les colonnes roulent l'une après l'autre. Les lettres sont
 * groupées par mot : on ne coupe jamais un mot en deux.
 */
export function Roll({ text, className = "" }: { text: string; className?: string }) {
  let k = 0;
  return (
    <span className={`roll ${className}`} aria-label={text}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="roll-word" aria-hidden="true">
          {word.split("").map((c, ci) => (
            <span key={ci} className="roll-col" style={{ transitionDelay: `${k++ * 16}ms` }}>
              <span className="roll-a">{c}</span>
              <span className="roll-b">{c}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
