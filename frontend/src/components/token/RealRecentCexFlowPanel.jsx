import { useMemo } from 'react';

import {
  formatCompactUsd,
  formatNumber,
  getNetflowMarketClass
} from '../../utils/format';

import Card from '../common/Card';
import MetricCard from '../common/MetricCard';
import Badge from '../common/Badge';
import CexFlowChart from './CexFlowChart';

const labels = {
  ru: {
    title: 'Real Recent CEX Flows',
    subtitle:
      'Отдельный real-data слой: свежие transfers с известных CEX-кошельков. Теперь с USD valuation через CoinGecko.',
    refresh: 'Обновить real recent CEX flows + USD',
    refreshing: 'Обновляем recent CEX flows и USD...',
    netflow: 'Netflow',
    inflow: 'Inflow на CEX',
    outflow: 'Outflow с CEX',
    txCount: 'Tx count',
    usd: 'USD',
    uni: 'UNI',
    inflowHint: 'Завод на CEX = возможное давление продажи',
    outflowHint: 'Вывод с CEX = supply drain / снижение доступного supply',
    netflowHintPositive: 'CEX balance растет: возможный sell pressure',
    netflowHintNegative: 'CEX balance падает: supply drain',
    netflowHintNeutral: 'Нет явного перекоса',
    noData: 'Real recent CEX flows пока не рассчитаны.',
    noDataDescription:
      'Нажми кнопку обновления или запусти backend jobs: ingest-recent-transfers + value-transfers + calculate-cex-flows.',
    source: 'Источник',
    dataMode: 'Режим',
    regimeHint: 'Подсказка режима',
    rows: 'Дней',
    valuation: 'Valuation',
    price: 'Цена',
    updated: 'Обновлено',
    warning:
      'USD valuation использует текущую цену CoinGecko. Для recent flows это нормально, но это не историческая бухгалтерия.'
  },
  en: {
    title: 'Real Recent CEX Flows',
    subtitle:
      'Separate real-data layer: recent transfers from known CEX wallets. Now with USD valuation via CoinGecko.',
    refresh: 'Refresh real recent CEX flows + USD',
    refreshing: 'Refreshing recent CEX flows and USD...',
    netflow: 'Netflow',
    inflow: 'CEX Inflow',
    outflow: 'CEX Outflow',
    txCount: 'Tx count',
    usd: 'USD',
    uni: 'UNI',
    inflowHint: 'CEX inflow = possible sell pressure',
    outflowHint: 'CEX outflow = supply drain / lower available supply',
    netflowHintPositive: 'CEX balance is rising: possible sell pressure',
    netflowHintNegative: 'CEX balance is falling: supply drain',
    netflowHintNeutral: 'No clear imbalance',
    noData: 'Real recent CEX flows are not calculated yet.',
    noDataDescription:
      'Press refresh or run backend jobs: ingest-recent-transfers + value-transfers + calculate-cex-flows.',
    source: 'Source',
    dataMode: 'Mode',
    regimeHint: 'Regime hint',
    rows: 'Days',
    valuation: 'Valuation',
    price: 'Price',
    updated: 'Updated',
    warning:
      'USD valuation uses current CoinGecko price. Good enough for recent flows, but not precise historical accounting.'
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

function FlowValue({ tokenValue, usdValue, signed = false }) {
  return (
    <div>
      <p className={['text-2xl font-black', signed ? getNetflowMarketClass(tokenValue) : 'text-white'].join(' ')}>
        {formatNumber(tokenValue)}
      </p>
      <p className={['mt-1 text-sm font-semibold', signed ? getNetflowMarketClass(usdValue) : 'text-slate-400'].join(' ')}>
        {formatCompactUsd(usdValue)}
      </p>
    </div>
  );
}

export default function RealRecentCexFlowPanel({
  cexFlows,
  refreshStatus,
  refreshMessage,
  valuation,
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
                label={`${dictionary.netflow} (${dictionary.uni} / ${dictionary.usd})`}
                value={
                  <FlowValue
                    tokenValue={summary.cexNetflow}
                    usdValue={summary.cexNetflowUsd}
                    signed
                  />
                }
                hint={getNetflowHint(summary.cexNetflow, dictionary)}
                right={
                  <Badge className={getNetflowBadgeClass(summary.cexNetflow)}>
                    {summary.regimeHint || 'UNKNOWN'}
                  </Badge>
                }
              />

              <MetricCard
                label={`${dictionary.inflow} (${dictionary.uni} / ${dictionary.usd})`}
                value={
                  <FlowValue
                    tokenValue={summary.cexInflow}
                    usdValue={summary.cexInflowUsd}
                  />
                }
                hint={dictionary.inflowHint}
              />

              <MetricCard
                label={`${dictionary.outflow} (${dictionary.uni} / ${dictionary.usd})`}
                value={
                  <FlowValue
                    tokenValue={summary.cexOutflow}
                    usdValue={summary.cexOutflowUsd}
                  />
                }
                hint={dictionary.outflowHint}
              />

              <MetricCard
                label={dictionary.txCount}
                value={formatNumber(txCount, 0)}
                hint={`${dictionary.rows}: ${cexFlows?.items?.length || 0}`}
              />
            </div>

            {valuation && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
                      {dictionary.valuation}
                    </p>
                    <p className="mt-2 font-semibold text-emerald-100">
                      {valuation.provider || 'coingecko'} · {valuation.priceMode || 'current_price'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
                      {dictionary.price}
                    </p>
                    <p className="mt-2 font-semibold text-emerald-100">
                      {formatCompactUsd(valuation.priceUsd)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
                      {dictionary.updated}
                    </p>
                    <p className="mt-2 font-semibold text-emerald-100">
                      {formatNumber(valuation.updated || 0, 0)} transfers
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-emerald-100/65">
                  {dictionary.warning}
                </p>
              </div>
            )}

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
