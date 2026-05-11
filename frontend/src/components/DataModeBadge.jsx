export default function DataModeBadge({ dataMode, sourceLabel, sourceWarning }) {
  if (dataMode === 'real') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        <span className="font-bold uppercase tracking-[0.18em]">Real Data</span>
        {sourceLabel && <span className="ml-2 text-emerald-100/80">{sourceLabel}</span>}
      </div>
    );
  }

  if (dataMode === 'not_calculated') {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
        <span className="font-bold uppercase tracking-[0.18em]">No Metrics</span>
        {sourceLabel && <span className="ml-2 text-slate-400">{sourceLabel}</span>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <span className="font-bold uppercase tracking-[0.18em]">Fake Data / Demo Mode</span>
      {sourceLabel && <span className="ml-2 text-red-100/80">{sourceLabel}</span>}
      {sourceWarning && <p className="mt-2 text-xs leading-5 text-red-100/70">{sourceWarning}</p>}
    </div>
  );
}
