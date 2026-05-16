import { useTranslation } from '../../i18n/useTranslation';

export default function EmptyState({ title, description }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
      <p className="font-semibold text-slate-300">
        {title || t('common.noData')}
      </p>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}
