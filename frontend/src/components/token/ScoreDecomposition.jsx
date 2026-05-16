import { useTranslation } from '../../i18n/useTranslation';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { getSignalSeverityStyles } from '../../utils/format';

export default function ScoreDecomposition({ overview, topSignal }) {
  const { t } = useTranslation();

  return (
    <Card title={t('token.scoreDecomposition')} subtitle={t('token.scoreSubtitle')}>
      <div className="space-y-4">
        <div className="soft-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{t('token.cexFlowScore')}</p>
            <p className="text-xl font-bold text-white">
              {overview.score?.cexFlowScore ?? '—'}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{
                width: `${Math.min(Math.abs(overview.score?.cexFlowScore || 0), 100)}%`
              }}
            />
          </div>
        </div>

        <div className="soft-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{t('token.holderScore')}</p>
            <p className="text-xl font-bold text-white">
              {overview.score?.holderScore ?? '—'}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${Math.min(Math.abs(overview.score?.holderScore || 0), 100)}%`
              }}
            />
          </div>
        </div>

        {topSignal && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <Badge className={getSignalSeverityStyles(topSignal.severity)}>
              {topSignal.severity}
            </Badge>
            <p className="mt-3 font-semibold text-white">{topSignal.summary}</p>
            <p className="mt-2 text-sm text-emerald-100/80">
              {topSignal.explanation}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
