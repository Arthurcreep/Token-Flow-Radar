import { useEffect, useMemo, useState } from 'react';

import { getSignals } from '../api/signalsApi';
import Badge from '../components/Badge';
import Card from '../components/Card';
import DataModeBadge from '../components/DataModeBadge';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { formatDateTime, formatPercent, getRegimeStyles, getSignalSeverityStyles } from '../utils/format';

export default function SignalsPage() {
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    async function load() {
      try {
        const data = await getSignals();
        setSignals(data);
        setStatus('ready');
      } catch (error) {
        setStatus('error');
      }
    }

    load();
  }, []);

  const highSeverityCount = useMemo(() => signals.filter((signal) => signal.severity === 'high').length, [signals]);

  if (status === 'loading') return <LoadingState message="Loading signal journal..." />;
  if (status === 'error') return <ErrorState message="Failed to load signals" />;

  return (
    <div className="space-y-8">
      <section className="panel p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="metric-label">Signal Journal</p>
            <h1 className="mt-3 page-title">Detected regime events</h1>
            <p className="page-subtitle">
              Журнал фиксирует события, которые система уже распознала на основе token metrics.
              Data mode обязателен: fake-сигналы нельзя путать с реальным рынком.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="soft-panel p-4">
              <p className="metric-label">Signals</p>
              <p className="metric-value">{signals.length}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="metric-label">High</p>
              <p className="metric-value">{highSeverityCount}</p>
            </div>
          </div>
        </div>
      </section>

      <Card title="Latest signals">
        {signals.length ? (
          <div className="space-y-4">
            {signals.map((signal) => (
              <article key={signal.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-slate-700">
                <div className="mb-4">
                  <DataModeBadge
                    dataMode={signal.dataMode}
                    sourceLabel={signal.sourceLabel}
                    sourceWarning={signal.sourceWarning}
                  />
                </div>

                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">{signal.token.symbol}</Badge>
                      <Badge className={getRegimeStyles(signal.regime)}>{signal.regime}</Badge>
                      <Badge className={getSignalSeverityStyles(signal.severity)}>{signal.severity}</Badge>
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-white">{signal.summary}</h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{signal.explanation}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-600">{signal.signalType}</p>
                  </div>

                  <div className="grid min-w-[240px] grid-cols-2 gap-3 lg:text-right">
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-xs text-slate-500">Score</p>
                      <p className="mt-1 text-2xl font-bold text-white">{signal.score}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-xs text-slate-500">Confidence</p>
                      <p className="mt-1 text-2xl font-bold text-white">{formatPercent(signal.confidence)}</p>
                    </div>
                    <div className="col-span-2 rounded-2xl bg-slate-900 p-4">
                      <p className="text-xs text-slate-500">Timestamp</p>
                      <p className="mt-1 text-sm font-semibold text-slate-300">{formatDateTime(signal.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No signals yet" description="Run generate-signals job for UNI." />
        )}
      </Card>
    </div>
  );
}
