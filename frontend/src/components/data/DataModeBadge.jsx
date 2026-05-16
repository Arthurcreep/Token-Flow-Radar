import { useTranslation } from '../../i18n/useTranslation';

export default function DataModeBadge({ dataMode, sourceLabel, sourceWarning }) {
  const { t } = useTranslation();

  const config = {
    real: [
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
      t('dataMode.realTitle')
    ],
    mixed: [
      'border-amber-500/40 bg-amber-500/10 text-amber-200',
      t('dataMode.mixedTitle')
    ],
    fake: [
      'border-red-500/40 bg-red-500/10 text-red-200',
      t('dataMode.fakeTitle')
    ],
    not_calculated: [
      'border-slate-700 bg-slate-800/60 text-slate-300',
      t('dataMode.notCalculatedTitle')
    ],
    unknown: [
      'border-slate-700 bg-slate-800/60 text-slate-300',
      t('dataMode.unknownTitle')
    ]
  };

  const [className, title] = config[dataMode] || config.unknown;

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>
      <span className="font-bold uppercase tracking-[0.18em]">{title}</span>

      {sourceLabel && (
        <span className="ml-2 opacity-80">{sourceLabel}</span>
      )}

      {sourceWarning && (
        <p className="mt-2 text-xs leading-5 opacity-70">{sourceWarning}</p>
      )}
    </div>
  );
}
