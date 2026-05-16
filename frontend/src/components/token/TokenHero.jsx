import { useTranslation } from '../../i18n/useTranslation';
import { formatPercent, getRegimeStyles } from '../../utils/format';
import Badge from '../common/Badge';

export default function TokenHero({
  overview,
  refreshStatus,
  refreshMessage,
  onRefresh
}) {
  const { t } = useTranslation();

  return (
    <section className="panel overflow-hidden p-6 md:p-8">
      <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-5xl font-black tracking-tight text-white">
              {overview.symbol}
            </h1>
            <Badge className={getRegimeStyles(overview.regime)}>
              {overview.regime}
            </Badge>
          </div>

          <p className="mt-2 text-lg text-slate-400">{overview.name}</p>

          <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-300">
            {overview.explanation || overview.message || 'No explanation available yet.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-900 px-3 py-1">
              {t('common.date')}: {overview.date || '—'}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1">
              {t('common.dataMode')}: {overview.dataMode || 'unknown'}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1">
              {t('common.freshness')}: {overview.dataFreshness || 'unknown'}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1">
              {t('common.scoreVersion')}: {overview.scoreVersion || '—'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="metric-label">{t('common.finalScore')}</p>
              <p className="mt-3 text-5xl font-black text-white">
                {overview.finalScore ?? '—'}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="metric-label">{t('common.confidence')}</p>
              <p className="mt-3 text-5xl font-black text-white">
                {overview.confidence !== null && overview.confidence !== undefined
                  ? formatPercent(overview.confidence)
                  : '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshStatus === 'loading'}
            className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshStatus === 'loading'
              ? t('common.refreshing')
              : t('common.refreshData')}
          </button>

          {refreshMessage && (
            <div
              className={[
                'rounded-2xl border px-4 py-3 text-sm',
                refreshStatus === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              ].join(' ')}
            >
              {refreshMessage}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
