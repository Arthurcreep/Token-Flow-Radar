export default function Card({ title, subtitle, children, right, className = '' }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
