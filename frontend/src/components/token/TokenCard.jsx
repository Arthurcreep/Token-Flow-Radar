import { Link } from 'react-router-dom';

import { useTranslation } from '../../i18n/useTranslation';
import { formatPercent, getRegimeStyles, shortAddress } from '../../utils/format';
import Badge from '../common/Badge';
import DataModeBadge from '../data/DataModeBadge';

export default function TokenCard({ token, overview }) {
  const { t } = useTranslation();
  const regime = overview?.regime || 'UNCLEAR';

  return (
    <Link
      to={`/tokens/${token.symbol}`}
      className="group panel block p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900/90"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-black tracking-tight text-white">
              {token.symbol}
            </h2>
            <Badge className={getRegimeStyles(regime)}>{regime}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{token.name}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-right">
          <p className="text-xs text-slate-500">{t('common.score')}</p>
          <p className="text-2xl font-bold text-white">
            {overview?.finalScore ?? '—'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <DataModeBadge
          dataMode={overview?.dataMode || 'not_calculated'}
          sourceLabel={overview?.sourceLabel}
          sourceWarning={overview?.sourceWarning}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-500">{t('common.confidence')}</p>
          <p className="mt-1 text-lg font-semibold text-slate-200">
            {overview?.confidence !== null && overview?.confidence !== undefined
              ? formatPercent(overview.confidence)
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-500">{t('common.freshness')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {overview?.dataFreshness || 'unknown'}
          </p>
        </div>
      </div>

      <p className="mt-5 break-all rounded-xl bg-slate-950/50 p-3 font-mono text-xs text-slate-500">
        {shortAddress(token.contractAddress)} · {token.chain}
      </p>

      <div className="mt-5 text-sm font-semibold text-cyan-300 opacity-0 transition group-hover:opacity-100">
        {t('common.openTokenDashboard')} →
      </div>
    </Link>
  );
}
