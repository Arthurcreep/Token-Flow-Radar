import { useTranslation } from '../../i18n/useTranslation';
import Card from '../common/Card';

export default function CexFlowActorsPlaceholder() {
  const { t } = useTranslation();

  return (
    <Card title={t('token.actorsTitle')} subtitle={t('token.actorsSubtitle')}>
      <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-sm leading-6 text-amber-100/85">
          {t('token.actorsBody')}
        </p>
        <p className="mt-4 rounded-xl bg-slate-950/60 p-3 font-mono text-xs text-amber-100/70">
          {t('token.actorsRequirement')}
        </p>
      </div>
    </Card>
  );
}
