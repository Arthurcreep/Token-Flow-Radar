import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getTokenCexFlows, getTokenOverview, getTokenSignals, getTokenTopHolders } from '../api/tokensApi';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import MetricCard from '../components/MetricCard';
import { formatNumber, formatPercent, formatUsd, getRegimeStyles, getSignalSeverityStyles, shortAddress } from '../utils/format';

export default function TokenDetailPage() {
  const { symbol } = useParams();

  const [overview, setOverview] = useState(null);
  const [cexFlows, setCexFlows] = useState(null);
  const [holders, setHolders] = useState(null);
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function load() {
      try {
        const [overviewData, cexFlowData, holderData, signalData] = await Promise.all([
          getTokenOverview(symbol),
          getTokenCexFlows(symbol).catch(() => null),
          getTokenTopHolders(symbol).catch(() => null),
          getTokenSignals(symbol).catch(() => [])
        ]);

        setOverview(overviewData);
        setCexFlows(cexFlowData);
        setHolders(holderData);
        setSignals(signalData);
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    }

    load();
  }, [symbol]);

  if (status === 'loading') return <LoadingState message={`Loading ${symbol} dashboard...`} />;
  if (status === 'error') return <ErrorState message="Failed to load token detail" />;

  const cexChartData = cexFlows?.items
    ? [...cexFlows.items].reverse().map((item) => ({
        date: item.date.slice(5),
        netflow: item.cexNetflow
      }))
    : [];

  const topSignal = signals[0];

  return (
    <div className="space-y-8">
      <Link to="/tokens" className="inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200">
        ← Back to tokens
      </Link>

      <section className="panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-5xl font-black tracking-tight text-white">{overview.symbol}</h1>
              <Badge className={getRegimeStyles(overview.regime)}>{overview.regime}</Badge>
            </div>
            <p className="mt-2 text-lg text-slate-400">{overview.name}</p>
            <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-300">
              {overview.explanation || overview.message || 'No explanation available yet.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-slate-900 px-3 py-1">Date: {overview.date || '—'}</span>
              <span className="rounded-full bg-slate-900 px-3 py-1">Freshness: {overview.dataFreshness || 'unknown'}</span>
              <span className="rounded-full bg-slate-900 px-3 py-1">Score version: {overview.scoreVersion || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="metric-label">Final Score</p>
              <p className="mt-3 text-5xl font-black text-white">{overview.finalScore ?? '—'}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="metric-label">Confidence</p>
              <p className="mt-3 text-5xl font-black text-white">
                {overview.confidence !== null && overview.confidence !== undefined ? formatPercent(overview.confidence) : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="CEX Netflow 7d" value={formatNumber(overview.cex?.netflow7d)} hint={formatUsd(overview.cex?.netflowUsd7d)} signed />
        <MetricCard label="CEX Inflow 7d" value={formatNumber(overview.cex?.inflow7d)} hint="Tokens entering exchanges" />
        <MetricCard label="CEX Outflow 7d" value={formatNumber(overview.cex?.outflow7d)} hint="Tokens leaving exchanges" />
        <MetricCard label="Non-CEX Holder Change" value={formatNumber(overview.holders?.nonCexBalanceChange7d)} hint="Top holders excluding CEX" signed />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="CEX flow structure" subtitle="Daily netflow breakdown. Negative values mean supply is leaving known CEX wallets.">
          {cexChartData.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cexChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: '12px', color: '#e5e7eb' }} />
                  <Bar dataKey="netflow" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No CEX flows" description="Run calculate-cex-flows job first." />
          )}
        </Card>

        <Card title="Score decomposition" subtitle="MVP v1 score is intentionally simple.">
          <div className="space-y-4">
            <div className="soft-panel p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">CEX Flow Score</p>
                <p className="text-xl font-bold text-white">{overview.score?.cexFlowScore ?? '—'}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(Math.abs(overview.score?.cexFlowScore || 0), 100)}%` }} />
              </div>
            </div>

            <div className="soft-panel p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Holder Score</p>
                <p className="text-xl font-bold text-white">{overview.score?.holderScore ?? '—'}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(Math.abs(overview.score?.holderScore || 0), 100)}%` }} />
              </div>
            </div>

            {topSignal && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <Badge className={getSignalSeverityStyles(topSignal.severity)}>{topSignal.severity}</Badge>
                <p className="mt-3 font-semibold text-white">{topSignal.summary}</p>
                <p className="mt-2 text-sm text-emerald-100/80">{topSignal.explanation}</p>
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card title="Top holders" subtitle="Known CEX wallets are separated from non-CEX holders.">
        {holders?.items?.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">7d Change</th>
                </tr>
              </thead>
              <tbody>
                {holders.items.map((holder) => (
                  <tr key={holder.id} className="table-row">
                    <td className="px-4 py-3 font-semibold text-slate-300">{holder.rank}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{shortAddress(holder.address.address)}</td>
                    <td className="px-4 py-3">{holder.address.label || holder.address.entity?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <Badge className={holder.isCex ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-300'}>
                        {holder.isCex ? 'CEX' : 'Non-CEX'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(holder.balanceDecimal)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(holder.balanceChange7d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No holder data" description="Run fake holder seed first." />
        )}
      </Card>
    </div>
  );
}
