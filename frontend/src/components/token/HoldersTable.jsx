import { useTranslation } from '../../i18n/useTranslation';
import { formatNumber, shortAddress } from '../../utils/format';
import Badge from '../common/Badge';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';

export default function HoldersTable({ holders }) {
  const { t } = useTranslation();

  return (
    <Card title={t('token.topHolders')} subtitle={t('token.topHoldersSubtitle')}>
      {holders?.items?.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">{t('token.rank')}</th>
                <th className="px-4 py-3">{t('token.address')}</th>
                <th className="px-4 py-3">{t('token.label')}</th>
                <th className="px-4 py-3">{t('token.type')}</th>
                <th className="px-4 py-3 text-right">{t('token.balance')}</th>
                <th className="px-4 py-3 text-right">{t('token.change7d')}</th>
              </tr>
            </thead>

            <tbody>
              {holders.items.map((holder) => (
                <tr key={holder.id} className="table-row">
                  <td className="px-4 py-3 font-semibold text-slate-300">
                    {holder.rank}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {shortAddress(holder.address.address)}
                  </td>
                  <td className="px-4 py-3">
                    {holder.address.label || holder.address.entity?.name || t('common.unknown')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        holder.isCex
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }
                    >
                      {holder.isCex ? t('token.cex') : t('token.nonCex')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatNumber(holder.balanceDecimal)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatNumber(holder.balanceChange7d)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={t('common.noHolders')}
          description={t('token.noHoldersDescription')}
        />
      )}
    </Card>
  );
}
