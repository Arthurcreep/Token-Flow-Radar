const FILTERS = [
  {
    value: 'all',
    label: 'Все'
  },
  {
    value: 'supply_drain',
    label: 'Вывод с бирж'
  },
  {
    value: 'sell_pressure',
    label: 'Завод на биржи'
  },
  {
    value: 'strong',
    label: 'Сильные'
  },
  {
    value: 'large_confirmed',
    label: 'Подтверждено крупными переводами'
  },
  {
    value: 'mixed',
    label: 'Смешанный сигнал'
  }
];

export default function LeaderboardFilters({
  selectedFilter,
  onChange
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const isActive = selectedFilter === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={[
              'rounded-full border px-4 py-2 text-xs font-bold transition',
              isActive
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            ].join(' ')}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
