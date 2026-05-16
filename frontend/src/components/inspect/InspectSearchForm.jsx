export default function InspectSearchForm({
  query,
  onQueryChange,
  onSubmit,
  status
}) {
  const isLoading = status === 'loading';

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
    >
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Token symbol or ERC-20 contract address
      </label>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="UNI or 0xd533a949740bb3306d119cc777fa900ba034cd52"
          className="min-h-[48px] flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
        />

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Resolving...' : 'Resolve token'}
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Frontend sends your input as-is. Backend decides whether it is a symbol or a contract address.
      </p>
    </form>
  );
}
