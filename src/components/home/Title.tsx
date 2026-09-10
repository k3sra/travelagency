/** Sets the journey's emphasised word in italic gold, e.g. "Kyoto, in *Silence*". */
export function Title({ title, em }: { title: string; em?: string }) {
  if (!em || !title.includes(em)) return <>{title}</>;
  const i = title.indexOf(em);
  return (
    <>
      {title.slice(0, i)}
      <em>{em}</em>
      {title.slice(i + em.length)}
    </>
  );
}
