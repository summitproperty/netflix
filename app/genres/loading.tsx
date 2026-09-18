/** Genre index skeleton: heading block plus the two tile grids. */
export default function GenresLoading() {
  return (
    <div className="page-shell" aria-hidden="true">
      <div className="mb-6 space-y-3">
        <div className="skeleton h-8 w-32 rounded" />
        <div className="skeleton h-3 w-72 max-w-full rounded" />
      </div>

      {[0, 1].map((section) => (
        <section key={section} className={section === 0 ? "" : "mt-10"}>
          <div className="skeleton mb-3 h-4 w-32 rounded" />
          {/* Matches GenreTiles: same columns and tile height, so /genres does
              not reflow when the real grid arrives. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, tile) => (
              <div key={tile} className="skeleton h-24 rounded-xl sm:h-28" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
