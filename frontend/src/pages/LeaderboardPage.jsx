import { useEffect, useMemo, useState } from 'react';

import { getCexFlowLeaderboard } from '../api/marketsApi';
import Card from '../components/common/Card';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import LeaderboardFilters from '../components/leaderboard/LeaderboardFilters';
import LeaderboardGuide from '../components/leaderboard/LeaderboardGuide';
import LeaderboardRangeSwitch from '../components/leaderboard/LeaderboardRangeSwitch';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

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

  if (status === 'loading') return <LoadingState message="Loading CEX flow leaderboard..." />;
  if (status === 'error') return <ErrorState message="Failed to load CEX flow leaderboard." />;

  const range = leaderboard?.range || {};
  const topItem = filteredItems[0] || items[0];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Markets</p>
          <h1 className="mt-3 text-4xl font-black text-white">CEX Flow Leaderboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Ranking of tokens by backend-calculated CEX inflow/outflow behavior. This is a flow-anomaly shortlist, not a buy/sell signal.
          </p>
        </div>

        <LeaderboardRangeSwitch selectedRange={selectedRange} onChange={setSelectedRange} />
      </section>

      <LeaderboardGuide />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <LeaderboardFilters selectedFilter={selectedFilter} onChange={setSelectedFilter} />

        <p className="text-sm text-slate-500">
          Filtered: <span className="font-bold text-slate-300">{filteredItems.length}</span> / {items.length}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card title="Range" subtitle={range.calendarWindow || '—'}>
          <p className="text-2xl font-black text-white">{range.label || selectedRange.toUpperCase()}</p>
          <p className="mt-2 text-sm text-slate-500">Latest data date: {range.latestDataDate || '—'}</p>
        </Card>

        <Card title="Tokens" subtitle="Loaded into leaderboard">
          <p className="text-2xl font-black text-white">{range.loadedTokens ?? items.length}</p>
          <p className="mt-2 text-sm text-slate-500">Source: real recent CEX flows</p>
        </Card>

        <Card title="Top visible signal" subtitle="Highest ranked after filter">
          <p className="text-2xl font-black text-white">{topItem?.token?.symbol || '—'}</p>
          <p className="mt-2 text-sm text-slate-500">{topItem?.regimeHint?.replaceAll('_', ' ') || 'No signal'}</p>
        </Card>

        <Card title="Data mode" subtitle="Current leaderboard source">
          <p className="text-2xl font-black text-emerald-300">real</p>
          <p className="mt-2 break-all text-xs text-slate-500">{leaderboard?.source || '—'}</p>
        </Card>
      </div>

      {leaderboard?.warning && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {leaderboard.warning}
        </div>
      )}

      <LeaderboardTable items={filteredItems} totalItems={items.length} selectedFilter={selectedFilter} />
    </div>
  );
}
