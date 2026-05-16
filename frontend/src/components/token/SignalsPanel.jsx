import { useTranslation } from '../../i18n/useTranslation';
import {
  formatDateTime,
  formatPercent,
  getRegimeStyles,
  getSignalSeverityStyles
} from '../../utils/format';

import Badge from '../common/Badge';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import DataModeBadge from '../data/DataModeBadge';

export default function SignalsPanel({ signals, title }) {
  const { t } = useTranslation();

  return (
    <Card title={title || t('signals.latestSignals')}>
      {signals.length ? (
        <div className="space-y-4">
          {signals.map((signal) => (
            <article
              key={signal.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-slate-700"
            >
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
                    <Badge className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                      {signal.token.symbol}
                    </Badge>
                    <Badge className={getRegimeStyles(signal.regime)}>
                      {signal.regime}
                    </Badge>
                    <Badge className={getSignalSeverityStyles(signal.severity)}>
                      {signal.severity}
                    </Badge>
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-white">
                    {signal.summary}
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                    {signal.explanation}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-600">
                    {signal.signalType}
                  </p>
                </div>

                <div className="grid min-w-[240px] grid-cols-2 gap-3 lg:text-right">
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">{t('common.score')}</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {signal.score}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">{t('common.confidence')}</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {formatPercent(signal.confidence)}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Timestamp</p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {formatDateTime(signal.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('common.noSignals')}
          description={t('signals.noSignalsDescription')}
        />
      )}
    </Card>
  );
}
