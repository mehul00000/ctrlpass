export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-white/5 pb-10 pt-28 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand/25 blur-[140px]"
      />
      <div className="container-page relative">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-peach">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
