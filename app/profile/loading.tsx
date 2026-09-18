/** Profile skeleton: mirrors the max-w-3xl form + summary card layout. */
export default function ProfileLoading() {
  return (
    <div className="page-shell max-w-3xl" aria-hidden="true">
      <div className="mb-6 space-y-3">
        <div className="skeleton h-8 w-44 rounded" />
        <div className="skeleton h-3 w-64 max-w-full rounded" />
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <section className="card-surface space-y-4 p-5 sm:p-6">
          {[0, 1, 2].map((field) => (
            <div key={field} className="space-y-2">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-11 w-full rounded-lg" />
            </div>
          ))}
          <div className="skeleton h-11 w-36 rounded-lg" />
        </section>

        <aside className="card-surface flex w-full flex-col gap-4 p-5 sm:w-64">
          <div className="space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-7 w-10 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="skeleton h-11 w-full rounded-lg" />
          <div className="skeleton h-11 w-full rounded-lg" />
        </aside>
      </div>
    </div>
  );
}
