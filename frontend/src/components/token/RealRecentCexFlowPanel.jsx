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

const RANGE_OPTIONS = [
  {
    value: '1d',
    label: '1D',
    days: 1,
    blocksBack: 7200
  },
  {
    value: '7d',
    label: '7D',
    days: 7,
    blocksBack: 50400
  },
  {
    value: '1m',
    label: '1M',
    days: 30,
    blocksBack: 216000
  },
  {
    value: '1y',
    label: '1Y',
    days: 365,
    blocksBack: 2630000
  }
];

const labels = {
  ru: {
    title: 'Real Recent CEX Flows',
    subtitle:
      'Отдельный real-data слой. Диапазон считается от последней доступной даты в данных, а не от сегодняшнего дня.',
    refresh: 'Обновить выбранный диапазон + USD',
    refreshing: 'Обновляем recent CEX flows и USD...',
    netflow: 'Netflow',
    inflow: 'Inflow на CEX',
    outflow: 'Outflow с CEX',
    txCount: 'Tx count',
    activeDays: 'Активных дней',
    largeInflow: 'Large inflows',
    largeOutflow: 'Large outflows',
    usd: 'USD',
    uni: 'UNI',
    range: 'Диапазон',
    calendarWindow: 'Календарное окно',
    activeFlowWindow: 'Окно с flow-данными',
    latestDataDate: 'Последняя дата данных',
    loadedRows: 'Загружено дневных строк',
    inflowHint: 'Завод на CEX = возможное давление продажи',
    outflowHint: 'Вывод с CEX = supply drain / снижение доступного supply',
    netflowHintPositive: 'CEX balance растет: возможный sell pressure',
    netflowHintNegative: 'CEX balance падает: supply drain',
    netflowHintNeutral: 'Нет явного перекоса',
    largeHint: 'Крупные движения по USD. Следующий backend-шаг — настраиваемый threshold.',
    noData: 'Нет данных для выбранного диапазона.',
    noDataDescription:
      'Нажми обновление выбранного диапазона. Важно: если API вернул только старые дни, 1D/7D могут быть пустыми.',
    source: 'Источник',
    dataMode: 'Режим',
    regimeHint: 'Подсказка режима',
    valuation: 'Valuation',
    price: 'Цена',
    updated: 'Обновлено',
    warning:
      'USD valuation использует текущую цену CoinGecko. Для recent flows это нормально, но это не историческая бухгалтерия.'
  },
  en: {
    title: 'Real Recent CEX Flows',
    subtitle:
      'Separate real-data layer. Range is calculated from the latest available data date, not from today.',
    refresh: 'Refresh selected range + USD',
    refreshing: 'Refreshing recent CEX flows and USD...',
    netflow: 'Netflow',
    inflow: 'CEX Inflow',
    outflow: 'CEX Outflow',
    txCount: 'Tx count',
    activeDays: 'Active flow days',
    largeInflow: 'Large inflows',
    largeOutflow: 'Large outflows',
    usd: 'USD',
    uni: 'UNI',
    range: 'Range',
    calendarWindow: 'Calendar window',
    activeFlowWindow: 'Flow-data window',
    latestDataDate: 'Latest data date',
    loadedRows: 'Loaded daily rows',
    inflowHint: 'CEX inflow = possible sell pressure',
    outflowHint: 'CEX outflow = supply drain / lower available supply',
    netflowHintPositive: 'CEX balance is rising: possible sell pressure',
    netflowHintNegative: 'CEX balance is falling: supply drain',
    netflowHintNeutral: 'No clear imbalance',
    largeHint: 'Large USD movements. Next backend step is configurable threshold.',
    noData: 'No data for selected range.',
    noDataDescription:
      'Refresh selected range. Important: if the API returned only older days, 1D/7D can be empty.',
    source: 'Source',
    dataMode: 'Mode',
    regimeHint: 'Regime hint',
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

function getRangeOption(range) {
  return RANGE_OPTIONS.find((item) => item.value === range) || RANGE_OPTIONS[2];
}

function parseDate(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatDate(date) {
  if (!date) return '—';

  if (typeof date === 'string') return date;

  return date.toISOString().slice(0, 10);
}

function sortItemsAsc(items = []) {
  return [...items].sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

function getDateRangeLabel(items = []) {
  if (!items.length) return '—';

  const sorted = sortItemsAsc(items);

  return `${sorted[0].date} → ${sorted[sorted.length - 1].date}`;
}

function getCalendarWindow(items = [], range) {
  if (!items.length) {
    return {
      fromDate: null,
      toDate: null,
      label: '—'
    };
  }

  const selectedRange = getRangeOption(range);
  const sorted = sortItemsAsc(items);
  const latestDate = parseDate(sorted[sorted.length - 1].date);

  const fromDate = new Date(latestDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - selectedRange.days + 1);

  return {
    fromDate,
    toDate: latestDate,
    label: `${formatDate(fromDate)} → ${formatDate(latestDate)}`
  };
}

function filterItemsByRange(items = [], range) {
  if (!items.length) return [];

  const { fromDate } = getCalendarWindow(items, range);

  if (!fromDate) return [];

  return sortItemsAsc(items).filter((item) => parseDate(item.date) >= fromDate);
}

function sumItems(items = []) {
  return items.reduce(
    (acc, item) => {
      acc.cexInflow += Number(item.cexInflow || 0);
      acc.cexOutflow += Number(item.cexOutflow || 0);
      acc.cexNetflow += Number(item.cexNetflow || 0);

      acc.cexInflowUsd += Number(item.cexInflowUsd || 0);
      acc.cexOutflowUsd += Number(item.cexOutflowUsd || 0);
      acc.cexNetflowUsd += Number(item.cexNetflowUsd || 0);

      acc.inflowTxCount += Number(item.inflowTxCount || 0);
      acc.outflowTxCount += Number(item.outflowTxCount || 0);

      acc.largeInflowCount += Number(item.largeInflowCount || 0);
      acc.largeOutflowCount += Number(item.largeOutflowCount || 0);

      return acc;
    },
    {
      cexInflow: 0,
      cexOutflow: 0,
      cexNetflow: 0,
      cexInflowUsd: 0,
      cexOutflowUsd: 0,
      cexNetflowUsd: 0,
      inflowTxCount: 0,
      outflowTxCount: 0,
      largeInflowCount: 0,
      largeOutflowCount: 0
    }
  );
}

function getRegimeHintFromNetflow(netflow) {
  const numberValue = Number(netflow || 0);

  if (numberValue > 0) return 'CEX_SELL_PRESSURE';
  if (numberValue < 0) return 'CEX_SUPPLY_DRAIN';

  return 'NEUTRAL';
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

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-slate-200">
        {value}
      </p>
    </div>
  );
}

export default function RealRecentCexFlowPanel({
  cexFlows,
  refreshStatus,
  refreshMessage,
  valuation,
  selectedRange,
  onRangeChange,
  onRefresh
}) {
  const language = getLanguage();
  const dictionary = labels[language];

  const allItems = useMemo(() => {
    return sortItemsAsc(cexFlows?.items || []);
  }, [cexFlows]);

  const calendarWindow = useMemo(() => {
    return getCalendarWindow(allItems, selectedRange);
  }, [allItems, selectedRange]);

  const filteredItems = useMemo(() => {
    return filterItemsByRange(allItems, selectedRange);
  }, [allItems, selectedRange]);

  const summary = useMemo(() => {
    if (!filteredItems.length) return null;

    const result = sumItems(filteredItems);

    return {
      ...result,
      regimeHint: getRegimeHintFromNetflow(result.cexNetflow)
    };
  }, [filteredItems]);

  const rangedCexFlows = useMemo(() => {
    if (!cexFlows || !summary) return null;

    return {
      ...cexFlows,
      summary,
      items: filteredItems
    };
  }, [cexFlows, filteredItems, summary]);

  const txCount = useMemo(() => {
    if (!summary) return 0;

    return Number(summary.inflowTxCount || 0) + Number(summary.outflowTxCount || 0);
  }, [summary]);

  const selectedRangeOption = getRangeOption(selectedRange);
  const latestDataDate = allItems.length ? allItems[allItems.length - 1].date : '—';

  return (
    <section className="space-y-6">
      <Card
        title={dictionary.title}
        subtitle={dictionary.subtitle}
        right={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
              {RANGE_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onRangeChange(item.value)}
                  className={[
                    'rounded-xl px-3 py-2 text-xs font-bold transition',
                    selectedRange === item.value
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshStatus === 'loading'}
              className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshStatus === 'loading' ? dictionary.refreshing : dictionary.refresh}
            </button>
          </div>
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

        <div className="mb-5 grid gap-3 lg:grid-cols-4">
          <InfoTile
            label={dictionary.range}
            value={`${selectedRangeOption.label} · ${selectedRangeOption.days} calendar day(s)`}
          />

          <InfoTile
            label={dictionary.calendarWindow}
            value={calendarWindow.label}
          />

          <InfoTile
            label={dictionary.latestDataDate}
            value={latestDataDate}
          />

          <InfoTile
            label={dictionary.loadedRows}
            value={`${allItems.length}`}
          />
        </div>

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
                hint={`${dictionary.activeDays}: ${filteredItems.length}`}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <InfoTile
                label={dictionary.activeFlowWindow}
                value={getDateRangeLabel(filteredItems)}
              />

              <InfoTile
                label={dictionary.activeDays}
                value={`${filteredItems.length}`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <MetricCard
                label={dictionary.largeInflow}
                value={formatNumber(summary.largeInflowCount, 0)}
                hint={dictionary.largeHint}
                right={
                  <Badge className="border-red-500/40 bg-red-500/10 text-red-300">
                    Sell pressure
                  </Badge>
                }
              />

              <MetricCard
                label={dictionary.largeOutflow}
                value={formatNumber(summary.largeOutflowCount, 0)}
                hint={dictionary.largeHint}
                right={
                  <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                    Supply drain
                  </Badge>
                }
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
            <p className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-mono text-xs text-slate-500">
              loadedRows={allItems.length} · selectedRange={selectedRange} · calendarWindow={calendarWindow.label} · available={getDateRangeLabel(allItems)}
            </p>
          </div>
        )}
      </Card>

      {rangedCexFlows && (
        <CexFlowChart
          cexFlows={rangedCexFlows}
          title={`Структура CEX flows · ${selectedRangeOption.label}`}
        />
      )}
    </section>
  );
}

export { RANGE_OPTIONS };
