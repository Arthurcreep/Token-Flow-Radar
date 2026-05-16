import { useEffect, useMemo, useState } from 'react';

import { getCexFlowLeaderboard } from '../api/marketsApi';
import Card from '../components/common/Card';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import LeaderboardFilters from '../components/leaderboard/LeaderboardFilters';
import LeaderboardGuide from '../components/leaderboard/LeaderboardGuide';
import LeaderboardRangeSwitch from '../components/leaderboard/LeaderboardRangeSwitch';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import LeaderboardOverview from '../components/leaderboard/LeaderboardOverview';

function filterItems(items, selectedFilter) {
  if (selectedFilter === 'all') return items;

  if (selectedFilter === 'supply_drain') {
    return items.filter((item) => item.regimeHint === 'CEX_SUPPLY_DRAIN');
  }

  if (selectedFilter === 'sell_pressure') {
    return items.filter((item) => item.regimeHint === 'CEX_SELL_PRESSURE');
  }

  if (selectedFilter === 'strong') {
    return items.filter((item) => ['very_strong', 'strong'].includes(item.strength));
  }

  if (selectedFilter === 'large_confirmed') {
    return items.filter((item) => (
      (item.regimeHint === 'CEX_SUPPLY_DRAIN' && item.largeFlowHint === 'LARGE_SUPPLY_DRAIN') ||
      (item.regimeHint === 'CEX_SELL_PRESSURE' && item.largeFlowHint === 'LARGE_SELL_PRESSURE')
    ));
  }

  if (selectedFilter === 'mixed') {
    return items.filter((item) => {
      if (item.largeFlowHint === 'NO_LARGE_FLOW') return false;

      return (
        (item.regimeHint === 'CEX_SUPPLY_DRAIN' && item.largeFlowHint === 'LARGE_SELL_PRESSURE') ||
        (item.regimeHint === 'CEX_SELL_PRESSURE' && item.largeFlowHint === 'LARGE_SUPPLY_DRAIN')
      );
    });
  }

  return items;
}

function translateRegimeHint(value) {
  if (value === 'CEX_SUPPLY_DRAIN') return 'Вывод с бирж: предложение на CEX снижается';
  if (value === 'CEX_SELL_PRESSURE') return 'Завод на биржи: возможно давление продажи';
  if (value === 'NEUTRAL') return 'Нейтрально';

  return 'Сигнал не определен';
}

export default function LeaderboardPage() {
  const [selectedRange, setSelectedRange] = useState('1m');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [leaderboard, setLeaderboard] = useState(null);
  const [status, setStatus] = useState('loading');

  async function loadLeaderboard(range) {
    setStatus('loading');

    try {
      const data = await getCexFlowLeaderboard({
        range,
        limit: 50
      });

      setLeaderboard(data);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  }

  useEffect(() => {
    loadLeaderboard(selectedRange);
  }, [selectedRange]);

  const items = leaderboard?.items || [];
  const filteredItems = useMemo(() => filterItems(items, selectedFilter), [items, selectedFilter]);

  if (status === 'loading') {
    return <LoadingState message="Загружаем рейтинг CEX-потоков..." />;
  }

  if (status === 'error') {
    return <ErrorState message="Не удалось загрузить рейтинг CEX-потоков." />;
  }

  const range = leaderboard?.range || {};
  const topItem = filteredItems[0] || items[0];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Рынок
          </p>

          <h1 className="mt-3 text-4xl font-black text-white">
            Рейтинг CEX-потоков
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Здесь показано, какие токены заводят на известные биржевые кошельки и какие токены выводят с них.
            Вывод с бирж может означать снижение доступного предложения, а завод на биржи может означать возможное давление продажи.
            Это исследовательская витрина, а не команда покупать или продавать.
          </p>
        </div>

        <LeaderboardRangeSwitch selectedRange={selectedRange} onChange={setSelectedRange} />
      </section>

      <LeaderboardGuide />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <LeaderboardFilters selectedFilter={selectedFilter} onChange={setSelectedFilter} />

        <p className="text-sm text-slate-500">
          Показано:{' '}
          <span className="font-bold text-slate-300">{filteredItems.length}</span>
          {' '}из {items.length}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card title="Диапазон" subtitle={range.calendarWindow || '—'}>
          <p className="text-2xl font-black text-white">
            {range.label || selectedRange.toUpperCase()}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Последняя дата данных: {range.latestDataDate || '—'}
          </p>
        </Card>

        <Card title="Токены" subtitle="Попали в текущий рейтинг">
          <p className="text-2xl font-black text-white">
            {range.loadedTokens ?? items.length}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Источник: реальные свежие переводы по CEX-адресам
          </p>
        </Card>

        <Card title="Главный видимый сигнал" subtitle="Первый токен после выбранных фильтров">
          <p className="text-2xl font-black text-white">
            {topItem?.token?.symbol || '—'}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {translateRegimeHint(topItem?.regimeHint)}
          </p>
        </Card>

        <Card title="Режим данных" subtitle="Источник текущего расчета">
          <p className="text-2xl font-black text-emerald-300">
            реальные данные
          </p>

          <p className="mt-2 break-all text-xs text-slate-500">
            {leaderboard?.source || '—'}
          </p>
        </Card>
      </div>

      {leaderboard?.warning && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {leaderboard.warning}
        </div>
      )}

      <LeaderboardOverview items={filteredItems} />

      <LeaderboardTable
        items={filteredItems}
        totalItems={items.length}
        selectedFilter={selectedFilter}
      />
    </div>
  );
}
