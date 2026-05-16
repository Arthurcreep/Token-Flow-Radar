const RANGE_OPTIONS = [
  { value: '1d', label: '1D' },
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '1y', label: '1Y' }
];

export default function LeaderboardRangeSwitch({ selectedRange, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
      {RANGE_OPTIONS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[
            'rounded-xl px-4 py-2 text-xs font-bold transition',
            selectedRange === item.value
              ? 'bg-cyan-400/15 text-cyan-200'
              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
