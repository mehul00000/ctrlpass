export default function HomePageLoading() {
  return (
    <div className="pb-8">
      <div className="relative h-[78vh] min-h-[540px] w-full overflow-hidden">
        <div className="skeleton absolute inset-0 !rounded-none" />
        <div className="container-page absolute inset-0 flex items-center">
          <div className="w-full max-w-2xl space-y-5">
            <div className="skeleton h-7 w-52" />
            <div className="skeleton h-14 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-16 w-full" />
            <div className="flex gap-3">
              <div className="skeleton h-12 w-40" />
              <div className="skeleton h-12 w-40" />
            </div>
          </div>
        </div>
      </div>
      <div className="container-page mt-14 space-y-12">
        {Array.from({ length: 4 }).map((_, row) => (
          <section key={row}>
            <div className="skeleton mb-4 h-6 w-44" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-[150px] shrink-0 sm:w-[170px] lg:w-[190px]">
                  <div className="skeleton aspect-[2/3] w-full rounded-2xl" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
