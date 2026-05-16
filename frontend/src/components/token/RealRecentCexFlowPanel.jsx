import { useMemo } from 'react';

import { formatNumber } from '../../utils/format';
import Card from '../common/Card';
import MetricCard from '../common/MetricCard';
import Badge from '../common/Badge';
import CexFlowChart from './CexFlowChart';

const labels = {
  ru: {
    title: 'Real Recent CEX Flows',
    subtitle:
      'Отдельный real-data слой: свежие transfers с известных CEX-кошельков. Это не полный accumulation score, а только CEX-flow сигнал.',
    refresh: 'Обновить real recent CEX flows',
    refreshing: 'Обновляем recent CEX flows...',
    success: 'Real recent CEX flows обновлены.',
    failed: 'Не удалось обновить real recent CEX flows.',
    netflow: 'Netflow',
    inflow: 'Inflow на CEX',
    outflow: 'Outflow с CEX',
    txCount: 'Tx count',
    inflowHint: 'Завод на CEX = возможное давление продажи',
    outflowHint: 'Вывод с CEX = supply drain / снижение доступного supply',
    netflowHintPositive: 'CEX balance растет: возможный sell pressure',
    netflowHintNegative: 'CEX balance падает: supply drain',
    netflowHintNeutral: 'Нет явного перекоса',
    noData: 'Real recent CEX flows пока не рассчитаны.',
    noDataDescription:
      'Нажми кнопку обновления или запусти backend jobs: ingest-recent-transfers + calculate-cex-flows.',
    source: 'Источник',
    dataMode: 'Режим',
    regimeHint: 'Подсказка режима',
    rows: 'Дней',
    processed: 'Обработано'
  },
  en: {
    title: 'Real Recent CEX Flows',
    subtitle:
      'Separate real-data layer: recent transfers from known CEX wallets. This is not a full accumulation score; it is only a CEX-flow signal.',
    refresh: 'Refresh real recent CEX flows',
    refreshing: 'Refreshing recent CEX flows...',
    success: 'Real recent CEX flows refreshed.',
    failed: 'Failed to refresh real recent CEX flows.',
    netflow: 'Netflow',
    inflow: 'CEX Inflow',
    outflow: 'CEX Outflow',
    txCount: 'Tx count',
    inflowHint: 'CEX inflow = possible sell pressure',
    outflowHint: 'CEX outflow = supply drain / lower available supply',
    netflowHintPositive: 'CEX balance is rising: possible sell pressure',
    netflowHintNegative: 'CEX balance is falling: supply drain',
    netflowHintNeutral: 'No clear imbalance',
    noData: 'Real recent CEX flows are not calculated yet.',
    noDataDescription:
      'Press refresh or run backend jobs: ingest-recent-transfers + calculate-cex-flows.',
    source: 'Source',
    dataMode: 'Mode',
    regimeHint: 'Regime hint',
    rows: 'Days',
    processed: 'Processed'
  }
};

function getLanguage() {
  const saved = localStorage.getItem('tfr_language');

  if (saved === 'en') return 'en';
  return 'ru';
}

function getNetflowHint(value, dictionary) {
  const numberValue = Number(value || 0);

  if (numberValue > 0) return dictionary.netflowHintPositive;
  if (numberValue < 0) return dictionary.netflowHintNegative;

  return dictionary.netflowHintNeutral;
}

function getNetflowBadgeClass(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0) {
    return 'border-red-500/40 bg-red-500/10 text-red-300';
  }

  if (numberValue < 0) {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  }

  return 'border-slate-700 bg-slate-800 text-slate-300';
}

export default function RealRecentCexFlowPanel({
  cexFlows,
  refreshStatus,
  refreshMessage,
  onRefresh
}) {
  const language = getLanguage();
  const dictionary = labels[language];

  const summary = cexFlows?.summary || null;

  const txCount = useMemo(() => {
    if (!summary) return 0;

    return Number(summary.inflowTxCount || 0) + Number(summary.outflowTxCount || 0);
  }, [summary]);

  return (
    <section className="space-y-6">
      <Card
        title={dictionary.title}
        subtitle={dictionary.subtitle}
        right={
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshStatus === 'loading'}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshStatus === 'loading' ? dictionary.refreshing : dictionary.refresh}
          </button>
        }
      >
        {refreshMessage && (
          <div
            className={[
              'mb-5 rounded-2xl border px-4 py-3 text-sm',
              refreshStatus === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            ].join(' ')}
          >
            {refreshMessage}
          </div>
        )}

        {summary ? (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-4">
              <MetricCard
                label={dictionary.netflow}
                value={formatNumber(summary.cexNetflow)}
                hint={getNetflowHint(summary.cexNetflow, dictionary)}
                signed
                right={
                  <Badge className={getNetflowBadgeClass(summary.cexNetflow)}>
                    {summary.regimeHint || 'UNKNOWN'}
                  </Badge>
                }
              />

              <MetricCard
                label={dictionary.inflow}
                value={formatNumber(summary.cexInflow)}
                hint={dictionary.inflowHint}
              />

              <MetricCard
                label={dictionary.outflow}
                value={formatNumber(summary.cexOutflow)}
                hint={dictionary.outflowHint}
              />

              <MetricCard
                label={dictionary.txCount}
                value={formatNumber(txCount, 0)}
                hint={`${dictionary.rows}: ${cexFlows?.items?.length || 0}`}
              />
            </div>

            <div className="grid gap-3 text-xs text-slate-500 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {dictionary.source}
                </p>
                <p className="mt-2 break-all font-mono text-slate-300">
                  {cexFlows.source || '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {dictionary.dataMode}
                </p>
                <p className="mt-2 font-mono text-emerald-300">
                  {cexFlows.dataMode || 'unknown'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {dictionary.regimeHint}
                </p>
                <p className="mt-2 font-mono text-slate-300">
                  {summary.regimeHint || '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
            <p className="font-semibold text-slate-300">{dictionary.noData}</p>
            <p className="mt-2 text-sm text-slate-500">{dictionary.noDataDescription}</p>
          </div>
        )}
      </Card>

      {summary && <CexFlowChart cexFlows={cexFlows} />}
    </section>
  );
}
