import { useTranslation } from '../../i18n/useTranslation';
import { formatNumber, formatUsd } from '../../utils/format';
import MetricCard from '../common/MetricCard';

export default function CexFlowSummary({ overview }) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <MetricCard
        label={t('token.cexNetflow7d')}
        value={formatNumber(overview.cex?.netflow7d)}
        hint={
          overview.cex?.netflowUsd7d
            ? formatUsd(overview.cex?.netflowUsd7d)
            : t('token.cexNetflowHint')
        }
        signed
      />

      <MetricCard
        label={t('token.cexInflow7d')}
        value={formatNumber(overview.cex?.inflow7d)}
        hint={t('token.cexInflowHint')}
      />

      <MetricCard
        label={t('token.cexOutflow7d')}
        value={formatNumber(overview.cex?.outflow7d)}
        hint={t('token.cexOutflowHint')}
      />

      <MetricCard
        label={t('token.nonCexHolderChange')}
        value={formatNumber(overview.holders?.nonCexBalanceChange7d)}
        hint={t('token.holderChangeHint')}
        signed
      />
    </section>
  );
}
