const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'supply_drain', label: 'Supply Drain' },
  { value: 'sell_pressure', label: 'Sell Pressure' },
  { value: 'strong', label: 'Strong only' },
  { value: 'large_confirmed', label: 'Large confirmed' },
  { value: 'mixed', label: 'Mixed' }
];

export default function LeaderboardFilters({ selectedFilter, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={[
            'rounded-2xl border px-4 py-2 text-xs font-bold transition',
            selectedFilter === filter.value
              ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
              : 'border-slate-800 bg-slate-950/70 text-slate-500 hover:bg-slate-900 hover:text-slate-200'
          ].join(' ')}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
