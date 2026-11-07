import { PersonCard } from "@/components/MediaCard";

interface Person {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export function CastRow({ cast }: { cast: Person[] }) {
  if (!cast.length) return null;
  return (
    <section>
      <h2 className="section-title mb-5">Top Billed Cast</h2>
      <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
        {cast.map((p) => (
          <div key={p.id} className="w-24 shrink-0 sm:w-28">
            <PersonCard person={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function InfoGrid({
  facts,
}: {
  facts: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
      {facts.map((f) => (
        <div key={f.label}>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{f.label}</p>
          <div className="mt-1.5 text-sm font-medium text-neutral-200">{f.value}</div>
        </div>
      ))}
    </div>
  );
}

export function CompanyLogos({
  companies,
}: {
  companies: Array<{ id: number; name: string; logoPath: string | null }>;
}) {
  if (!companies.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      {companies.map((c) =>
        c.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.id}
            src={`https://image.tmdb.org/t/p/w185${c.logoPath}`}
            alt={c.name}
            title={c.name}
            className="h-8 w-auto max-w-[110px] object-contain opacity-70 brightness-0 invert"
            loading="lazy"
          />
        ) : (
          <span key={c.id} className="text-sm text-neutral-400">
            {c.name}
          </span>
        )
      )}
    </div>
  );
}
